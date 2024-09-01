import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";
import { getContent as getJobContent } from "./job.js";

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
    title: `Jobs list as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `Jobs list as ${altFormat}`,
    });
  });
}

function getContent(neutralUrl, format) {
  let links = [];
  getLinks(neutralUrl, format, links);

  return links;
}

/**
 * Description placeholder
 *
 * @export
 * @param {*} processId
 * @param {*} isAsync
 * @returns {{ jobID: string; status: string; message: string; progress: number; created: any; }}
 */
export function create(processId, isAsync) {
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
  job.processID = processId;
  job.jobID = e7();
  job.status = "created"; // accepted, successful, failed, dismissed
  job.updated = new Date().toISOString();
  job.message = "process created";
  job.progress = 0;
  job.created = new Date().toISOString();

  getJobs()[job.jobID] = job;

  return job;
}

/**
 * Description placeholder
 *
 * @param {*} neutralUrl
 * @param {*} format
 * @param {*} callback
 * @returns {*}
 */
function get(neutralUrl, format, callback) {
  // (OAPIC P2) Requirement 3A: The content of that response SHALL be based upon the JSON schema collections.yaml.
  var content = {};

  content.links = getContent(neutralUrl, format)

  content.jobs = [];

  var jobs = getJobs();

  // get content per :collection
  for (var key in jobs) {
    if (jobs.hasOwnProperty(key)) {
      var job = getJobContent(neutralUrl, format, key, jobs[key]);
      content.jobs.push(job);
    }
  }

  return callback(undefined, content);
}

export default {
  get,
};
