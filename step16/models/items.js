const debug = require('debug')('models')
const database = require('../database')
const utils = require('../utils/utils')
const projgeojson = require('../utils/proj4')

function getContent(serviceUrl, name, document) {
  var item = {}
  item.type = document.type
  item.features = document.features
  item.timestamp = new Date().toISOString()
  item.links = []

  if (document.crs.properties.name)
    item.headerContentCrs = document.crs.properties.name

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

  var _query = query
  if (_query) {
    if (_query.bbox) {
      features.forEach(feature => {
        // check within bbox
      });
      delete _query.bbox
    }

    if (_query.crs) {
      console.log('do crs conversion using proj4')
      var toEpsg = utils.UriToEPSG(query.crs)
      features = projgeojson(features, 'EPSG:4326', toEpsg);

      content.headerContentCrs = query.crs
      _query.crs
    }

    // Filter
    for (var attributeName in _query) {
      // is attribute part of the queryables?
      const hasAttribute = attributeName in collection.queryables;
      if (hasAttribute) {
        var targetValue = _query[attributeName]
        features = features.filter(
          element =>
            element.properties[attributeName] == targetValue)
        console.log(features)
      }
      else
         return callback({'httpCode': 400, 'code': `The following query parameters are rejected: ${attributeName}`, 'description': 'Valid parameters for this request are ' + collection.queryables}, undefined);

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