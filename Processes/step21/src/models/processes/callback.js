import urlJoin from "url-join";
import { join } from "path";
import { existsSync } from "fs";
import { getProcesses, getJobs } from "../../database/processes.js";
import { execute } from "./job.js";
import { create } from "./jobs.js";

/**
 * Description placeholder
 *
 * @param {*} neutralUrl
 * @param {*} jobId
 * @param {*} query
 * @param {*} callback
 * @returns {*}
 */
function post(neutralUrl, jobId, query, callback) {
  var jobs = getJobs();
  var job = jobs[jobId];
  if (!job)
    return callback(
      {
        code: 404,
        description: `Job ${jobId} not found. See /Jobs`,
      },
      undefined
    );

  let t = query.type;

  let content = {};
  callback(undefined, content);
}

export default {
  post,
};
