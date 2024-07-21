const debug = require('debug')('models')
const database = require('../database')

function get(serviceUrl, collectionId, itemId, callback) {

  debug(`get model item`)

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var id = collection.id;
  // find the id in the features.properties.{id}

  var index = 0
  for (; index < collection.features.length; index++)
    if (collection.features[index].properties[id] == itemId) break;

  if (index >=  collection.features.length)
    return callback({ 'httpCode': 404, 'code': `Item: ${itemId} not found`, 'description': 'Id needs to exist' }, undefined);

  var content = collection.features[index]

  return callback(undefined, content);
}
  
  module.exports = {
    get,
  }