import { join } from "path";
import spawn from "node:child_process";
import http from "node:http";
import https from "node:https";

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

function httpPost(url, body) {
  const parsed = new URL(url);
  const isHttps = parsed.protocol === "https:";
  const lib = isHttps ? https : http;
  const data = typeof body === "object" ? JSON.stringify(body) : body;
  const req = lib.request(
    {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    },
    (res) => {
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => console.log(Buffer.concat(chunks).toString()));
    },
  );
  req.on("error", (err) => console.log(err));
  req.write(data);
  req.end();
}

function parseStdoutValues(value) {
  var text = Buffer.isBuffer(value) ? value.toString() : String(value);
  return text.trim().split(/\s+/).filter(Boolean);
}

function processOutputs(outputs, parameters, value) {
  let content = {};
  const values = parseStdoutValues(value);
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
 * Description placeholder
 *
 * @export
 * @param {*} job
 * @param {*} parameters
 * @param {*} callback
 * @returns {*}
 */
export async function launch(process_, job, isAsync, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process_.inputs)) {
    if (parameters.inputs[key] == undefined)
      return callback(
        { httpCode: 400, description: `${key} not found` },
        undefined,
      );
    values.push(parameters.inputs[key]);
  }

  var command = "";
  var params = "";

  switch (process.platform) {
    case "darwin":
    case "aix":
    case "freebsd":
    case "linux":
    case "openbsd":
    case "sunos":
    case "android":
      let shellScript = "divide.sh";
      command = join(__dirname, shellScript);
      params = [values[0], values[1]];
      break;
    case "win32":
      let batScript = "divide.bat";
      command = join("cmd.exe");
      params = ["/c", join(__dirname, batScript), values[0], values[1]];
      break;
    default:
      console.log(`Unknown platform ${process.platform} to launch Add module`);
      return callback({ httpCode: 500, description: job.message }, undefined);
  }

  console.log(`launch ${command} ${params} on ${process.platform}`);

  if (isAsync) {
    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    let child = undefined;
    try {
      child = spawn.spawn(command + " " + params.join(" "), { shell: true });
    } catch (err) {
      console.log(err);
    }

    job.child = child;

    child.stdout.on("data", (d) => {
      if (job.status === "dismissed") return;

      let content;
      try {
        content = processOutputs(process_.outputs, parameters, d);
      } catch (err) {
        delete job.child;
        job.status = "failed";
        job.progress = 100;
        job.message = err.message;
        job.finished = new Date().toISOString();
        job.updated = new Date().toISOString();

        if (process_.subscriber && process_.subscriber.failedUri) {
          httpPost(process_.subscriber.failedUri, { message: job.message });
        }
        return;
      }

      delete job.child;
      job.status = "successful"; // accepted, successful, failed, dismissed
      job.progress = 100;
      job.message = `Job complete`;
      job.finished = new Date().toISOString();
      job.updated = new Date().toISOString();
      job.results = content;

      if (parameters.subscriber && parameters.subscriber.successUri) {
        httpPost(parameters.subscriber.successUri, content);
      }
    });

    child.stderr.on("data", (d) => {
      if (job.status === "dismissed") return;

      delete job.child;
      job.status = "failed"; // accepted, successful, failed, dismissed
      job.progress = 100;
      job.message = d.toString();
      job.finished = new Date().toISOString();
      job.updated = new Date().toISOString();

      if (process_.subscriber && process_.subscriber.failedUri) {
        httpPost(process_.subscriber.failedUri, { message: job.message });
      }
    });

    child.on("close", () => {
      // not sure what to do here
    });

    return callback(undefined, undefined);
  } else {
    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    let child = undefined;
    try {
      child = spawn.spawnSync(command + " " + params.join(' '),  { shell: true });
    } catch (err) {
      return callback({ httpCode: 500, description: err.message }, undefined);
    }

    let errMsg = child.stderr.toString();
    if (errMsg.length !== 0) {
      job.status = "failed"; // accepted, successful, failed, dismissed
      job.progress = 100;
      job.message = errMsg;
      job.finished = new Date().toISOString();
      job.updated = new Date().toISOString();

      // if a callback uri is given, send a message of the failure
      if (process_.subscriber && process_.subscriber.failedUri) {
        httpPost(process_.subscriber.failedUri, { message: job.message });
      }

      // regular error callback
      return callback({ httpCode: 500, description: job.message }, undefined);
    }

    let content;
    try {
      content = processOutputs(process_.outputs, parameters, child.stdout);
    } catch (err) {
      job.status = "failed";
      job.progress = 100;
      job.message = err.message;
      job.finished = new Date().toISOString();
      job.updated = new Date().toISOString();

      if (process_.subscriber && process_.subscriber.failedUri) {
        httpPost(process_.subscriber.failedUri, { message: job.message });
      }

      return callback(
        {
          httpCode: 400,
          type: "InvalidParameterValue",
          title: "InvalidParameterValue",
          detail: job.message,
          description: job.message,
        },
        undefined,
      );
    }

    job.status = "successful"; // accepted, successful, failed, dismissed
    job.progress = 100;
    job.message = `Job complete`;
    job.finished = new Date().toISOString();
    job.updated = new Date().toISOString();
    job.results = content;

    if (process_.subscriber && process_.subscriber.successUri) {
      httpPost(process_.subscriber.successUri, content);
    }

    return callback(undefined, content);
  }
}
