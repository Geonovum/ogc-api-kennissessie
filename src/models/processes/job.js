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
    href: urlJoin(neutralUrl, 'results', `?f=${format}`),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/results`,
    type: getTypeFromFormat(format),
    title: `Results of job as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, 'results', `?f=${altFormat}`),
      rel: `http://www.opengis.net/def/rel/ogc/1.0/results`,
      type: getTypeFromFormat(altFormat),
      title: `Results of job as ${altFormat}`,
    });
  });
}

export function getContent(neutralUrl, format, jobId, job) {
  var content = structuredClone(job);
  content.links = []
  
  getLinks(neutralUrl, format, jobId, content.links);

  delete content.results

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

  var content = getContent(neutralUrl, format, jobId, job);

  return callback(undefined, content);
}

/**
 * Description placeholder
 *
 * @export
 * @param {*} path
 * @param {*} process
 * @param {*} parameters
 * @param {*} job
 * @param {*} callback
 */
export function execute(path, process, job, isAsync, parameters, callback) {
  try {
    import(path)
      .then((module) => {
        module.launch(process, job, isAsync, parameters, function (err, content) {
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
            description: `${error.message}`,
          },
          undefined
        );
      });
  } catch (error) {
    console.log(error);
  }
}

function delete_(neutralUrl, format, jobId, callback) {

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

  delete jobs[jobId]

  return callback(undefined, {});
}

export default {
  get,
  delete_,
};
