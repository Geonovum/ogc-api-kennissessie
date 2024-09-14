import { join } from "path";
import fs from "fs";

export async function readProcesses(dir) {
  if (fs.existsSync(dir)) {
    var fileNames = fs.readdirSync(dir).filter((fn) => fn.endsWith(".json"));

    fileNames.forEach((fileName) => {
      var path = join(dir, fileName);
      var rawData = fs.readFileSync(path);
      var json = JSON.parse(rawData);

      var oapip = json;
      oapip.location = path;

      _processes[oapip.id] = oapip;
    });
  }

  console.log(`Found ${Object.keys(_processes).length} processes`);
}

var _processes = {};
var _jobs = {};

export function getProcesses() {
  return _processes;
}

export function getJobs() {
  return _jobs;
}

export default { getProcesses, getJobs };
