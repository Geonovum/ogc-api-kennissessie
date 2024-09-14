import { join } from "path";
import YAML from "yaml";
import fs from "fs";
import { makeOAPIF } from "./geojsonParser.js";

function readGeoJSONfiles(dir) {
  var fileNames = fs.readdirSync(dir).filter((fn) => fn.endsWith(".geojson"));

  fileNames.forEach((fileName) => {
    var rawData = fs.readFileSync(join(dir, fileName));
    var geojson = JSON.parse(rawData);

    var ymlFilename = fileName.replace(/\.\w+$/, ".yml");
    var rawDataDef = fs.readFileSync(join(dir, ymlFilename));
    var dataDef = YAML.parse(rawDataDef.toString());

    var oapif = makeOAPIF(geojson, dataDef);

    var name = fileName.replace(/\.\w+$/, "");
    dataDict[name] = oapif;
  });
}

var dataDict = {};

export function readData(dir) {
  if (fs.existsSync(dir)) readGeoJSONfiles(dir);

  console.log(`Found ${Object.keys(dataDict).length} datasets`);
}

export function getDatabases() {
  return dataDict;
}

export default getDatabases;
