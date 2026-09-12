import sampleFeatures, { writeSample } from "./sample.js";
import http from "node:http";
import https from "node:https";

const DURATION_MS = 30000;
const PROGRESS_STEPS = 10;

function httpPost(url, body) {
  const parsed = new URL(url);
  const isHttps = parsed.protocol === "https:";
  const lib = isHttps ? https : http;
  const data = typeof body === "object" ? JSON.stringify(body) : body;
  const req = lib.request(
    {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    },
    (res) => {
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => console.log(Buffer.concat(chunks).toString()));
    }
  );
  req.on("error", (err) => console.log(err));
  req.write(data);
  req.end();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDismissed(job) {
  return job.status === "dismissed";
}

function statusPayload(job) {
  return {
    jobID: job.jobID,
    status: job.status,
    progress: job.progress,
    message: job.message,
    updated: job.updated,
  };
}

function reportProgress(job, parameters, progress, message) {
  if (isDismissed(job)) return;

  job.progress = progress;
  job.message = message;
  job.updated = new Date().toISOString();

  if (parameters.subscriber && parameters.subscriber.inProgressUri) {
    httpPost(parameters.subscriber.inProgressUri, statusPayload(job));
  }
}

function failJob(job, parameters, message) {
  if (isDismissed(job)) return;

  job.status = "failed";
  job.progress = 100;
  job.message = message;
  job.finished = new Date().toISOString();
  job.updated = new Date().toISOString();

  if (parameters.subscriber && parameters.subscriber.failedUri) {
    httpPost(parameters.subscriber.failedUri, { message: job.message });
  }
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
  reportProgress(job, parameters, 0, "Fetching features");

  var result;
  try {
    result = await sampleFeatures(parameters.inputs.uri, parameters.inputs.name);
  } catch (err) {
    failJob(job, parameters, err.message);
    return;
  }

  if (isDismissed(job)) return;

  for (let step = 1; step <= PROGRESS_STEPS; step++) {
    var target = startedAt + (DURATION_MS * step) / PROGRESS_STEPS;
    var stillRunning = await sleepUntil(target, job);
    if (!stillRunning) return;

    if (step < PROGRESS_STEPS) {
      reportProgress(
        job,
        parameters,
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
    failJob(job, parameters, err.message);
    return;
  }

  if (isDismissed(job)) return;

  job.status = "successful";
  job.progress = 100;
  job.message = `Job complete`;
  job.finished = new Date().toISOString();
  job.updated = new Date().toISOString();
  job.results = content;

  if (parameters.subscriber && parameters.subscriber.successUri) {
    httpPost(parameters.subscriber.successUri, content);
  }
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

  job.status = "running";
  job.started = new Date().toISOString();
  job.updated = new Date().toISOString();
  job.progress = 0;
  job.message = "Job running";

  callback(undefined, undefined);

  run(process_, job, parameters).catch((err) => {
    failJob(job, parameters, err.message);
  });
}
