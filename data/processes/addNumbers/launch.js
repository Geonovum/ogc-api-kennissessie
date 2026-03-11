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

function processOutputs(outputs, parameters, value) {
  let content = {};

  for (let [key, output] of Object.entries(outputs)) {
    console.log(key);
    console.log(output);

    if (parameters.outputs[key] == undefined)
      return callback(
        { httpCode: 400, description: `${key} can not be bound` },
        undefined,
      );

    let parameterOutput = parameters.outputs[key];

    let result = {};
    result.id = key;

    if ((output.schema.type = "number")) result.value = Number(value);

    // TODO: what to do??
    //if (parameterOutput.transmissionMode == "value") content = result;

    content.outputs = [];
    content.outputs.push(result);

    /*
      if (parameters.response == "raw") {
        content = result;
      } else if (parameters.response == "document") {
        content.outputs = [];
        content.outputs.push(result);
      }
*/
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
      let shellScript = "add.sh";
      command = join(__dirname, shellScript);
      params = [values[0], values[1]];
      break;
    case "win32":
      let batScript = "add.bat";
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

    child.stdout.on("data", (d) => {
      const content = processOutputs(process_.outputs, parameters, d);

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

    const content = processOutputs(process_.outputs, parameters, child.stdout);

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
