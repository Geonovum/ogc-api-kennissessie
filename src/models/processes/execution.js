import urlJoin from "url-join";
import { join } from "path";
import { existsSync } from "fs";
import { getProcesses, getResults } from "../../database/processes.js";
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

function getContent(neutralUrl, process, body) {
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
  var process = structuredClone(processes[processId]);
  if (!process)
    return callback(
      {
        code: 404,
        description: "Make sure you use an existing processId. See /processes",
      },
      undefined
    );

  let pathToLauncher = join(
    process.location.replace(/\.[^/.]+$/, ""),
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

  if (
    prefer.includes("async") &&
    !process.jobControlOptions.includes("async-execute")
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
  if (process.subscriber) {
    for (var key in process.subscriber) {
      if (process.subscriber.hasOwnProperty(key)) {
        process.subscriber[key] = process.subscriber[key]
          .replaceAll(":serviceUrl", serviceUrl)
          .replaceAll(":jobId", job.jobID);
      }
    }
  }

  execute(
    pathToLauncher,
    process,
    job,
    prefer.includes("async"),
    parameters,
    function (err, content) {
      if (err) {
        callback(err, undefined);
        return;
      }

      // remember result
      let results = getResults();
      results[job.jobID] = content

      let location = `:serviceUrl/jobs/${job.jobID}`

      callback(undefined, content, location);
    }
  );
}

export default {
  post,
};
