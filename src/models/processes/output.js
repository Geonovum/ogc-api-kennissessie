import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";

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
      {
        httpCode: 404,
        code: `Job not found: ${jobId}`,
        description: "Make sure you use an existing jobId. See /Jobs",
      },
      undefined
    );

  var content = {};
  if (job.results.outputs && job.results.outputs.constructor === Array) {
    if (typeof job.results.outputs[outputId] == "undefined")
      return callback(
        {
          httpCode: 404,
          code: `OutputId not found: ${outputId}`,
          description:
            "Make sure you use an existing outputId. See /Results/:outputId",
        },
        undefined
      );

    content = job.results.outputs[outputId];
  }

  //  var content = getContent(neutralUrl, format, job, outputId);

  return callback(undefined, content);
}

export default {
  get,
};
