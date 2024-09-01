import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getJobs, getResults } from "../../database/processes.js";

function get(neutralUrl, format, jobId, callback) {
  let results = getResults();
  let result = results[jobId];
  if (!result)
    return callback(
      {
        httpCode: 404,
        code: `Job not found: ${jobId}`,
        description: "Make sure you use an existing jobId. See /Jobs",
      },
      undefined
    );

  return callback(undefined, result);
}

export default {
  get,
};
