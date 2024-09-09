import urlJoin from "url-join";
import { join } from "path";
import { getDatabases } from "../../database/database.js";
import utils from "../../utils/utils.js";
import projgeojson from "../../utils/proj4.js";

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

  var queryParams = ["f", "crs", "skipGeometry", "properties"];
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

  // default crs from collection
  feature.headerContentCrs = collection.crs[0];

  var doSkipGeometry = false;
  var doProperties = [];

  var _query = query;
  if (_query) {
    if (_query.crs) {
      var toEpsg = utils.UriToEPSG(query.crs);
      feature = projgeojson.projectFeature(feature, "EPSG:4326", toEpsg);
      if (feature == undefined)
        return callback(
          {
            httpCode: 400,
            code: `Bad Request`,
            description: `Invalid operator: ${query.crs}`,
          },
          undefined
        );

      feature.headerContentCrs = query.crs;
      delete _query.crs;
    }

    if (_query.skipGeometry === "true") doSkipGeometry = true;
    delete _query.skipGeometry;

    if (_query.properties) doProperties = _query.properties.split(",");
    delete _query.properties;
  }

  if (doSkipGeometry) delete feature.geometry;

  if (doProperties.length > 0) {
    for (var propertyName in feature.properties)
      if (!doProperties.includes(propertyName))
        delete feature.properties[propertyName];
  }

  feature.links = [];

  getLinks(neutralUrl, format, feature.links);
  getParentLink(neutralUrl, format, feature.links);

  return callback(undefined, feature);
}

function create(formatFreeUrl, collectionId, body, callback) {
  if (body.type.toLowerCase() != "feature")
    return callback({
      httpCode: 400,
      code: `Type not "feature"`,
      description: 'Type must be "feature"',
    });

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

  // (OAPIF P5) Permission 3: If the representation of the resource submitted in the request body contained a resource identifier,
  //         the server MAY use this identifier as the new resource identifier in the collection
  //         or the server MAY ignore the value and assign its own identifier for the resource.
  // (here is go for option 2: generate own id)
  delete body.id;

  // generate new id (than largest id and add 1)
  var i = 0;
  var newId = -1;
  for (; i < collection.features.length; i++)
    if (collection.features[i].id > newId) newId = collection.features[i].id;
  newId++;

  // (OAPIF P4) Requirement 5 If the operation completes successfully, the server SHALL assign a new, unique identifier
  //      within the collection for the newly added resource.
  body.id = newId;

  // (OAPIF P4) Requirement 3A: The body of a POST request SHALL contain a representation of the resource to be added to the specified collection.
  collection.features.push(body);

  formatFreeUrl = join(formatFreeUrl, newId.toString());

  return callback(undefined, body, formatFreeUrl);
}

function replacee(formatFreeUrl, collectionId, featureId, body, callback) {
  if (body.type.toLowerCase() != "feature")
    return callback({
      httpCode: 400,
      code: `Type not "feature"`,
      description: 'Type must be "feature"',
    });

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

  // Find feature, based on index
  var oldId = 0;
  for (; oldId < collection.features.length; oldId++)
    if (collection.features[oldId].id == featureId) break;
  if (oldId >= collection.features.length)
    return callback(
      {
        httpCode: 404,
        code: `Item: ${featureId} not found`,
        description: "Id needs to exist",
      },
      undefined
    );

  // (OAPIF P4) Requirement 4 If the operation completes successfully, the server SHALL assign a new, unique identifier
  //      within the collection for the newly added resource.

  // generate new id (than largest id and add 1)
  var i = 0;
  var newId = -1;
  for (; i < collection.features.length; i++)
    if (collection.features[i].id > newId) newId = collection.features[i].id;
  newId++;

  {
    // the Transaction
    // delete the 'old' resource
    collection.features.splice(oldId, 1);
    // create new resource
    body.id = newId;
    collection.features.push(body);
  }

  formatFreeUrl = formatFreeUrl.substr(0, formatFreeUrl.lastIndexOf("/"));
  formatFreeUrl = join(formatFreeUrl, newId.toString());

  return callback(undefined, body, formatFreeUrl);
}

function deletee(collectionId, featureId, callback) {
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

  // Find feature, based on index
  var oldId = 0;
  for (; oldId < collection.features.length; oldId++)
    if (collection.features[oldId].id == featureId) break;
  if (oldId >= collection.features.length)
    return callback(
      {
        httpCode: 404,
        code: `Item: ${featureId} not found`,
        description: "Id needs to exist",
      },
      undefined
    );

  collection.features.splice(oldId, 1);

  return callback(undefined, {});
}

function update(collectionId, featureId, body, callback) {
  if (body.type.toLowerCase() != "feature")
    return callback(
      {
        httpCode: 400,
        code: `Type not "feature"`,
        description: 'Type must be "feature"',
      },
      undefined
    );

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
  var feature = collection.features[index];

  // (OAPIF P4) Requirement 21: If the representation of the updated resource submitted in the request body contained a resource identifier, the server SHALL ignore this identifier.
  delete body.id;

  // check if geometry type is the same
  if (body.geometry) {
    if (body.geometry.type != feature.geometry.type)
      return callback(
        {
          httpCode: 400,
          code: `Geometry type mismatch`,
          description: "Item update must have the same geometry type",
        },
        undefined
      );

    feature.geometry = body.geometry;
  }

  if (body.properties) {
    // Replace Property, if they exist in the schema
    for (let propertyName in body.properties) {
      if (body.properties.hasOwnProperty(propertyName)) {
        var value = body.properties[propertyName];
        var propertyType = typeof value;

        var schemaProperty = collection.schema[propertyName];
        if (schemaProperty == undefined)
          return callback(
            {
              httpCode: 400,
              code: `Property not found`,
              description: `${propertyName} in body not found in schema`,
            },
            undefined
          );

        feature.properties[propertyName] = value;
      }
    }
  }

  return callback(undefined, feature);
}

export default {
  get,
  create,
  replacee,
  deletee,
  update,
};
