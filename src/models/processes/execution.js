import urlJoin from "url-join";
import { join } from "path";
import { existsSync } from "fs";
import { getProcesses } from "../../database/processes.js";
import { execute } from "./job.js";
import { create } from "./jobs.js";

function getLinks(neutralUrl, format, name, links) {
  links.push({
    href: urlJoin(neutralUrl),
    rel: `self`,
    type: "application/json",
    title: `The Document`,
  });
}

function getContent(neutralUrl, process_, body) {
  var content = {};
  // A local identifier for the collection that is unique for the dataset;
  content.id = name; // required
  // An optional title and description for the collection;
  content.title = document.name;
  content.description = document.description;
  content.links = [];

  getLinks(neutralUrl, format, name, content.links);

  return content;
}

/**
 * Description placeholder
 *
 * @param {*} neutralUrl
 * @param {*} processId
 * @param {*} parameters
 * @param {*} callback
 * @returns {*}
 */
function post(neutralUrl, processId, parameters, prefer, callback) {
  // serviceUrl sits at the same level as /processes
  let serviceUrl = neutralUrl.substring(0, neutralUrl.indexOf("/processes"));

  var processes = getProcesses();
  var process_ = structuredClone(processes[processId]);
  if (!process_)
    return callback(
      {
        code: 404,
        description: "Make sure you use an existing processId. See /processes",
      },
      undefined
    );

  // check parameters against the process input parameter definition
  for (let [key, processInput] of Object.entries(process_.inputs)) {
    if (parameters.inputs[key] == undefined)
      return callback(
        { code: 400, description: `${key} not found` },
        undefined
      );
    switch (processInput.schema.type) {
      case "number":
        if (typeof parameters.inputs[key] !== "number")
          return callback(
            {
              code: 400,
              description: `${key} (${parameters.inputs[key]}) is not a number`,
            },
            undefined
          );
        break;
      case "string":
        break;
    }
  }

  for (let [key, processInput] of Object.entries(parameters.inputs)) {
    if (process_.inputs[key] == undefined)
      return callback(
        { code: 400, description: `${key} not found in process definition` },
        undefined
      );
  }

  // prepare for the launcher (launcher has a fixed name: launcher.js)
  let pathToLauncher = join(
    process_.location.replace(/\.[^/.]+$/, ""),
    "launch.js"
  );

  const fileExists = existsSync(pathToLauncher);
  if (!fileExists)
    return callback(
      {
        code: 500,
        description: "launch.js not found for process ${processId}",
      },
      undefined
    );

  // async/sync is determined by the HTTP header prefer
  if (
    prefer.includes("async") &&
    !process_.jobControlOptions.includes("async-execute")
  )
    return callback(
      {
        code: 403,
        description: "Request async, but process does not support async",
      },
      undefined
    );

  // Create the job and add to the list of jobs.
  // The initial status of the job is 'created'
  let job = create(processId, prefer.includes("async"));

  // resolve all :<> with content
  if (parameters.subscriber) {
    for (var key in parameters.subscriber) {
      if (parameters.subscriber.hasOwnProperty(key)) {
        parameters.subscriber[key] = parameters.subscriber[key]
          .replaceAll(":serviceUrl", serviceUrl)
          .replaceAll(":jobId", job.jobID);
      }
    }
  }

  execute(
    pathToLauncher,
    process_,
    job,
    prefer.includes("async"),
    parameters,
    function (err, content) {
      if (err) return callback(err, undefined);

      // indication in the header of the location of the
      // newly created job resource
      let location = `:serviceUrl/jobs/${job.jobID}`;

      callback(undefined, content, location);
    }
  );
}

export default {
  post,
};
