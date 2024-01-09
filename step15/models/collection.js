const debug = require('debug')('models')
var mongo = require('../database');
    
function getMetaData (serviceUrl, document) {

  var content = {}
  content.id          = document.name // required
  content.title       = document.name
  content.description = 'dbEntry.description'
  content.links = []
  // Requirement 15 A and B
  content.links.push({ href: `${serviceUrl}/collections/${content.title}/items?f=json`, rel: `items`, type: `application/geo+json`, title: `This document` } )
  content.links.push({ href: `${serviceUrl}/collections/${content.title}/items?f=html`, rel: `items`, type: `text/html`,            title: `This document in HTML` } )
  content.extent = {} 
  content.extent.spatial = {}
  // Requirement 16 A and B
  content.extent.spatial.bbox = []
  content.extent.spatial.bbox.push([-180, -90, 180, 90])
  content.extent.temporal = {}
  content.extent.temporal.interval = []
  content.extent.temporal.interval.push(['2010-02-15T12:34:56Z', null])
  content.itemType = 'feature'
  content.crs = []
  content.crs.push(document.crs.properties.name)

  return content
}

async function get (serviceUrl, collectionId, callback) {
    
  debug(`collection ${serviceUrl}`)

  var root = serviceUrl.pathname.replace(/^\/+/, '') // remove any trailing /

  var query = { type: 'FeatureCollection', name: `${collectionId}` };
  var projection = { name: 1, crs: 1, _id: 1 }
  var document = await mongo.db().collection(`${root}`).findOne(query, projection)
  
  var content = getMetaData(serviceUrl, document)

  return content
}

module.exports = {
  get, 
  getMetaData,
}