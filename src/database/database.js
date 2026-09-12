import { join, extname } from "path";
import YAML from "yaml";
import fs from "fs";
import { makeOAPIF, inferDataDef } from "./geojsonParser.js";

var dataDict = {};
var datasetsDir = null;
var fileStats = new Map();
var failedStats = new Map();
var reloadTimers = new Map();
const DEBOUNCE_MS = 500;
const RETRY_MS = 250;
const MAX_RETRIES = 8;
const POLL_MS = 2000;

function collectionId(fileName) {
  return fileName.replace(/\.\w+$/, "");
}

function isWatchedFile(fileName) {
  var ext = extname(fileName).toLowerCase();
  return ext === ".geojson" || ext === ".yml" || ext === ".yaml";
}

function mtimeMs(path) {
  try {
    return fs.statSync(path).mtimeMs;
  } catch {
    return 0;
  }
}

function dataDefPath(dir, id) {
  var ymlPath = join(dir, `${id}.yml`);
  var yamlPath = join(dir, `${id}.yaml`);
  if (fs.existsSync(ymlPath)) return ymlPath;
  if (fs.existsSync(yamlPath)) return yamlPath;
  return null;
}

function snapshot(dir, id) {
  return {
    geojsonMtime: mtimeMs(join(dir, `${id}.geojson`)),
    ymlMtime: mtimeMs(dataDefPath(dir, id) || ""),
  };
}

function sameSnapshot(a, b) {
  return a && b && a.geojsonMtime === b.geojsonMtime && a.ymlMtime === b.ymlMtime;
}

function readDataDef(dir, id, geojson) {
  var defPath = dataDefPath(dir, id);
  if (!defPath) return inferDataDef(geojson, id);

  var dataDef = YAML.parse(fs.readFileSync(defPath, "utf8"));
  if (!dataDef) return inferDataDef(geojson, id);
  if (!dataDef.crs) dataDef.crs = [];
  return dataDef;
}

function loadDataset(dir, id, attempt = 0) {
  var geojsonPath = join(dir, `${id}.geojson`);

  if (!fs.existsSync(geojsonPath)) {
    if (dataDict[id]) {
      delete dataDict[id];
      console.log(`Removed dataset ${id}`);
    }
    fileStats.delete(id);
    failedStats.delete(id);
    return;
  }

  try {
    var geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));
    var dataDef = readDataDef(dir, id, geojson);
    var oapif = makeOAPIF(geojson, dataDef);
    if (!oapif) {
      failedStats.set(id, snapshot(dir, id));
      console.log(`Skipped ${id}: no ID property in schema`);
      return;
    }

    var isNew = !dataDict[id];
    oapif.id = id;
    dataDict[id] = oapif;
    fileStats.set(id, snapshot(dir, id));
    failedStats.delete(id);
    console.log(
      `${isNew ? "Loaded" : "Reloaded"} dataset ${id} (${oapif.features.length} features)`
    );
  } catch (err) {
    var retryable =
      err instanceof SyntaxError ||
      err.code === "ENOENT" ||
      err.code === "EBUSY";
    if (retryable && attempt < MAX_RETRIES) {
      setTimeout(() => loadDataset(dir, id, attempt + 1), RETRY_MS);
      return;
    }
    failedStats.set(id, snapshot(dir, id));
    console.log(`Failed to load ${id}: ${err.message}`);
  }
}

function shouldLoad(dir, id) {
  var snap = snapshot(dir, id);
  if (sameSnapshot(fileStats.get(id), snap)) return false;
  if (sameSnapshot(failedStats.get(id), snap)) return false;
  return true;
}

function scheduleReload(dir, fileName) {
  if (!isWatchedFile(fileName)) return;

  var id = collectionId(fileName);
  if (reloadTimers.has(id)) clearTimeout(reloadTimers.get(id));

  reloadTimers.set(
    id,
    setTimeout(() => {
      reloadTimers.delete(id);
      if (shouldLoad(dir, id)) loadDataset(dir, id);
    }, DEBOUNCE_MS)
  );
}

function syncAll(dir, force) {
  var fileNames = fs.readdirSync(dir).filter((fn) => fn.endsWith(".geojson"));
  var ids = new Set(fileNames.map(collectionId));

  for (var id of Object.keys(dataDict)) {
    if (!ids.has(id)) {
      delete dataDict[id];
      fileStats.delete(id);
      failedStats.delete(id);
      console.log(`Removed dataset ${id}`);
    }
  }

  fileNames.forEach((fileName) => {
    var id = collectionId(fileName);
    if (force || shouldLoad(dir, id)) loadDataset(dir, id);
  });
}

function watchData(dir) {
  try {
    var watcher = fs.watch(dir, (eventType, filename) => {
      if (!filename) {
        syncAll(dir);
        return;
      }
      scheduleReload(dir, filename);
    });
    watcher.on("error", (err) => {
      console.log(`Dataset watcher error: ${err.message}`);
    });
    console.log(`Watching ${dir} for GeoJSON changes`);
  } catch (err) {
    console.log(`Could not watch ${dir}: ${err.message}`);
  }

  // Poll as well: fs.watch often misses events on Docker bind mounts
  setInterval(() => {
    try {
      syncAll(dir);
    } catch (err) {
      console.log(`Failed to refresh datasets: ${err.message}`);
    }
  }, POLL_MS);
}

export function readData(dir) {
  if (!fs.existsSync(dir)) return;

  datasetsDir = dir;
  syncAll(dir, true);
  watchData(dir);

  console.log(`Found ${Object.keys(dataDict).length} datasets`);
}

export function deleteDataset(id) {
  if (!id || typeof id !== "string" || /[\\/]/.test(id) || id.includes(".."))
    return {
      ok: false,
      httpCode: 400,
      description: "Invalid collection id",
    };

  if (!datasetsDir)
    return {
      ok: false,
      httpCode: 500,
      description: "Datasets folder not configured",
    };

  var geojsonPath = join(datasetsDir, `${id}.geojson`);
  var defPath = dataDefPath(datasetsDir, id);
  if (!dataDict[id] && !fs.existsSync(geojsonPath) && !defPath)
    return {
      ok: false,
      httpCode: 404,
      description: `Collection not found: ${id}`,
    };

  try {
    if (fs.existsSync(geojsonPath)) fs.unlinkSync(geojsonPath);
    if (defPath && fs.existsSync(defPath)) fs.unlinkSync(defPath);
  } catch (err) {
    return {
      ok: false,
      httpCode: 500,
      description: `Failed to delete ${id}: ${err.message}`,
    };
  }

  delete dataDict[id];
  fileStats.delete(id);
  failedStats.delete(id);
  console.log(`Deleted dataset ${id}`);
  return { ok: true };
}

export function getDatabases() {
  return dataDict;
}

export default getDatabases;
