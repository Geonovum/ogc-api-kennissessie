import http from "node:http";
import https from "node:https";
import exceptions from "./exceptions.js";

function httpPost(url, body) {
  var parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    console.log(`subscriber invalid URI '${url}': ${err.message}`);
    return;
  }

  var isHttps = parsed.protocol === "https:";
  var lib = isHttps ? https : http;
  var data = typeof body === "object" ? JSON.stringify(body) : String(body);
  var req = lib.request(
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
      var chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () =>
        console.log(
          `subscriber ${res.statusCode} ${url} ${Buffer.concat(chunks).toString()}`
        )
      );
    }
  );
  req.on("error", (err) => console.log(`subscriber POST ${url}: ${err.message}`));
  req.write(data);
  req.end();
}

function uri(job, kind) {
  var subscriber = job && job.subscriber;
  if (!subscriber) return undefined;
  if (kind === "success") return subscriber.successUri;
  if (kind === "failed") return subscriber.failedUri;
  if (kind === "inProgress") return subscriber.inProgressUri;
  return undefined;
}

function notify(job, kind, body) {
  var target = uri(job, kind);
  if (!target) return;
  console.log(`subscriber ${kind} POST ${target}`);
  httpPost(target, body);
}

export function statusInfo(job) {
  return {
    processID: job.processID,
    type: job.type || "process",
    jobID: job.jobID,
    status: job.status,
    message: job.message,
    created: job.created,
    started: job.started,
    finished: job.finished,
    updated: job.updated,
    progress: job.progress,
  };
}

function exceptionBody(job) {
  return {
    type: exceptions.SERVER_ERROR,
    title: "failed",
    status: 500,
    detail: job.message || "Process execution failed",
  };
}

function isDismissed(job) {
  return job.status === "dismissed";
}

export function startJob(job, message) {
  if (isDismissed(job)) return false;
  job.status = "running";
  job.started = job.started || new Date().toISOString();
  job.updated = new Date().toISOString();
  if (message) job.message = message;
  else if (!job.message || job.message === "Job accepted")
    job.message = "Job running";
  notify(job, "inProgress", statusInfo(job));
  return true;
}

export function progressJob(job, progress, message) {
  if (isDismissed(job)) return false;
  job.progress = progress;
  if (message !== undefined) job.message = message;
  job.updated = new Date().toISOString();
  notify(job, "inProgress", statusInfo(job));
  return true;
}

export function succeedJob(job, content) {
  if (isDismissed(job)) return false;
  delete job.child;
  job.status = "successful";
  job.progress = 100;
  job.message = "Job complete";
  job.finished = new Date().toISOString();
  job.updated = new Date().toISOString();
  job.results = content;
  notify(job, "success", content);
  return true;
}

export function failJob(job, message) {
  if (isDismissed(job)) return false;
  delete job.child;
  job.status = "failed";
  job.progress = 100;
  job.message = message;
  job.finished = new Date().toISOString();
  job.updated = new Date().toISOString();
  notify(job, "failed", exceptionBody(job));
  return true;
}
