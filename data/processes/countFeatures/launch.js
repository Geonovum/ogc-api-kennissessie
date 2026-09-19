import count from "./count.js";
import {
  startJob,
  succeedJob,
  failJob,
} from "../../../src/models/processes/subscriber.js";

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

  startJob(job);

  let countValue;
  try {
    countValue = await count(parameters.inputs.uri);
  } catch (err) {
    failJob(job, err.message);

    var httpCode = /not a valid/.test(err.message) ? 400 : 500;
    return callback({ httpCode, description: job.message }, undefined);
  }

  if (job.status === "dismissed") return;

  if (parameters.outputs != undefined) {
    for (let key of Object.keys(parameters.outputs)) {
      if (process_.outputs[key] == undefined) {
        failJob(
          job,
          `The ${key} argument specified as ResponseDocument identifier was not recognized.`
        );

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

  succeedJob(job, content);
  return callback(undefined, content);
}
