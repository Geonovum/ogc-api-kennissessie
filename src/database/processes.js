import { join, basename, dirname } from "path";
import fs from "fs";

export async function readProcesses(dir) {
  if (fs.existsSync(dir)) {
    processesDir = dir;
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

var processesDir = null;
var _processes = {};
var _jobs = {};

export function deleteProcess(id) {
  if (!id || typeof id !== "string" || /[\\/]/.test(id) || id.includes(".."))
    return {
      ok: false,
      httpCode: 400,
      description: "Invalid process id",
    };

  var process_ = _processes[id];
  if (!process_)
    return {
      ok: false,
      httpCode: 404,
      description: `Process not found: ${id}`,
    };

  var jsonPath = process_.location;
  var processFolder = jsonPath.replace(/\.[^/.]+$/, "");
  var rootDir = processesDir || dirname(jsonPath);

  try {
    if (fs.existsSync(jsonPath)) fs.unlinkSync(jsonPath);
    if (
      fs.existsSync(processFolder) &&
      fs.lstatSync(processFolder).isDirectory() &&
      processFolder !== rootDir &&
      basename(processFolder) !== "processes"
    )
      fs.rmSync(processFolder, { recursive: true, force: true });
  } catch (err) {
    return {
      ok: false,
      httpCode: 500,
      description: `Failed to delete ${id}: ${err.message}`,
    };
  }

  delete _processes[id];
  console.log(`Deleted process ${id}`);
  return { ok: true };
}

export function getProcesses() {
  return _processes;
}

export function getJobs() {
  return _jobs;
}

export default { getProcesses, getJobs };
