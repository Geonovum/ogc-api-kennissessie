import urlJoin from "url-join";
import { spawn } from "node:child_process";
import { getJobs } from "../../database/processes.js";
import exceptions, { processException } from "./exceptions.js";

function jobNotFoundError(jobId) {
  return processException(
    404,
    exceptions.NO_SUCH_JOB,
    `Job not found: ${jobId}. Make sure you use an existing jobId. See /jobs`
  );
}

export function jobDismissedError() {
  return processException(
    410,
    "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/gone",
    "The job has been dismissed"
  );
}

/**
 * Stop a process started by a launcher. Stored on `job.child` (not part of
 * the public StatusInfo document).
 *
 * @param {*} job
 */
export function stopJobProcess(job) {
  const child = job.child;
  delete job.child;
  if (!child) return;

  try {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"]);
    } else if (typeof child.kill === "function") {
      child.kill("SIGTERM");
    }
  } catch (err) {
    console.log(`Unable to stop process for job ${job.jobID}: ${err.message}`);
  }
}

function getLinks(neutralUrl, format, jobId, links) {

  links.push({
    href: urlJoin(neutralUrl, jobId),
    rel: `self`,
    type: `application/json`,
    title: `Status location`,
  });

  links.push({
    href: urlJoin(neutralUrl, jobId, "results"),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/results`,
    type: `application/json`,
    title: `Result location`,
  });
}

export function getContent(neutralUrl, format, jobId, job) {
  // child is the live process handle; results are only on /jobs/{id}/results
  const { child, results, ...publicJob } = job;
  var content = structuredClone(publicJob);
  content.links = [];

  getLinks(neutralUrl, format, jobId, content.links);

  return content;
}

/**
 * Description placeholder
 *
 * @param {*} neutralUrl
 * @param {*} format
 * @param {*} jobId
 * @param {*} callback
 * @returns {*}
 */
export function get(neutralUrl, format, jobId, callback) {
  var jobs = getJobs();
  var job = jobs[jobId];
  if (!job) return callback(jobNotFoundError(jobId), undefined);

  // (OAPIP) After a job has been dismissed, subsequent requests to the job
  //         SHOULD return HTTP status code 410 (Gone).
  if (job.status === "dismissed")
    return callback(jobDismissedError(), undefined);

  if (!neutralUrl.endsWith("jobs"))
    neutralUrl = neutralUrl.substr(0, neutralUrl.lastIndexOf("/"));

  var content = getContent(neutralUrl, format, jobId, job);

  return callback(undefined, content);
}

/**
 * Description placeholder
 *
 * @export
 * @param {*} path
 * @param {*} process_
 * @param {*} parameters
 * @param {*} job
 * @param {*} callback
 */
export function execute(path, process_, job, isAsync, parameters, callback) {

  if (process.platform == 'win32')
    path = 'file://' + path;

  try {

    console.log(`Launch from path ${path}`);

    import(path)
      .then((module) => {
        module.launch(
          process_,
          job,
          isAsync,
          parameters,
          function (err, content) {
            if (err) {
              console.log(`error ${err}`);
              callback(err, undefined);
              return;
            }

            callback(undefined, content);
          }
        );
      })
      .catch((error) => {
        return callback(
          {
            httpCode: 500,
            code: `Server error`,
            description: `${error.message}`,
          },
          undefined
        );
      });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Description placeholder
 *
 * @param {*} neutralUrl
 * @param {*} format
 * @param {*} jobId
 * @param {*} callback
 * @returns {*}
 */
function delete_(neutralUrl, format, jobId, callback) {
  var jobs = getJobs();
  var job = jobs[jobId];
  if (!job) return callback(jobNotFoundError(jobId), undefined);

  // Dismiss of an already-dismissed job is Gone, not a second success.
  if (job.status === "dismissed")
    return callback(jobDismissedError(), undefined);

  // (OAPIP Dismiss) If the operation is executed before the job has finished
  // processing, the server SHALL cancel the processing and remove outstanding results.
  stopJobProcess(job);

  job.status = "dismissed";
  job.message = "Job dismissed";
  job.finished = new Date().toISOString();
  job.updated = new Date().toISOString();
  delete job.results;

  if (!neutralUrl.endsWith("jobs"))
    neutralUrl = neutralUrl.substr(0, neutralUrl.lastIndexOf("/"));

  // (OAPIP Dismiss) 200 with a StatusInfo document (status = dismissed).
  var content = getContent(neutralUrl, format, jobId, job);

  return callback(undefined, content);
}

export default {
  get,
  delete_,
};
