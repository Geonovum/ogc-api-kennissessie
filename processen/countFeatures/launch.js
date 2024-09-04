import count from "./count.js";
import http from "axios";

/**
 * Description placeholder
 *
 * @export
 * @param {*} job
 * @param {*} process
 * @param {*} parameters
 * @param {*} callback
 * @returns {*}
 */
export async function launch(process, job, isAsync, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process.inputs)) {
    if (parameters.inputs[key] == undefined)
      return callback(
        { code: 400, description: `${key} not found` },
        undefined
      );
    values.push(parameters.inputs[key]);
  }

  let params = [values[0]];

  if (isAsync) {
  } else {
    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    let res = await count(values[0]);

    let content = {};

    // bring result into content
    for (let [key, output] of Object.entries(process.outputs)) {
      let result = {};
      result.id = key;

      if ((output.schema.type = "number")) result.value = res;

      if (parameters.response == "raw") {
        content = result;
      } else if (parameters.response == "document") {
        content.outputs = [];
        content.outputs.push(result);
      }

      // TODO transmissionMode??? (in spec)
      //if (outputParameter.transmissionMode == "value") content = result;
    }

    job.status = "successful"; // accepted, successful, failed, dismissed
    job.progress = 100;
    job.message = `Job complete`;
    job.finished = new Date().toISOString();
    job.updated = new Date().toISOString();
    job.results = content;

    if (process.subscriber && process.subscriber.successUri) {
      http
        .post(process.subscriber.successUri, content)
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
    
    return callback(undefined, content);
  }
}
