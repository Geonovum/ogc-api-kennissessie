const debug = require('debug')('models')
const database = require('../database')
var collection = require('./collection.js')
const utils = require('../utils/utils')

function get(serviceUrl, callback) {

  debug(`collections ${serviceUrl}`)

  var root = serviceUrl.pathname.replace(/^\/+/, '') // remove any trailing /

  var query = { type: 'FeatureCollection' }
  var projection = { name: 1, crs: 1, _id: 1 }

  var content = {};
  // An optional title and description for the collection;
  content.title = 'Geonovum'
  content.description = 'This is a test dataset used in the Geonovum API summerschool'
  content.links = []
  content.links.push({ href: `${serviceUrl}/collections?f=json`, rel: `self`, type: `application/json`, title: `This document` })
  content.links.push({ href: `${serviceUrl}/collections?f=html`, rel: `alternate`, type: `text/html`, title: `This document as HTML` })

  content.collections = [];

  var collections = database.getCollection()

  for (var name in collections) {
    var item = collection.getMetaData(serviceUrl, name, collections[name])
  
    content.collections.push(item);
  };

  return callback(undefined, content);
}

module.exports = {
  get,
}