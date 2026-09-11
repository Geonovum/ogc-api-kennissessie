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

function processOutputs(outputs, parameters, values) {
  let content = {};

  if (parameters.outputs != undefined) {
    for (let key of Object.keys(parameters.outputs)) {
      if (outputs[key] == undefined)
        throw new Error(
          `The ${key} argument specified as ResponseDocument identifier was not recognized.`,
        );
    }
  }

  let index = 0
  for (let [key, output] of Object.entries(outputs)) {
    console.log(key);
    console.log(output);

    let parameterOutput = {}
    parameterOutput.transmissionMode = "value"

    if (parameters.outputs != undefined)
      if (parameters.outputs[key] == undefined) continue;

    if (output.schema.type === "number") content[key] = Number(values[index]);
    else if (output.schema.type === "string") content[key] = String(values[index]);
    else if (output.schema.type === "boolean") content[key] = Boolean(values[index]);
    else if (output.schema.type === "object") content[key] = JSON.parse(values[index]);
    else if (output.schema.type === "array") content[key] = JSON.parse(values[index]); 

    index++
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

  job.status = "running"; // accepted, successful, failed, dismissed
  job.started = new Date().toISOString();
  job.updated = new Date().toISOString();

  let content;
  try {
    content = processOutputs(process_.outputs, parameters, values.reverse());
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
