const database = require('../database/database')
const collection = require('./collection.js')
const utils = require('../utils/utils')
const config = require('../config/config')

async function get(serviceUrl, callback) {

  var root = serviceUrl.pathname.replace(/^\/+/, '') // remove any trailing /

  var query = { type: 'FeatureCollection' }
  var projection = { name: 1, crs: 1, _id: 1 }

  // (OAPIC P2) Requirement 3A: The content of that response SHALL be based upon the JSON schema collections.yaml.
  var content = {};
  // An optional title and description for the collection;
  content.title = config.title
  content.description = config.description
  content.links = []
  // (OAPIC P2) Requirement 2B. The API SHALL support the HTTP GET operation on all links to a Collections Resource that have the relation type
  content.links.push({ href: `${serviceUrl}/collections?f=json`, rel: `self`, type: `application/json`, title: `This document` })
  content.links.push({ href: `${serviceUrl}/collections?f=html`, rel: `alternate`, type: `text/html`, title: `This document as HTML` })

  content.collections = [];

  var collections = await database.getCollection()

  for (var name in collections) {
    var item = await collection.getMetaData(serviceUrl, name, collections[name])
  
    content.collections.push(item);
  };

  return callback(undefined, content);
}

module.exports = {
  get,
}