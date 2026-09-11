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

export function getContent(neutralUrl, format, job, outputId) {
  let content = {};
  if (job.results.outputs && job.results.outputs === Array) {
    content = job.results.outputs[0];
  }

  content.links = [];

  getLinks(neutralUrl, format, content.links);

  return content;
}

function get(neutralUrl, format, jobId, outputId, callback) {
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

  if (job.status === "accepted" || job.status === "running")
    return callback(
      processException(
        404,
        exceptions.RESULT_NOT_READY,
        `Results for job ${jobId} are not ready`
      ),
      undefined
    );

  if (job.status === "failed")
    return callback(
      processException(
        job.httpCode || 500,
        exceptions.SERVER_ERROR,
        job.message || `Job ${jobId} failed`
      ),
      undefined
    );

  var content = {};
  if (job.results) {
    if (typeof job.results[outputId] == "undefined")
      return callback(
        processException(
          404,
          exceptions.INVALID_PARAMETER,
          `OutputId not found: ${outputId}`
        ),
        undefined
      );

    content = job.results[outputId];
  }

  return callback(undefined, content);
}

export default {
  get,
};
