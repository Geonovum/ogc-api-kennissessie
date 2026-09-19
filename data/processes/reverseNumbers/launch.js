import { join } from "path";
import spawn from "node:child_process";
import {
  startJob,
  succeedJob,
  failJob,
} from "../../../src/models/processes/subscriber.js";

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

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

  startJob(job);

  let content;
  try {
    content = processOutputs(process_.outputs, parameters, values.reverse());
  } catch (err) {
    failJob(job, err.message);

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

  succeedJob(job, content);
  return callback(undefined, content);
  
}
