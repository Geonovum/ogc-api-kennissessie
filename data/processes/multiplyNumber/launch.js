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
export async function launch(process_, job, isAsync, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process_.inputs)) {
    if (parameters.inputs[key] == undefined)
      return callback(
        { code: 400, description: `${key} not found` },
        undefined
      );
    values.push(parameters.inputs[key]);
  }

  var command = ''
  var params = ''

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
  }

  if (isAsync) {
    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    let child = undefined;
    try {
      child = cp.spawn(command, params, {
        shell: true,
      });
    } catch (err) {
      console.log(err);
    }

    child.stdout.on("data", (d) => {
      let content = {};

      for (let [key, output] of Object.entries(process_.outputs)) {
        let result = {};
        result.id = key;

        if ((output.schema.type = "number")) result.value = Number(d);

        if (parameters.outputs.sum.transmissionMode == "value") {
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
      job.status = "failed"; // accepted, successful, failed, dismissed
      job.progress = 100;
      job.message = d.toString();
      job.finished = new Date().toISOString();
      job.updated = new Date().toISOString();

      if (process_.subscriber && process_.subscriber.failedUri) {
        http
          .post(process_.subscriber.failedUri, job.message)
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
  } else {
    job.status = "running"; // accepted, successful, failed, dismissed
    job.started = new Date().toISOString();
    job.updated = new Date().toISOString();

    let child = undefined;
    try {
      child = cp.spawnSync(command, params, {
        shell: true,
      });
    } catch (err) {
      console.log(err);
    }

    let err = child.stderr.toString();
    if (err.length !== 0) {
      job.status = "failed"; // accepted, successful, failed, dismissed
      job.progress = 100;
      job.message = err;
      job.finished = new Date().toISOString();
      job.updated = new Date().toISOString();

      if (process_.subscriber && process_.subscriber.failedUri) {
        http
          .post(process_.subscriber.failedUri, job.message)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
      }
      return callback({ code: 400, description: job.message }, undefined);
    }

    let content = {};

    // bring result into content
    for (let [key, output] of Object.entries(process_.outputs)) {
      console.log(key);
      console.log(output);

      if (parameters.outputs[key] == undefined)
        return callback(
          { code: 400, description: `${key} can not be bound` },
          undefined
        );

      let parameterOutput = parameters.outputs[key];

      let result = {};
      result.id = key;

      if ((output.schema.type = "number")) 
        result.value = Number(child.stdout);

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

    job.status = "successful"; // accepted, successful, failed, dismissed
    job.progress = 100;
    job.message = `Job complete`;
    job.finished = new Date().toISOString();
    job.updated = new Date().toISOString();
    job.results = content;

    if (process_.subscriber && process_.subscriber.successUri) {
      http
        .post(process_.subscriber.successUri, content)
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
