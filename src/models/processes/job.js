import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";

function getLinks(neutralUrl, format, jobId, links) {
  function getTypeFromFormat(format) {
    var _formats = ["json", "html"];
    var _encodings = ["application/json", "text/html"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  links.push({
    href: urlJoin(neutralUrl, jobId, `?f=${format}`),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Job information as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, jobId, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `Job information as ${altFormat}`,
    });
  });

  links.push({
    href: urlJoin(neutralUrl, jobId, "results", `?f=${format}`),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/results`,
    type: getTypeFromFormat(format),
    title: `Results of job as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, jobId, "results", `?f=${altFormat}`),
      rel: `http://www.opengis.net/def/rel/ogc/1.0/results`,
      type: getTypeFromFormat(altFormat),
      title: `Results of job as ${altFormat}`,
    });
  });
}

export function getContent(neutralUrl, format, jobId, job) {
  var content = structuredClone(job);
  content.links = [];

  getLinks(neutralUrl, format, jobId, content.links);

  delete content.results;

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
  if (!job)
    return callback(
      {
        httpCode: 404,
        code: `Job not found: ${jobId}`,
        description: "Make sure you use an existing jobId. See /Jobs",
      },
      undefined
    );

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
    import(path)
      .then((module) => {
        module.launch(
          process_,
          job,
          isAsync,
          parameters,
          function (err, content) {
            if (err) {
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
  if (!job)
    return callback(
      {
        httpCode: 404,
        code: `No such job: ${jobId}`,
        description: "Make sure you use an existing jobId. See /Jobs",
      },
      undefined
    );

  let jobsUrl = neutralUrl.substr(
    0,
    neutralUrl.lastIndexOf("/jobs") + "/jobs".length
  );

  let content = job;
  content.status = "dismissed";
  content.message = "Job dismissed";
  content.updated = new Date().toISOString();
  content.links = [];
  content.links.push({
    href: jobsUrl,
    rel: `up`,
    type: "application/json",
    title: `The job list for the current process`,
  });

  delete content.results;

  delete jobs[jobId];

  return callback(undefined, content);
}

export default {
  get,
  delete_,
};
