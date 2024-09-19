import urlJoin from "url-join";
import * as turf from "@turf/turf";
import { getDatabases } from "../../../database/database.js";
import utils from "../../../utils/utils.js";

function get(neutralUrl, format, callback) {
  // Requirement 2 A & B
  // The content of that response SHALL be based upon the OpenAPI 3.0 schema landingPage.yaml (http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/landingPage.yaml)
  // and include at least links to the following resources:
  //
  // - the API definition (relation type `service-desc` or `service-doc`)
  // - /conformance (relation type `conformance`)
  // - /collections (relation type `data`)
  var content = {};
  content.title = global.config.metadata.identification.title; // Requirement 2 B
  content.description = global.config.metadata.identification.description;

  content.extent = {};
  content.extent.spatial = {};
  content.extent.spatial.bbox = [];
  content.extent.temporal = {};
  content.extent.temporal.interval = [[]];
  content.extent.temporal.trs =
    "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian";

  let bboxs = [];
  let intervals = [[]];
  const collections = getDatabases();
  for (var name in collections) {
    const collection = collections[name];
    bboxs.push(turf.bboxPolygon(collection.extent.spatial.bbox));
    intervals.push(collection.extent.temporal.interval);
    content.extent.spatial.crs = collection.crs[0]; // default crs
  }
  const fc = turf.featureCollection(bboxs);
  content.extent.spatial.bbox = (fc.features.length > 0) ? turf.bbox(turf.union(fc)) : null;
  content.extent.temporal.interval = ["..", ".."];

  content.links = [];
  content.links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: utils.getTypeFromFormat(format),
    title: `This document`,
  });

  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    content.links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: utils.getTypeFromFormat(altFormat),
      title: `This document as ${altFormat}`,
    });
  });

  content.links.push({
    href: urlJoin(neutralUrl, "conformance"),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/conformance`,
    title: `OGC API conformance classes implemented by this server`,
  });

  content.links.push({
    href: urlJoin(neutralUrl, "conformance"),
    rel: `conformance`,
    title: `OGC API conformance classes implemented by this server`,
  });

  content.links.push({
    href: urlJoin(neutralUrl, "api?f=json"),
    rel: `service-desc`,
    type: `application/vnd.oai.openapi+json;version=3.0`,
    title: `Definition of the API in OpenAPI 3.0`,
  });
  content.links.push({
    href: urlJoin(neutralUrl, "api?f=yaml"),
    rel: `service-desc`,
    type: `application/vnd.oai.openapi;version=3.0`,
    title: `Definition of the API in OpenAPI 3.0`,
  });
  content.links.push({
    href: urlJoin(neutralUrl, "api?f=html"),
    rel: `service-doc`,
    type: `text/html`,
    title: `Documentation of the API`,
  });

  content.links.push({
    href: urlJoin(neutralUrl, "collections"),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/data`,
    title: `Access the data`,
  });

  content.links.push({
    href: urlJoin(neutralUrl, "collections"),
    rel: `data`,
    title: `Access the data`,
  });

  content.links.push({
    href: urlJoin(neutralUrl, "processes"),
    type: `application/json`,
    rel: `http://www.opengis.net/def/rel/ogc/1.0/processes`,
    title: `Metadata about the processes`,
  });
  content.links.push({
    href: urlJoin(neutralUrl, "jobs"),
    type: `application/json`,
    rel: `http://www.opengis.net/def/rel/ogc/1.0/job-list`,
    title: `The endpoint for job monitoring`,
  });

  content.links.push({
    href: global.config.metadata.licenseUrl,
    rel: `license`,
    title: global.config.metadata.licenseName,
    type: `text/html`,
  });

  return callback(undefined, content);
}

export default {
  get,
};
