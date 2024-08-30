import urlJoin from "url-join";
import utils from "../../utils/utils.js";

function getLinks(neutralUrl, format, name, links) {
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
    title: `Job description`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `Job description as ${altFormat}`,
    });
  });
}

function getContent(neutralUrl, format, name, document) {
  var content = {};
  content.jobID = "name";
  content.status = "accepted";
  content.message = "process started";
  content.progress = 12;
  content.created = "2024";
  content.links = [];

  getLinks(neutralUrl, format, name, content.links);

  return content;
}

function get(neutralUrl, format, jobId, callback) {
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

export default {
  get
};
