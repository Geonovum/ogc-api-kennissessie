import urlJoin from 'url-join'
import { getDatabases } from '../database/database.js'
import utils from '../utils/utils.js'
import projgeojson from '../utils/proj4.js'

function getLinks(neutralUrl, format, links) {

  if (format == 'geojson') format = 'json'

  function getTypeFromFormat(format) {
    var _formats = ['json', 'geojson',  'html', 'csv']
    var _encodings = ['application/geo+json', 'application/geo+json', 'text/html', 'text/csv']
  
    var i = _formats.indexOf(format);
    return _encodings[i]
  }

  links.push({ href: urlJoin(neutralUrl, `?f=${format}`), rel: `self`, type: getTypeFromFormat(format), title: `Access the features in the collection as ${format}` })
  utils.getAlternateFormats(format, ['json', 'html', 'csv']).forEach(altFormat => {
    links.push({ href: urlJoin(neutralUrl, `?f=${altFormat}`), rel: `alternate`, type: getTypeFromFormat(altFormat), title: `Access the features in the collection as ${altFormat}` })
  })
}

function getParentLink(neutralUrl, format, links) {

  if (format == 'geojson') format = 'json'

  function getTypeFromFormat(format) {
    var _formats = ['json', 'html']
    var _encodings = ['application/json', 'text/html']
  
    var i = _formats.indexOf(format);
    return _encodings[i]
  }

  // remove :featureId
  neutralUrl = neutralUrl.substr(0, neutralUrl.lastIndexOf("/"));
  // remove 'items'
  neutralUrl = neutralUrl.substr(0, neutralUrl.lastIndexOf("/"));

  links.push({ href: urlJoin(neutralUrl, `?f=${format}`), rel: `collection`, type: getTypeFromFormat(format), type: 'application/json', title: `The collection the feature belongs to as ${format}` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    links.push({ href: urlJoin(neutralUrl, `?f=${altFormat}`), rel: `alternate`, type: getTypeFromFormat(altFormat), title: `The collection the feature belongs to as ${altFormat}` })
  })
}

function getContent(neutralUrl, format, collection) {
}

function get(neutralUrl, format, collectionId, featureId, query, callback) {

  var collections = getDatabases()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  // Find feature, based on index
  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].id == featureId) break;
  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${featureId} not found`, 'description': 'Id needs to exist' }, undefined);

  var queryParams = ['f', 'crs']
  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400, 
  //         if the request URI includes a query parameter that is not specified in the API definition
  var rejected = utils.checkForAllowedQueryParams(query, queryParams)
  if (rejected.length > 0)
    return callback({ 'httpCode': 400, 'code': `The following query parameters are rejected: ${rejected}`, 'description': 'Valid parameters for this request are ' + queryParams }, undefined);

  var feature = collection.features[index]

  // default crs from collection
  feature.headerContentCrs = collection.crs.properties.name

  var doSkipGeometry = false
  var doProperties = []

  var _query = query
  if (_query) {
    if (_query.crs) {
      var toEpsg = utils.UriToEPSG(query.crs)
      feature = projgeojson.projectFeature(feature, 'EPSG:4326', toEpsg);
      if (feature == undefined)
        return callback({ 'httpCode': 400, 'code': `Bad Request`, 'description': `Invalid operator: ${query.crs}` }, undefined);

      feature.headerContentCrs = query.crs
      delete _query.crs
    }

    if (_query.skipGeometry)
      doSkipGeometry = true
    delete _query.skipGeometry

    if (_query.properties)
      doProperties = _query.properties.split(',')
    delete _query.properties
  }

  if (doSkipGeometry)
    features.forEach(function (feature) { delete feature.geometry });

  if (doProperties.length > 0) {
      for (var propertyName in feature.properties)
        if (!doProperties.includes(propertyName))
          delete feature.properties[propertyName]
  }

  feature.links = []

  getLinks(neutralUrl, format, feature.links)
  getParentLink(neutralUrl, format, feature.links)

  return callback(undefined, feature);
}

function create(serviceUrl, collectionId, body, callback) {

  if (body.type.toLowerCase() != 'feature')
    return callback({ 'httpCode': 400, 'code': `Type not "feature"`, 'description': 'Type must be "feature"' });

  var collections = getDatabases()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var id = collection.id;

  // (OAPIF P4) Requirement 4 If the operation completes successfully, the server SHALL assign a new, unique identifier 
  //      within the collection for the newly added resource.

  // generate new id (than largest id and add 1)
  var index = 0
  var newId = -1
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] > newId) newId = collection.features[index].properties[id];
  newId++

  body.properties[id] = newId

  // create new resource
  collection.features.push(body)

  return callback(undefined, body, newId);
}

function replacee(serviceUrl, collectionId, featureId, body, callback) {

  if (body.type.toLowerCase() != 'feature')
    return callback({ 'httpCode': 400, 'code': `Type not "feature"`, 'description': 'Type must be "feature"' });

  var collections = getDatabases()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var id = collection.idName;// TODO

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == featureId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${featureId} not found`, 'description': 'Id needs to exist' });

  // delete the 'old' resource
  collection.features.splice(index, 1);

  // (OAPIF P4) Requirement 4 If the operation completes successfully, the server SHALL assign a new, unique identifier 
  //      within the collection for the newly added resource.

  // generate new id (than largest id and add 1)
  var index = 0
  var newId = -1
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] > newId) newId = collection.features[index].properties[id];
  newId++

  body.properties[id] = newId

  // create new resource
  collection.features.push(body)

  return callback(undefined, body, newId);
}

function deletee(serviceUrl, collectionId, featureId, callback) {

  var collections = getDatabases()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var id = collection.idName;// TODO

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == featureId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${featureId} not found`, 'description': 'Id needs to exist' }, undefined);

  collection.features.splice(index, 1);

  return callback(undefined, {});
}

function update(serviceUrl, collectionId, featureId, body, callback) {

  if (body.type.toLowerCase() != 'feature')
    return callback({ 'httpCode': 400, 'code': `Type not "feature"`, 'description': 'Type must be "feature"' }, undefined);

  var collections = database.getCollection()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var id = collection.idName; // TODO

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == featureId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${featureId} not found`, 'description': 'Id needs to exist' }, undefined);

  var feature = collection.features[index]

  // check if geometry type is the same
  if (body.geometry) {
    if (body.geometry.type != feature.geometry.type)
      return callback({ 'httpCode': 400, 'code': `Geometry type mismatch`, 'description': 'Item update must have the same geometry type' }, undefined);

    feature.geometry = body.geometry
  }

  if (body.properties) {
    // TODO replace properties
  }

  return callback(undefined, feature);
}

export default {
  get, create, replacee, deletee, update
}
