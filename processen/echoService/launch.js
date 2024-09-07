import random from '@types/dockerode'
import { Docker, Options } from "docker-cli-js";
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

  // Only run async!
  if (!isAsync) {
    return callback(
      { code: 400, description: `addNumbersInContainer run only async` },
      undefined
    );
  }

  job.status = "running"; // accepted, successful, failed, dismissed
  job.started = new Date().toISOString();
  job.updated = new Date().toISOString();

  const port = 3000;
  const machineName = null; // localhost
  const containerName = `ealen/echo-server`; // localhost

  // default options
  const options = {
    machineName: machineName, // uses local docker
    currentWorkingDirectory: null, // uses current working directory
    echo: true, // echo command output to stdout/stderr
    env: null, // environment variables
    stdin: null, // stdin used for the command (useful for passing passwords, etc)
  };

  const docker = new Docker(options);

  // CHECK: login first???

  // get running containers
  let data = await docker.command("ps");
  // is our container already running?
  const notFound =
    data.containerList.findIndex((element) => element.image == containerName) <
    0;

  if (notFound) {
    const command = `run -d -p ${port}:80 ${containerName}`;

    let run = await docker.command(command);
  } else {
    console.log(`Container ${containerName} already running`);
  }

  let content = {};
  // http get to echo server
  http
    .get(values[0])
    .then(function (response) {
      for (let [key, output] of Object.entries(process.outputs)) {
        let result = {};
        result.id = key;

        if ((output.schema.type = "string"))
          result.value = response.data.http.originalUrl;

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
    })
    .catch(function (error) {
      return callback({ code: 400, description: error }, undefined);
    });

  return callback(undefined, {});
}
