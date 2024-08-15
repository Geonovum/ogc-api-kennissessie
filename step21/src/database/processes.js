import { join } from "path";
import { readdirSync, readFileSync } from "fs";

export function readProcesses(dir) {
  var fileNames = readdirSync(dir).filter((fn) => fn.endsWith(".json"));

  fileNames.forEach((fileName) => {
    var path = join(dir, fileName);
    var rawData = readFileSync(path);
    var json = JSON.parse(rawData);

    var oapip = json;
    oapip.location = path;

    var name = fileName.replace(/\.\w+$/, "");
    _processes[name] = oapip;
  });
}

function readJobs() {
  var job = {};
  job.jobID = '81574318-1eb1-4d7c-af61-4b3fbcf33c4f';
  job.status = "accepted";
  job.message = "process started";
  job.progress = 12;
  job.created = "2021-05-04T10:13:00+05:00";

  _jobs[job.jobID] = job
}

var _processes = {};
var _jobs = {};

readJobs() // demo

export function getProcesses() {
  return _processes;
}

export function getJobs() {
  return _jobs;
}

export default { getProcesses, getJobs };
