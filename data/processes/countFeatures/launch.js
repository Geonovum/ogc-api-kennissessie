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
  var values = [];
  for (let [key, processInput] of Object.entries(process_.inputs)) {
    if (parameters.inputs[key] == undefined)
      return callback(
        { httpCode: 400, description: `${key} not found` },
        undefined
      );
    values.push(parameters.inputs[key]);
  }

  let params = [values[0]];

  if (isAsync) {
    return callback(
      { httpCode: 400, description: `count does not work async` },
      undefined
    );
  } else {
    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    let res = await count(values[0]);

    if (job.status === "dismissed") return;

    let content = {};

    if (parameters.outputs != undefined) {
      for (let key of Object.keys(parameters.outputs)) {
        if (process_.outputs[key] == undefined) {
          job.status = "failed";
          job.progress = 100;
          job.message = `${key} is not a known output`;
          job.finished = new Date().toISOString();
          job.updated = new Date().toISOString();

          return callback(
            {
              httpCode: 400,
              type: "InvalidParameterValue",
              title: "InvalidParameterValue",
              description: job.message,
            },
            undefined
          );
        }
      }
    }

    // bring result into content
    for (let [key, output] of Object.entries(process_.outputs)) {
      let result = {};
      result.id = key;

      if (parameters.outputs[key] == undefined)
        return callback(
          {
            httpCode: 400,
            type: "InvalidParameterValue",
            title: "InvalidParameterValue",
            description: `${key} can not be bound`,
          },
          undefined
        );

      let parameterOutput = parameters.outputs[key];

      if (output.schema.type === "number") result.value = res;

      // TODO: what to do??
      //if (parameterOutput.transmissionMode == "value") content = result;

      content.outputs = [];
      content.outputs.push(result);

      /*  if (parameters.response == "raw") {
        content = result;
      } else if (parameters.response == "document") {
        content.outputs = [];
        content.outputs.push(result);
      }
*/
      // TODO transmissionMode??? (in spec)
      //if (outputParameter.transmissionMode == "value") content = result;
    }

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
}
