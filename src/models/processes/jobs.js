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
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16)
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

  content.links = getContent(neutralUrl, format);

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
