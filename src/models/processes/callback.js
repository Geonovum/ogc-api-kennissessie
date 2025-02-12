import { getProcesses, getJobs } from "../../database/processes.js";

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

  /*
  switch (query.type) {
  }
*/

  let content = job.results;
  callback(undefined, content);
}

export default {
  post,
};
