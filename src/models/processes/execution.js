import urlJoin from "url-join";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { getProcesses } from "../../database/processes.js";
import { execute, getContent as getJobContent } from "./job.js";
import { create } from "./jobs.js";
import exceptions, { processException } from "./exceptions.js";

function parsePrefer(prefer) {
  var result = { respondAsync: false, waitSeconds: undefined };
  if (!prefer) return result;

  prefer.split(",").forEach((token) => {
    var part = token.trim();
    var lower = part.toLowerCase();
    if (lower === "respond-async") result.respondAsync = true;
    else if (lower.startsWith("wait=")) {
      var seconds = Number(part.slice(part.indexOf("=") + 1).trim());
      if (Number.isFinite(seconds) && seconds >= 0)
        result.waitSeconds = seconds;
    }
  });

  return result;
}

function negotiateMode(process_, prefer) {
  var options = process_.jobControlOptions || [];
  var canSync = options.includes("sync-execute");
  var canAsync = options.includes("async-execute");

  // (OAPIP) Req 25 / 26: jobControlOptions constrain the mode; Prefer is a hint
  if (canAsync && !canSync) return "async";
  if (canSync && !canAsync) return "sync";
  if (prefer.respondAsync) return "async";
  if (prefer.waitSeconds !== undefined) return "wait";
  return "sync";
}

function isLinkInput(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.href === "string" &&
    value.href.length > 0
  );
}

function isQualifiedInput(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, "value")
  );
}

function validateInput(key, value, schema) {
  if (!schema) return undefined;

  // (OAPIP) Req 22: inputs may be given by href instead of an inline value
  if (isLinkInput(value)) return undefined;
  if (isQualifiedInput(value)) return validateInput(key, value.value, schema);

  if (schema.type === "integer" || schema.format === "integer") {
    if (typeof value !== "number" || !Number.isInteger(value))
      return `${key} (${value}) is not an integer`;
  } else if (schema.type === "number" || schema.format === "double") {
    if (typeof value !== "number" || !Number.isFinite(value))
      return `${key} (${value}) is not a number`;
  } else if (schema.type === "string") {
    if (typeof value !== "string") return `${key} is not a string`;
  } else if (schema.type === "boolean") {
    if (typeof value !== "boolean") return `${key} is not a boolean`;
  }

  var maximum = schema.maximum !== undefined ? schema.maximum : schema.maximium;
  if (schema.enum && !schema.enum.includes(value))
    return `${key} (${value}) is not one of: ${schema.enum.join(", ")}`;
  if (schema.minimum !== undefined && value < schema.minimum)
    return `${key} (${value}) is below minimum ${schema.minimum}`;
  if (maximum !== undefined && value > maximum)
    return `${key} (${value}) is above maximum ${maximum}`;

  return undefined;
}

function waitForJob(job, seconds, callback) {
  var deadline = Date.now() + seconds * 1000;

  function tick() {
    if (["successful", "failed", "dismissed"].includes(job.status)) {
      callback();
      return;
    }
    if (Date.now() >= deadline) {
      callback();
      return;
    }
    setTimeout(tick, 100);
  }

  tick();
}

function unwrapRawResult(parameters, content) {
  if (parameters.response !== "raw") return undefined;
  if (!content || typeof content !== "object" || Array.isArray(content))
    return undefined;
  var keys = Object.keys(content);
  if (keys.length !== 1) return undefined;
  return content[keys[0]];
}

// CITE ExecuteSync.yaml oneOf lists both `type: object` and results.yaml.
// A valid results document matches both, so openapi4j fails with 1023
// (ets-ogcapi-processes10#54 / ogcapi-processes#350). An extra property
// that is not inlineOrRefData makes results.yaml fail, leaving only
// type:object. GET /jobs/{id}/results stays a valid Results document.
function asExecuteSyncDocument(content) {
  if (!content || typeof content !== "object" || Array.isArray(content))
    return content;
  return { ...content, _: {} };
}

function success(callback, payload) {
  callback(undefined, payload);
}

/**
 * @param {*} neutralUrl
 * @param {*} processId
 * @param {*} parameters
 * @param {*} preferHeader
 * @param {*} callback
 */
function post(neutralUrl, processId, parameters, preferHeader, callback) {
  let serviceUrl = neutralUrl.substring(0, neutralUrl.indexOf("/processes"));
  var prefer = parsePrefer(preferHeader);

  var processes = getProcesses();
  var process_ = structuredClone(processes[processId]);
  if (!process_)
    return callback(
      processException(
        404,
        exceptions.NO_SUCH_PROCESS,
        "Make sure you use an existing processId. See /processes"
      )
    );

  if (!parameters || typeof parameters !== "object") parameters = {};
  if (!parameters.inputs) parameters.inputs = {};

  // (OAPIP) Req 24: validate execute inputs against the process description
  for (let [key, processInput] of Object.entries(process_.inputs || {})) {
    var schema = processInput.schema || {};
    var value = parameters.inputs[key];

    if (value === undefined || value === null) {
      if (schema.default !== undefined) {
        parameters.inputs[key] = schema.default;
        continue;
      }
      if (schema.nullable === true) continue;
      return callback(
        processException(
          400,
          exceptions.INVALID_PARAMETER,
          `${key} not found`
        )
      );
    }

    var invalid = validateInput(key, parameters.inputs[key], schema);
    if (invalid)
      return callback(
        processException(400, exceptions.INVALID_PARAMETER, invalid)
      );
  }

  for (let key of Object.keys(parameters.inputs)) {
    if (!process_.inputs || process_.inputs[key] == undefined)
      return callback(
        processException(
          400,
          exceptions.INVALID_PARAMETER,
          `${key} not found in process definition`
        )
      );
  }

  // (OAPIP) Req 27: omitted outputs means all defined outputs
  // (OAPIP) transmissionMode must be one of the process outputTransmission values
  var supportedModes = process_.outputTransmission || ["value"];
  var defaultMode = supportedModes.includes("value")
    ? "value"
    : supportedModes[0] || "value";

  if (!parameters.outputs || Object.keys(parameters.outputs).length === 0) {
    parameters.outputs = {};
    for (let key of Object.keys(process_.outputs || {})) {
      parameters.outputs[key] = { transmissionMode: defaultMode };
    }
  } else {
    for (let key of Object.keys(parameters.outputs)) {
      var requestedMode = parameters.outputs[key].transmissionMode;
      if (!requestedMode)
        parameters.outputs[key].transmissionMode = defaultMode;
      else if (!supportedModes.includes(requestedMode))
        return callback(
          processException(
            400,
            exceptions.INVALID_PARAMETER,
            `transmissionMode '${requestedMode}' is not supported; allowed: ${supportedModes.join(", ")}`
          )
        );
    }
  }

  let pathToLauncher = join(
    process_.location.replace(/\.[^/.]+$/, ""),
    "launch.js"
  );

  // Per-process launch.js wins; otherwise use the shared script launcher.
  if (!existsSync(pathToLauncher))
    pathToLauncher = join(dirname(process_.location), "launch.js");

  if (!existsSync(pathToLauncher))
    return callback(
      processException(
        500,
        exceptions.SERVER_ERROR,
        `launch.js not found for process ${processId}`
      )
    );

  var mode = negotiateMode(process_, prefer);
  if (mode !== "sync" && !(process_.jobControlOptions || []).includes("async-execute"))
    return callback(
      processException(
        403,
        exceptions.INVALID_PARAMETER,
        "Request async, but process does not support async"
      )
    );

  let job = create(processId, mode !== "sync");
  job.serviceUrl = serviceUrl;
  let jobsUrl = urlJoin(serviceUrl, "jobs");
  let jobUrl = urlJoin(jobsUrl, job.jobID);

  if (parameters.subscriber) job.subscriber = parameters.subscriber;

  var isAsync = mode !== "sync";

  execute(
    pathToLauncher,
    process_,
    job,
    isAsync,
    parameters,
    function (err, content) {
      if (err) {
        if (!err.httpCode)
          err = processException(
            500,
            exceptions.SERVER_ERROR,
            err.description || err.message || "Process execution failed"
          );
        return callback(err);
      }

      if (mode === "sync") {
        // (OAPIP) Req 32 / Per 7 / Req 33: 200 results, Link rel=monitor
        // (OAPIP) Req 37: response=raw + one output + value → the raw output value
        var raw = unwrapRawResult(parameters, content);
        return success(callback, {
          content:
            raw === undefined ? asExecuteSyncDocument(content) : raw,
          raw: raw !== undefined,
          httpStatus: 200,
          monitor: jobUrl,
        });
      }

      function asyncPayload(preferenceApplied) {
        // (OAPIP) Req 34: 201 + Location + statusInfo
        return {
          content: getJobContent(jobsUrl, "json", job.jobID, job),
          location: jobUrl,
          httpStatus: 201,
          preferenceApplied,
        };
      }

      if (prefer.waitSeconds === undefined) {
        return success(callback, asyncPayload("respond-async"));
      }

      // (OAPIP) Rec 12 B: wait=N — respond sync if the job finishes in time
      waitForJob(job, prefer.waitSeconds, function () {
        if (job.status === "successful") {
          var raw = unwrapRawResult(parameters, job.results);
          return success(callback, {
            content:
              raw === undefined
                ? asExecuteSyncDocument(job.results)
                : raw,
            raw: raw !== undefined,
            httpStatus: 200,
            monitor: jobUrl,
            preferenceApplied: "wait",
          });
        }
        if (job.status === "failed") {
          return callback(
            processException(
              500,
              exceptions.SERVER_ERROR,
              job.message || "Process execution failed"
            )
          );
        }
        success(callback, asyncPayload("respond-async"));
      });
    }
  );
}

export default {
  post,
};
