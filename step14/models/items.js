const debug = require('debug')('models')
const database = require('../database')

function getContent(serviceUrl, name, collection) {
  var item = {}
  item.type = collection.type
  item.features = collection.features
  item.timestamp = new Date().toISOString()
  item.links = []

  return item
}

function get(serviceUrl, collectionId, query, options, callback) {

  debug(`items`)

  var collections = database.getCollection()
  var collection = collections[collectionId]

  var content = getContent(serviceUrl, collectionId, collection)

  if (options)
    content.features = content.features.slice(options.offset, options.offset + options.limit)

  var featureCount = content.features.length

  content.numberReturned = featureCount
  content.numberMatched = featureCount

  content.links.push({ href: `${serviceUrl}/collections/${content.title}/items?f=json`, rel: `self`, type: `application/geo+json`, title: `This document` })
  content.links.push({ href: `${serviceUrl}/collections/${content.title}/items?f=html`, rel: `alternate`, type: `text/html`, title: `This document as HTML` })
  if (content.numberReturned != content.numberMatched)
    content.links.push({ href: `${serviceUrl}/collections/${content.title}/items?f=json`, rel: `next`, type: `application/geo+json`, title: `Next page` })



  return callback(undefined, content);
}

module.exports = {
  get, getContent
}