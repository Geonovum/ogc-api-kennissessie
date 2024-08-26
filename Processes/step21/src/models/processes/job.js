import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";

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
  }
);
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

export function create() {
  var lut = [];
  for (var i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? "0" : "") + i.toString(16);
  }
  function e7() {
    var d0 = (Math.random() * 0xffffffff) | 0;
    var d1 = (Math.random() * 0xffffffff) | 0;
    var d2 = (Math.random() * 0xffffffff) | 0;
    var d3 = (Math.random() * 0xffffffff) | 0;
    return (
      lut[d0 & 0xff] +
      lut[(d0 >> 8) & 0xff] +
      lut[(d0 >> 16) & 0xff] +
      lut[(d0 >> 24) & 0xff] +
      "-" +
      lut[d1 & 0xff] +
      lut[(d1 >> 8) & 0xff] +
      "-" +
      lut[((d1 >> 16) & 0x0f) | 0x40] +
      lut[(d1 >> 24) & 0xff] +
      "-" +
      lut[(d2 & 0x3f) | 0x80] +
      lut[(d2 >> 8) & 0xff] +
      "-" +
      lut[(d2 >> 16) & 0xff] +
      lut[(d2 >> 24) & 0xff] +
      lut[d3 & 0xff] +
      lut[(d3 >> 8) & 0xff] +
      lut[(d3 >> 16) & 0xff] +
      lut[(d3 >> 24) & 0xff]
    );
  }

  let job = {};
  job.jobID = e7();
  job.status = "created";
  job.message = "process created";
  job.progress = 0;
  job.created = new Date().toISOString();

  return job;
}

export function execute(path, process, body, job, callback) {
  import(path)
    .then((module) => {
      job.status = 'accepted'
      module.launch(job, process, body, function (err, content) {
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
}

function delete_(neutralUrl, format, jobId, callback) {
  return callback(undefined, {});
}

export default {
  get,
  delete_,
};
