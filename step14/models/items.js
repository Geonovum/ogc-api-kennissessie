const debug = require('debug')('models')
const database = require('../database')

function getContent(name, collection) {
  var item = {}
  item.type = collection.type
  item.features = collection.features

  return item
}

function get(serviceUrl, collectionId, query, options, callback) {

  debug(`items`)

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var content = getContent(collectionId, collection)

  return callback(undefined, content);
}

module.exports = {
  get, getContent
}