import urlJoin from "url-join";
import { getDatabases } from "../../database/database.js";
import utils from "../../utils/utils.js";

function getLinks(neutralUrl, format, name, links) {
  function getTypeFromFormat(format) {
    var _formats = ["json", "html"];
    var _encodings = ["application/json", "text/html"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `The Document`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `The Document as ${altFormat}`,
    });
  });
}

function getChildrenLinks(neutralUrl, format, name, links) {
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
    href: urlJoin(neutralUrl, `items?f=${format}`),
    rel: `items`,
    type: getTypeFromFormat(format),
    title: `Access the features in the collection as ${format}`,
  });
  utils
    .getAlternateFormats(format, ["json", "html", "csv"])
    .forEach((altFormat) => {
      links.push({
        href: urlJoin(neutralUrl, `items?f=${altFormat}`),
        rel: `items`,
        type: getTypeFromFormat(altFormat),
        title: `Access the features in the collection as ${altFormat}`,
      });
    });
}

function getMetaData(neutralUrl, format, name, document) {
  var content = {};
  // A local identifier for the collection that is unique for the dataset;
  content.id = name; // required
  // An optional title and description for the collection;
  content.title = document.name;
  content.description = document.description;
  content.links = [];

  getLinks(neutralUrl, format, name, content.links);
  getChildrenLinks(neutralUrl, format, name, content.links);

  // An optional extent that can be used to provide an indication of the spatial and temporal
  // extent of the collection - typically derived from the data;
  content.extent = document.extent;
  // Requirement 16 A and B

  // An optional indicator about the type of the items in the collection
  // (the default value, if the indicator is not provided, is 'feature').
  content.itemType = "feature";
  // An optional list of coordinate reference systems (CRS) in which geometries may be returned by the server.
  // The default value is a list with the default CRS (WGS 84 with axis order longitude/latitude);
  content.crs = document.crs;
  content.storageCrs = document.storageCrs;

  return content;
}

function get(neutralUrl, format, collectionId, callback) {
  var query = { type: "FeatureCollection", name: `${collectionId}` };
  var projection = { name: 1, crs: 1, _id: 1 };

  var collections = getDatabases();
  var collection = collections[collectionId];
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

  var content = getMetaData(neutralUrl, format, collectionId, collection);

  return callback(undefined, content);
}

export default {
  get,
};
