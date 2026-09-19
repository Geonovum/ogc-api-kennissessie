import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";
import { getContent as getJobContent, stopJobProcess } from "./job.js";

const JOB_STATUSES = [
  "accepted",
  "running",
  "successful",
  "failed",
  "dismissed",
];
const DURATION_STATUSES = ["running", "successful", "failed", "dismissed"];
const MAX_LIMIT = 10000;

function getTypeFromFormat(format) {
  var _formats = ["json", "html"];
  var _encodings = ["application/json", "text/html"];

  var i = _formats.indexOf(format);
  return _encodings[i];
}

function withQuery(neutralUrl, params) {
  var url = new URL(neutralUrl);
  Object.keys(params).forEach((key) => {
    var value = params[key];
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== "") url.searchParams.append(key, item);
      });
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function listQueryParams(format, query, extra) {
  var params = { f: format };
  if (query.type && query.type.length) params.type = query.type;
  if (query.processID && query.processID.length) params.processID = query.processID;
  if (query.status && query.status.length) params.status = query.status;
  if (query.datetime) params.datetime = query.datetime;
  if (query.minDuration !== undefined) params.minDuration = query.minDuration;
  if (query.maxDuration !== undefined) params.maxDuration = query.maxDuration;
  params.limit = query.limit;
  if (query.offset > 0) params.offset = query.offset;
  return Object.assign(params, extra || {});
}

function getLinks(neutralUrl, format, query, links) {
  var selfParams = listQueryParams(format, query);
  links.push({
    href: withQuery(neutralUrl, selfParams),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Jobs list as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: withQuery(neutralUrl, listQueryParams(altFormat, query)),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `Jobs list as ${altFormat}`,
    });
  });
}

function addPaginationLinks(links, neutralUrl, format, query, numberMatched) {
  if (query.offset + query.limit < numberMatched) {
    links.push({
      href: withQuery(
        neutralUrl,
        listQueryParams(format, query, { offset: query.offset + query.limit })
      ),
      rel: `next`,
      type: getTypeFromFormat(format),
      title: `Next page of jobs`,
    });
  }

  if (query.offset > 0) {
    links.push({
      href: withQuery(
        neutralUrl,
        listQueryParams(format, query, {
          offset: Math.max(0, query.offset - query.limit),
        })
      ),
      rel: `prev`,
      type: getTypeFromFormat(format),
      title: `Previous page of jobs`,
    });
  }
}

function jobDurationSeconds(job, now) {
  if (!job.started) return undefined;
  var start = Date.parse(job.started);
  if (!Number.isFinite(start)) return undefined;

  // (OAPIP) Req 75 E: running duration is invoked-at minus started
  if (job.status === "running") return (now - start) / 1000;

  // (OAPIP) Req 75 F: completed duration is finished minus started
  if (!job.finished) return undefined;
  var end = Date.parse(job.finished);
  if (!Number.isFinite(end)) return undefined;
  return (end - start) / 1000;
}

function createdIntersectsDatetime(created, datetime) {
  if (!datetime) return true;

  var parts = datetime.split("/");
  if (parts.length === 1)
    return utils.dates.compare(created, parts[0]) == 0;

  var beginDate = parts[0];
  var endDate = parts[1];

  if (beginDate && beginDate !== ".." && endDate && endDate !== "..")
    return utils.dates.inRange(created, beginDate, endDate);
  if ((!beginDate || beginDate === "..") && endDate && endDate !== "..")
    return utils.dates.until(created, endDate);
  if (beginDate && beginDate !== ".." && (!endDate || endDate === ".."))
    return utils.dates.from(created, beginDate);
  return true;
}

function isDateTimePart(part) {
  if (part === undefined || part === "" || part === "..") return true;
  return Number.isFinite(Date.parse(part));
}

function matchesFilters(job, query, now) {
  // (OAPIP) Req 66: type=process keeps process jobs; omitted includes all
  if (query.type.length && !query.type.includes(job.type)) return false;

  // (OAPIP) Req 69: processID is an OR list of identifiers
  if (
    query.processID.length &&
    !query.processID.includes(job.processID)
  )
    return false;

  // (OAPIP) Req 71: status is an OR list of status values
  if (query.status.length && !query.status.includes(job.status)) return false;

  // (OAPIP) Req 73: datetime intersects the created timestamp
  if (!createdIntersectsDatetime(job.created, query.datetime)) return false;

  if (query.minDuration === undefined && query.maxDuration === undefined)
    return true;

  // (OAPIP) Req 75: duration only considers running/completed jobs unless
  // status was given; jobs without start/finish stats are omitted
  var durationStatuses = query.status.length
    ? query.status
    : DURATION_STATUSES;
  if (!durationStatuses.includes(job.status)) return false;

  var duration = jobDurationSeconds(job, now);
  if (duration === undefined) return false;
  if (query.minDuration !== undefined && duration < query.minDuration)
    return false;
  if (query.maxDuration !== undefined && duration > query.maxDuration)
    return false;

  return true;
}

/**
 * @export
 * @param {*} processId
 * @param {*} isAsync
 * @returns {{ jobID: string; status: string; message: string; progress: number; created: any; }}
 */
export function create(processId, isAsync) {
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
  job.type = "process";
  job.jobID = e7();
  job.id = job.jobID;
  job.processingEntityType = "ogc-api-processes";
  job.status = "accepted"; // accepted, running, successful, failed, dismissed
  job.updated = new Date().toISOString();
  job.message = "Job accepted";
  job.progress = 0;
  job.created = new Date().toISOString();

  getJobs()[job.jobID] = job;

  return job;
}

/**
 * @param {*} neutralUrl
 * @param {*} format
 * @param {*} query
 * @param {*} callback
 * @returns {*}
 */
function get(neutralUrl, format, query, callback) {
  if (query.datetime) {
    var parts = query.datetime.split("/");
    if (parts.length > 2 || parts.some((part) => !isDateTimePart(part)))
      return callback(
        {
          httpCode: 400,
          code: "InvalidParameterValue",
          description: `Parameter datetime is not a valid RFC 3339 instant or interval`,
        },
        undefined
      );
  }

  if (query.status.some((status) => !JOB_STATUSES.includes(status)))
    return callback(
      {
        httpCode: 400,
        code: "InvalidParameterValue",
        description: `Valid status values are ${JOB_STATUSES.join(", ")}`,
      },
      undefined
    );

  var now = Date.now();
  var jobs = getJobs();
  var matched = [];

  for (var key in jobs) {
    if (!Object.prototype.hasOwnProperty.call(jobs, key)) continue;
    var stored = jobs[key];
    if (!matchesFilters(stored, query, now)) continue;
    matched.push(getJobContent(neutralUrl, format, key, stored));
  }

  matched.sort((a, b) => {
    if (a.created < b.created) return 1;
    if (a.created > b.created) return -1;
    return 0;
  });

  var content = {};
  content.links = [];
  getLinks(neutralUrl, format, query, content.links);

  // (OAPIP) Req 77: do not return more jobs than limit
  content.jobs = matched.slice(query.offset, query.offset + query.limit);

  // (OAPIP) Rec 21: next page if more selected jobs remain
  addPaginationLinks(content.links, neutralUrl, format, query, matched.length);

  return callback(undefined, content);
}

export function deleteAll() {
  var jobs = getJobs();
  for (var jobId of Object.keys(jobs)) {
    stopJobProcess(jobs[jobId]);
    delete jobs[jobId];
  }
}

export default {
  get,
  deleteAll,
  JOB_STATUSES,
  MAX_LIMIT,
};
