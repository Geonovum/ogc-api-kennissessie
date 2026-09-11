import count from "./count.js";
import http from "node:http";
import https from "node:https";

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
    }
  );
  req.on("error", (err) => console.log(err));
  req.write(data);
  req.end();
}

/**
 * Description placeholder
 *
 * @export
 * @param {*} job
 * @param {*} process_
 * @param {*} parameters
 * @param {*} callback
 * @returns {*}
 */
export async function launch(process_, job, isAsync, parameters, callback) {
  if (parameters.inputs == undefined || parameters.inputs.uri == undefined)
    return callback(
      { httpCode: 400, description: `uri not found` },
      undefined
    );

  if (isAsync) {
    return callback(
      { httpCode: 400, description: `count does not work async` },
      undefined
    );
  }

  job.status = "running"; // accepted, successful, failed, dismissed
  job.started = new Date().toISOString();
  job.updated = new Date().toISOString();

  let countValue;
  try {
    countValue = await count(parameters.inputs.uri);
  } catch (err) {
    job.status = "failed";
    job.progress = 100;
    job.message = err.message;
    job.finished = new Date().toISOString();
    job.updated = new Date().toISOString();

    if (parameters.subscriber && parameters.subscriber.failedUri) {
      httpPost(parameters.subscriber.failedUri, { message: job.message });
    }

    var httpCode = /not a valid/.test(err.message) ? 400 : 500;
    return callback({ httpCode, description: job.message }, undefined);
  }

  if (job.status === "dismissed") return;

  if (parameters.outputs != undefined) {
    for (let key of Object.keys(parameters.outputs)) {
      if (process_.outputs[key] == undefined) {
        job.status = "failed";
        job.progress = 100;
        job.message = `The ${key} argument specified as ResponseDocument identifier was not recognized.`;
        job.finished = new Date().toISOString();
        job.updated = new Date().toISOString();

        return callback(
          {
            httpCode: 400,
            type: "InvalidParameterValue",
            title: "InvalidParameterValue",
            detail: job.message,
            description: job.message,
          },
          undefined
        );
      }
    }
  }

  const content = {};
  if (parameters.outputs == undefined || parameters.outputs.count != undefined)
    content.count = countValue;

  job.status = "successful"; // accepted, successful, failed, dismissed
  job.progress = 100;
  job.message = `Job complete`;
  job.finished = new Date().toISOString();
  job.updated = new Date().toISOString();
  job.results = content;

  if (parameters.subscriber && parameters.subscriber.successUri) {
    httpPost(parameters.subscriber.successUri, content);
  }

  return callback(undefined, content);
}
