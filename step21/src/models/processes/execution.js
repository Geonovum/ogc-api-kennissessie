import urlJoin from "url-join";
import { join } from "path";
import { existsSync } from "fs";
import { getProcesses, getJobs } from "../../database/processes.js";
import { create, execute } from "./job.js";

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

function post(neutralUrl, processId, body, callback) {
  var processes = getProcesses();
  var process = processes[processId];
  if (!process)
    return callback(
      {
        httpCode: 404,
        code: `Process not found: ${processId}`,
        description: "Make sure you use an existing processId. See /processes",
      },
      undefined
    );

  let path = join(process.location.replace(/\.[^/.]+$/, ""), "launch.js");
  const fileExists = existsSync(path);
  if (!fileExists)
    return callback(
      {
        httpCode: 500,
        code: `Server Error`,
        description: "launch.js not found for process ${processId}",
      },
      undefined
    );

  var jobs = getJobs();
  var job = create();
  jobs[job.jobID] = job;
  execute(job)

  import(path)
    .then((module) => {
      module.launch(process, body, function (err, content) {
        if (err) {
          callback(err, undefined);
          return;
        }

        callback(undefined, content);
      });
    })
    .catch((error) => {
      return callback(
        {
          httpCode: 500,
          code: `Server error`,
          description: `${error}`,
        },
        undefined
      );
    });
}

export default {
  post,
};
