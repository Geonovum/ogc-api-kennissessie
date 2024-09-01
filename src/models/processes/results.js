import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs } from "../../database/processes.js";

function get(neutralUrl, format, jobId, callback) {
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

  return callback(undefined, job.results);
}

export default {
  get,
};
