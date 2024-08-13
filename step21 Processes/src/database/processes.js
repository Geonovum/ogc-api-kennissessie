import { join } from "path";
import YAML from "yaml";
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
    dataDict[name] = oapip;
  });
}

var dataDict = {};

export function getProcesses() {
  return dataDict;
}

export default getProcesses;
