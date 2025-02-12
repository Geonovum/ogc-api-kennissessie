import urlJoin from "url-join";
import { join } from "path";
import { getDatabases } from "../database/database.js";
import utils from "../utils/utils.js";
import projgeojson from "../utils/proj4.js";

function getLinks(neutralUrl, format, links) {
  if (format == "geojson") format = "json";

  function getTypeFromFormat(format) {
    var _formats = ["json", "geojson", "html", "csv"];
    var _encodings = [
      "application/geo+json",
      "application/geo+json",
      "text/html",
      "text/csv",
    ];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Access the features in the collection as ${format}`,
  });
  utils
    .getAlternateFormats(format, ["json", "html", "csv"])
    .forEach((altFormat) => {
      links.push({
        href: urlJoin(neutralUrl, `?f=${altFormat}`),
        rel: `alternate`,
        type: getTypeFromFormat(altFormat),
        title: `Access the features in the collection as ${altFormat}`,
      });
    });
}

function getParentLink(neutralUrl, format, links) {
  if (format == "geojson") format = "json";

  function getTypeFromFormat(format) {
    var _formats = ["json", "html"];
    var _encodings = ["application/json", "text/html"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  // remove :featureId
  neutralUrl = neutralUrl.substr(0, neutralUrl.lastIndexOf("/"));
  // remove 'items'
  neutralUrl = neutralUrl.substr(0, neutralUrl.lastIndexOf("/"));

  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `collection`,
    type: getTypeFromFormat(format),
    type: "application/json",
    title: `The collection the feature belongs to as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `The collection the feature belongs to as ${altFormat}`,
    });
  });
}

function get(neutralUrl, format, collectionId, featureId, query, callback) {
  const collections = getDatabases();
  const collection = collections[collectionId];
  if (!collection)
    return callback(
      {
        httpCode: 404,
        code: `Collection not found: ${collectionId}`,
        description:
          "Make sure you use an existing collectionId. See /Collections",
      },
      undefined
    );

  // Find feature, based on index
  var index = 0;
  for (; index < collection.features.length; index++)
    if (collection.features[index].id == featureId) break;
  if (index >= collection.features.length)
    return callback(
      {
        httpCode: 404,
        code: `Item: ${featureId} not found`,
        description: "Id needs to exist",
      },
      undefined
    );

  var queryParams = ["f"];
  // All attributes from schema can be queried
  for (let attributeName in collection.schema)
    if (collection.schema[attributeName]["x-ogc-role"] != "primary-geometry")
      queryParams.push(attributeName);
  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400,
  //         if the request URI includes a query parameter that is not specified in the API definition
  var rejected = utils.checkForAllowedQueryParams(query, queryParams);
  if (rejected.length > 0)
    return callback(
      {
        httpCode: 400,
        code: `The following query parameters are rejected: ${rejected}`,
        description: "Valid parameters for this request are " + queryParams,
      },
      undefined
    );

  var feature = structuredClone(collection.features[index]);

  var _query = query;
  if (_query) {
  }

  feature.links = [];

  getLinks(neutralUrl, format, feature.links);
  getParentLink(neutralUrl, format, feature.links);

  return callback(undefined, feature);
}

export default {
  get
};
