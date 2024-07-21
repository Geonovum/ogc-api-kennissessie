const debug = require('debug')('models')
const database = require('../database')

function get(serviceUrl, collectionId, itemId, callback) {

  debug(`get model item`)

  var headers = []

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var id = collection.id;

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == itemId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${itemId} not found`, 'description': 'Id needs to exist' }, undefined);

  var content = collection.features[index]

  // (OAPIF-P4) Requirement 20 The response to a HTTP GET operation used to retrieve a representation of a resource SHALL 
  //     include a Last-Modified header representing the date and time the representation was last modified as determined
  //     at the conclusion of handling the request.
  headers.push({ 'name': 'Last-Modified', 'value': new Date().toISOString() })

  return callback(undefined, content, headers);
}

function create(serviceUrl, collectionId, itemId, body, callback) {

  if (body.type.toLowerCase() != 'feature')
    return callback({ 'httpCode': 400, 'code': `Type not "feature"`, 'description': 'Type must be "feature"' });

  var collections = database.getCollection()
  var collection = collections[collectionId]

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

function replacee(serviceUrl, collectionId, itemId, body, callback) {

  if (body.type.toLowerCase() != 'feature')
    return callback({ 'httpCode': 400, 'code': `Type not "feature"`, 'description': 'Type must be "feature"' });

  var headers = []

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var id = collection.id;

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == itemId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${itemId} not found`, 'description': 'Id needs to exist' });

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

  collection.lastModified = new Date()

  // (OAPIF-P4) Requirement 21 A resource successfully replaced by a HTTP PUT operation SHALL include 
  //    a Last-Modified header whose value is a date and time representing when the representation was last 
  //    modified as determined at the conclusion of handing the request.
  headers.push({ 'name': 'Last-Modified', 'value': collection.lastModified.toISOString() })

  return callback(undefined, body, newId, headers);
}

function deletee(serviceUrl, collectionId, itemId, callback) {

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var id = collection.id;

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == itemId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${itemId} not found`, 'description': 'Id needs to exist' }, undefined);

  collection.features.splice(index, 1);

  return callback(undefined, {});
}

function update(serviceUrl, collectionId, itemId, body, callback) {

  if (body.type.toLowerCase() != 'feature')
    return callback({ 'httpCode': 400, 'code': `Type not "feature"`, 'description': 'Type must be "feature"' }, undefined);

  var headers = []

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var id = collection.id;

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == itemId) break;

  if (index >= collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${itemId} not found`, 'description': 'Id needs to exist' }, undefined);

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

  collection.lastModified = new Date()

  // (OAPIF-P4) Requirement 22 A resource successfully updated by a HTTP PATCH operation SHALL include 
  //     a Last-Modified header whose value is a date and time representing when the representation was 
  //     last modified as determined at the conclusion of handing the request.
  headers.push({ 'name': 'Last-Modified', 'value': collection.lastModified.toISOString() })

  return callback(undefined, feature, headers);
}

module.exports = {
  get, create, replacee, deletee, update
}