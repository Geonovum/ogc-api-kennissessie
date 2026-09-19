import { join } from "path";
import { existsSync, readdirSync } from "fs";
import spawn from "node:child_process";
import {
  startJob,
  succeedJob,
  failJob,
} from "../../src/models/processes/subscriber.js";

function invalidParameterValue(detail) {
  return {
    httpCode: 400,
    type: "InvalidParameterValue",
    title: "InvalidParameterValue",
    detail,
    description: detail,
  };
}

function processDirectory(process_) {
  return process_.location.replace(/\.[^/.]+$/, "");
}

function findScript(processDir, processId, extension) {
  const named = join(processDir, `${processId}${extension}`);
  if (existsSync(named)) return named;

  const match = readdirSync(processDir).find(
    (name) => name.endsWith(extension) && name !== "launch.js",
  );
  return match ? join(processDir, match) : undefined;
}

function selectedOutputs(outputs, parameters) {
  return Object.entries(outputs).filter(
    ([key]) =>
      parameters.outputs == undefined || parameters.outputs[key] != undefined,
  );
}

function parseStdoutValues(value, outputs, parameters) {
  var text = Buffer.isBuffer(value) ? value.toString() : String(value);
  const selected = selectedOutputs(outputs, parameters);
  if (selected.length === 1 && selected[0][1].schema?.type === "string")
    return [text.replace(/\r?\n$/, "")];
  return text.trim().split(/\s+/).filter(Boolean);
}

function processOutputs(outputs, parameters, value) {
  let content = {};
  const values = parseStdoutValues(value, outputs, parameters);
  let index = 0;

  if (parameters.outputs != undefined) {
    for (let key of Object.keys(parameters.outputs)) {
      if (outputs[key] == undefined)
        throw new Error(
          `The ${key} argument specified as ResponseDocument identifier was not recognized.`,
        );
    }
  }

  for (let [key, output] of Object.entries(outputs)) {
    if (parameters.outputs != undefined)
      if (parameters.outputs[key] == undefined) continue;

    var raw = values[index++];
    if (output.schema.type === "number") content[key] = Number(raw);
    else if (output.schema.type === "string") content[key] = String(raw);
    else if (output.schema.type === "boolean") content[key] = Boolean(raw);
    else if (output.schema.type === "object") content[key] = JSON.parse(raw);
    else if (output.schema.type === "array") content[key] = JSON.parse(raw);
  }

  return content;
}

/**
 * Default launcher for processes that ship a .sh / .bat next to the process JSON.
 * A process folder may still provide its own launch.js to override this.
 */
export async function launch(process_, job, isAsync, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process_.inputs)) {
    if (parameters.inputs[key] == undefined)
      return callback(
        { httpCode: 400, description: `${key} not found` },
        undefined,
      );
    values.push(
      typeof parameters.inputs[key] === "object"
        ? JSON.stringify(parameters.inputs[key])
        : parameters.inputs[key],
    );
  }

  const processDir = processDirectory(process_);
  var command = "";
  var params = [];

  switch (process.platform) {
    case "darwin":
    case "aix":
    case "freebsd":
    case "linux":
    case "openbsd":
    case "sunos":
    case "android": {
      const shellScript = findScript(processDir, process_.id, ".sh");
      if (!shellScript)
        return callback(
          {
            httpCode: 500,
            description: `No .sh script found for process ${process_.id}`,
          },
          undefined,
        );
      command = shellScript;
      params = values.map(String);
      break;
    }
    case "win32": {
      const batScript = findScript(processDir, process_.id, ".bat");
      if (!batScript)
        return callback(
          {
            httpCode: 500,
            description: `No .bat script found for process ${process_.id}`,
          },
          undefined,
        );
      command = join("cmd.exe");
      params = ["/c", batScript, ...values.map(String)];
      break;
    }
    default:
      console.log(`Unknown platform ${process.platform} to launch process`);
      return callback({ httpCode: 500, description: job.message }, undefined);
  }

  console.log(`launch ${command} ${params} on ${process.platform}`);

  if (isAsync) {
    let child = undefined;
    try {
      child = spawn.spawn(command, params);
    } catch (err) {
      failJob(job, err.message);
      return callback({ httpCode: 500, description: err.message }, undefined);
    }

    job.child = child;
    startJob(job);

    child.stdout.on("data", (d) => {
      if (job.status === "dismissed") return;

      let content;
      try {
        content = processOutputs(process_.outputs, parameters, d);
      } catch (err) {
        failJob(job, err.message);
        return;
      }

      succeedJob(job, content);
    });

    child.stderr.on("data", (d) => {
      if (job.status === "dismissed") return;
      failJob(job, d.toString());
    });

    child.on("close", () => {
      // not sure what to do here
    });

    return callback(undefined, undefined);
  }

  startJob(job);

  let child = undefined;
  try {
    child = spawn.spawnSync(command, params);
  } catch (err) {
    failJob(job, err.message);
    return callback({ httpCode: 500, description: err.message }, undefined);
  }

  let errMsg = child.stderr.toString();
  if (errMsg.length !== 0) {
    failJob(job, errMsg);
    return callback({ httpCode: 500, description: job.message }, undefined);
  }

  let content;
  try {
    content = processOutputs(process_.outputs, parameters, child.stdout);
  } catch (err) {
    failJob(job, err.message);
    return callback(invalidParameterValue(job.message), undefined);
  }

  succeedJob(job, content);
  return callback(undefined, content);
}
