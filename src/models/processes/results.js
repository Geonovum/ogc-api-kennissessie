import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";
import { jobDismissedError } from "./job.js";
import exceptions, { processException } from "./exceptions.js";

function getLinks(neutralUrl, format, links) {
  function getTypeFromFormat(format) {
    var _formats = ["json", "html"];
    var _encodings = ["application/json", "text/html"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Results information as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `Results information as ${altFormat}`,
    });
  });
}

export function getContent(neutralUrl, format, job) {
  var content = job.results;

  // content.links = [];
  // getLinks(neutralUrl, format, content.links);

  return content;
}

function get(neutralUrl, format, jobId, callback) {
  let jobs = getJobs();
  let job = jobs[jobId];
  if (!job)
    return callback(
      processException(
        404,
        exceptions.NO_SUCH_JOB,
        `Job not found: ${jobId}. Make sure you use an existing jobId. See /jobs`
      ),
      undefined
    );

  if (job.status === "dismissed")
    return callback(jobDismissedError(), undefined);

  // (OAPIP) Req 45: results of a running/accepted job are not ready
  if (job.status === "accepted" || job.status === "running")
    return callback(
      processException(
        404,
        exceptions.RESULT_NOT_READY,
        `Results for job ${jobId} are not ready`
      ),
      undefined
    );

  // (OAPIP) Req 46: failed jobs return an error that matches the failure
  if (job.status === "failed")
    return callback(
      processException(
        job.httpCode || 500,
        exceptions.SERVER_ERROR,
        job.message || `Job ${jobId} failed`
      ),
      undefined
    );

  var content = getContent(neutralUrl, format, job);

  return callback(undefined, content);
}

export default {
  get,
};
