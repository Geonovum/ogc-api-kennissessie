import { join } from "path";
import { writeFileSync } from "fs";

const SAMPLE_SIZE = 10;
const FETCH_ALL_THRESHOLD = 250;

function datasetsDirectory() {
  var dataPath =
    (global.config && global.config.data && global.config.data.path) ||
    join(import.meta.dirname, "..", "..");
  return join(dataPath, "datasets");
}

function toItemsUrl(uri) {
  var parsed;
  try {
    parsed = new URL(uri);
  } catch (err) {
    throw new Error("not a valid URL");
  }

  var path = parsed.pathname.replace(/\/+$/, "");
  if (path.endsWith("/items")) {
    parsed.pathname = path;
    return parsed;
  }
  if (/\/collections\/[^/]+$/.test(path)) {
    parsed.pathname = `${path}/items`;
    return parsed;
  }

  throw new Error(
    "not a valid endpoint, should be OGC API features collection or /items endpoint"
  );
}

function collectionIdFromPath(pathname) {
  var parts = pathname.replace(/\/+$/, "").split("/");
  var itemsIdx = parts.lastIndexOf("items");
  if (itemsIdx > 0) return parts[itemsIdx - 1];
  return "sample";
}

function sanitizeId(id) {
  var cleaned = String(id).replace(/[^A-Za-z0-9_-]/g, "_");
  if (!cleaned) throw new Error("Invalid output collection name");
  return cleaned;
}

function withQuery(parsed, params) {
  var url = new URL(parsed.toString());
  for (var [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function fetchJson(url) {
  var res;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/geo+json, application/json" },
    });
  } catch (err) {
    throw new Error(`Unable to fetch features endpoint: ${err.message}`);
  }

  if (!res.ok) throw new Error(`Features endpoint returned HTTP ${res.status}`);

  try {
    return await res.json();
  } catch (err) {
    throw new Error("Features endpoint did not return JSON");
  }
}

function randomUnique(max, count) {
  var size = Math.min(count, max);
  if (size >= max) return Array.from({ length: max }, (_, i) => i);

  var picked = new Set();
  while (picked.size < size) picked.add(Math.floor(Math.random() * max));
  return [...picked].sort((a, b) => a - b);
}

function cleanFeature(feature) {
  var cleaned = {
    type: "Feature",
    properties: feature.properties || {},
    geometry: feature.geometry || null,
  };
  if (feature.id !== undefined) cleaned.id = feature.id;
  return cleaned;
}

async function fetchSample(itemsUrl, total) {
  var size = Math.min(SAMPLE_SIZE, total);
  var offsets = randomUnique(total, size);

  if (total <= FETCH_ALL_THRESHOLD) {
    var page = await fetchJson(
      withQuery(itemsUrl, { limit: total, offset: 0, f: "json" })
    );
    var features = page.features || [];
    return offsets
      .map((index) => features[index])
      .filter(Boolean)
      .map(cleanFeature);
  }

  var sampled = [];
  for (var offset of offsets) {
    var itemPage = await fetchJson(
      withQuery(itemsUrl, { limit: 1, offset, f: "json" })
    );
    var feature = itemPage.features && itemPage.features[0];
    if (feature) sampled.push(cleanFeature(feature));
  }
  return sampled;
}

export default async function sampleFeatures(uri, name) {
  var itemsUrl = toItemsUrl(uri);
  var sourceId = collectionIdFromPath(itemsUrl.pathname);
  var outputId = sanitizeId(name || `${sourceId}_sample`);

  var meta = await fetchJson(withQuery(itemsUrl, { limit: 1, f: "json" }));
  if (typeof meta.numberMatched !== "number")
    throw new Error("Features endpoint did not return numberMatched");
  if (meta.numberMatched < 1)
    throw new Error("Features endpoint returned no features");

  var features = await fetchSample(itemsUrl, meta.numberMatched);
  if (features.length === 0)
    throw new Error("Could not fetch sampled features");

  var geojson = {
    type: "FeatureCollection",
    name: outputId,
    features,
  };

  var fileName = `${outputId}.geojson`;
  return {
    collectionId: outputId,
    file: fileName,
    filePath: join(datasetsDirectory(), fileName),
    count: features.length,
    geojson,
  };
}

export function writeSample(result) {
  writeFileSync(result.filePath, JSON.stringify(result.geojson));
}
