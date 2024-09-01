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

var _processes = {};
var _jobs = {};
var _results = {};

export function getProcesses() {
  return _processes;
}

export function getJobs() {
  return _jobs;
}

export function getResults() {
  return _results;
}

export default { getProcesses, getJobs, getResults };
