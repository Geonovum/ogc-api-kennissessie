const debug = require('debug')('models')
const database = require('../database')

function get(serviceUrl, collectionId, itemId, callback) {

  debug(`get model item`)

  var headers = []

  var collections = database.getCollection()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

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

module.exports = {
  get
}