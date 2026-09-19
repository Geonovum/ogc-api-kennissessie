import sampleFeatures, { writeSample } from "./sample.js";
import {
  startJob,
  progressJob,
  succeedJob,
  failJob,
} from "../../../src/models/processes/subscriber.js";

const DURATION_MS = 30000;
const PROGRESS_STEPS = 10;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDismissed(job) {
  return job.status === "dismissed";
}

function transmissionMode(requested, key) {
  var spec = requested[key];
  if (spec && spec.transmissionMode) return spec.transmissionMode;
  return "value";
}

function includeOutput(requested, key) {
  return Object.keys(requested).length === 0 || requested[key] != undefined;
}

function resultContent(job, process_, parameters, result) {
  if (parameters.outputs != undefined) {
    for (let key of Object.keys(parameters.outputs)) {
      if (process_.outputs[key] == undefined) {
        throw new Error(
          `The ${key} argument specified as ResponseDocument identifier was not recognized.`
        );
      }
    }
  }

  var base = String(job.serviceUrl || "").replace(/\/+$/, "");
  var collectionUrl = `${base}/collections/${result.collectionId}`;
  var itemsUrl = `${collectionUrl}/items`;
  var requested = parameters.outputs || {};
  const content = {};

  if (includeOutput(requested, "collection")) {
    if (transmissionMode(requested, "collection") === "reference")
      content.collection = {
        href: collectionUrl,
        type: "application/json",
        rel: "collection",
        title: result.collectionId,
      };
    else
      content.collection = {
        id: result.collectionId,
        title: (result.geojson && result.geojson.name) || result.collectionId,
        itemType: "feature",
        numberReturned: result.count,
      };
  }

  if (includeOutput(requested, "items")) {
    if (transmissionMode(requested, "items") === "reference")
      content.items = {
        href: itemsUrl,
        type: "application/geo+json",
        rel: "items",
        title: `${result.collectionId} items`,
      };
    else content.items = result.geojson;
  }

  return content;
}

async function sleepUntil(timestamp, job) {
  while (Date.now() < timestamp) {
    if (isDismissed(job)) return false;
    await sleep(Math.min(250, timestamp - Date.now()));
  }
  return !isDismissed(job);
}

async function run(process_, job, parameters) {
  const startedAt = Date.now();

  var result;
  try {
    result = await sampleFeatures(parameters.inputs.uri, parameters.inputs.name);
  } catch (err) {
    failJob(job, err.message);
    return;
  }

  if (isDismissed(job)) return;

  for (let step = 1; step <= PROGRESS_STEPS; step++) {
    var target = startedAt + (DURATION_MS * step) / PROGRESS_STEPS;
    var stillRunning = await sleepUntil(target, job);
    if (!stillRunning) return;

    if (step < PROGRESS_STEPS) {
      progressJob(
        job,
        step * 10,
        `Sampling features (${step * 10}%)`
      );
    }
  }

  if (isDismissed(job)) return;

  try {
    var content = resultContent(job, process_, parameters, result);
    writeSample(result);
  } catch (err) {
    failJob(job, err.message);
    return;
  }

  if (isDismissed(job)) return;

  succeedJob(job, content);
}

/**
 * @export
 * @param {*} process_
 * @param {*} job
 * @param {*} isAsync
 * @param {*} parameters
 * @param {*} callback
 * @returns {*}
 */
export async function launch(process_, job, isAsync, parameters, callback) {
  if (parameters.inputs == undefined || parameters.inputs.uri == undefined)
    return callback(
      { httpCode: 400, description: `uri not found` },
      undefined
    );

  if (!isAsync) {
    return callback(
      { httpCode: 400, description: `sampleFeatures run only async` },
      undefined
    );
  }

  startJob(job, "Fetching features");
  job.progress = 0;

  callback(undefined, undefined);

  run(process_, job, parameters).catch((err) => {
    failJob(job, err.message);
  });
}
