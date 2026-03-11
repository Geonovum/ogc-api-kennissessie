import { Docker, Options } from "docker-cli-js";
// import { v2 as compose } from "docker-compose";
import http from "node:http";
import https from "node:https";
import path from "path";

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "GET",
      },
      (res) => {
        let chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString());
            resolve({ data });
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

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

  // Only run async!
  if (!isAsync) {
    return callback(
      { httpCode: 400, description: `addNumbersInContainer run only async` },
      undefined
    )
  }

  job.status = "running"; // accepted, successful, failed, dismissed
  job.started = new Date().toISOString();
  job.updated = new Date().toISOString();

  callback(undefined, {});

  const machineName = null; // localhost

  // default options
  const options = {
    machineName: machineName, // uses local docker
    currentWorkingDirectory: null, // uses current working directory
    echo: true, // echo command output to stdout/stderr
    env: null, // environment variables
    stdin: null, // stdin used for the command (useful for passing passwords, etc)
  };

  const port = 3000;
  const docker = new Docker(options);
  const containerName = `ealen/echo-server`; // localhost

  // CHECK: login first???

  /*
  // based on the docker-compose.yml file in your current directory
  const result = await compose.ps({ cwd: path.join(__dirname) }).catch(err => console.log(err));
  result.data.services.forEach((service) => {
    console.log(service.name, service.command, service.state, service.ports);
    // state is e.g. 'Up 2 hours'
  });
*/

  try {
    // get running containers
    let data = await docker.command("ps")
    
    // is our container already running?
    const notFound = data.containerList.findIndex((element) => element.image == containerName) < 0;
    if (notFound) {
      const command = `run -d -p ${port}:80 ${containerName}`;

      let result = await docker.command(command);
      console.log(result);
      // give container time to settle
      await new Promise((r) => setTimeout(r, 1000));
    } else {
      console.log(`Container ${containerName} already running. Good.`);
    }
  }
  catch (err) {
    return callback({ httpCode: 400, description: err.message }, undefined)
  }

  let content = {};
  // http get to echo server
  httpGet(values[0])
    .then(function (response) {
      for (let [key, output] of Object.entries(process_.outputs)) {
        let result = {};
        result.id = key;

        if (parameters.outputs[key] == undefined)
          return callback(
            { httpCode: 400, description: `${key} can not be bound` },
            undefined
          );

        let parameterOutput = parameters.outputs[key];

        if ((output.schema.type = "string"))
          result.value = response.data.http.originalUrl;

        // TODO: what to do??
        //if (parameterOutput.transmissionMode == "value") content = result;

        content.outputs = [];
        content.outputs.push(result);

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
    })
    .catch(function (error) {
      if (parameters.subscriber && parameters.subscriber.failedUri) {
        httpPost(parameters.subscriber.failedUri, {
          message: error?.message || String(error),
        });
      }
    });
}
