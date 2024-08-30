import { join } from "path";
import cp from "node:child_process";
import http from "axios";

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

/**
 * Description placeholder
 *
 * @export
 * @param {*} job
 * @param {*} parameters
 * @param {*} callback
 * @returns {*}
 */
export function launch(process, job, isAsync, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process.inputs)) {
    if (parameters.inputs[key] == undefined)
      callback({ code: 500, description: `${key} not found` }, undefined);
    values.push(parameters.inputs[key]);
  }

  let shellScript = "add.sh";
  let command = join(__dirname, shellScript);
  let params = [values[0], values[1]];

  if (isAsync) {
    let child = cp.spawn(command, params, {
      shell: true,
    });

    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    child.stdout.on("data", (d) => {
      let content = {};

      for (let [key, output] of Object.entries(process.outputs)) {
        let result = {};
        result.id = key;

        if ((output.schema.type = "number"))
          result.value = Number(child.stdout);

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

// TODO: where to store results (content)?

      if (parameters.subscriber && parameters.subscriber.successUri) {
        http
          .post(parameters.subscriber.successUri, content)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    });

    child.stderr.on("data", (d) => {
      if (parameters.subscriber && parameters.subscriber.failedUri) {
        console.log(d.toString());

        job.status = "failed"; // accepted, successful, failed, dismissed
        job.progress = 100;
        job.message = "reason of failure";
        job.finished = new Date().toISOString();
        job.updated = new Date().toISOString();

        http
          .post(parameters.subscriber.failedUri, d)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    });

    child.on("close", () => {
      // not sure what to do here
    });

    return callback(undefined, {});

    // TODO: return here with 202
  } else {
    const child = cp.spawnSync(command, params, {
      shell: true,
    });

    let content = {};

    for (let [key, output] of Object.entries(process.outputs)) {
      let result = {};
      result.id = key;

      if ((output.schema.type = "number")) result.value = Number(child.stdout);

      if (parameters.response == "raw") {
        content = result;
      } else if (parameters.response == "document") {
        content.outputs = [];
        content.outputs.push(result);
      }

      // TODO: where to store results (content)?

      // TODO transmissionMode??? (in spec)
      //if (outputParameter.transmissionMode == "value") content = result;
    }

    job.status = "successful"; // accepted, successful, failed, dismissed
    job.progress = 100;
    job.message = `Job complete`;
    job.finished = new Date().toISOString();
    job.updated = new Date().toISOString();

    return callback(undefined, content);
  }
}
