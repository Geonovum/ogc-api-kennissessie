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

  // make local copy to do subtraction (limit, offset, bbox,...) on
  var features = content.features

  if (options)
    features = content.features.slice(options.offset, options.offset + options.limit)

  if (query) {
    if (query.bbox) {
      features.forEach(feature => {
        // check within bbox
      });
    }
  }

  // bring back subtracted list as 'main'
  content.features = features
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