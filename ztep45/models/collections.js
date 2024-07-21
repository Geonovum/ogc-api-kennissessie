const debug = require('debug')('models')
var mongo = require('../database');
var collection = require('./collection.js')
    
function getMetaData (serviceUrl, documents) {
  // Recommendation 5 A: ... implementations SHOULD consider to support an HTML encoding.
  // Recommendation 6 A: ... implementations SHOULD consider to support GeoJSON as an encoding for features and feature collections

  // Requirement 12 B: The content of that response SHALL be based upon 
  // the OpenAPI 3.0 schema collections.yaml.
  // http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/collections.yaml
  var content = {}
  content.links = [] // Recommendation 8 A Links included in payload of responses SHOULD also be included as Link headers in the HTTP response according to RFC 8288, Clause 3.
  content.links.push({ href: `${serviceUrl}/api`,                rel: `service-desc`, type: `application/vnd.oai.openapi+json;version=3.0`, title: `the API definition` } ) // Permission 1 A
  content.links.push({ href: `${serviceUrl}/api.html`,           rel: `service-doc`,  type: `text/html`,                                    title: `the API definition in html` } )
  content.links.push({ href: `${serviceUrl}/conformance`,        rel: `conformance`,  type: `application/json`,                             title: `Conformance` } )
  content.links.push({ href: `${serviceUrl}/collections?f=json`, rel: `self`,         type: `application/json`,                             title: `this document in json` } ) // Requirement 13 A & B
  content.links.push({ href: `${serviceUrl}/collections?f=html`, rel: `alternate`,    type: `text/html`,                                    title: `this document as HTML` } ) // Requirement 13 A & B
  content.collections = [] // Requirement 14 A: For each feature collection provided by the server, an item SHALL be provided in the property collections.
  documents.forEach(document => {
    content.collections.push(collection.getMetaData(serviceUrl, document)) // Requirement 15 A  B
  })

  return content
}

async function get (serviceUrl, callback) { 

  debug(`collections ${serviceUrl}`)

  var root = serviceUrl.pathname.replace(/^\/+/, '') // remove any trailing /

  var query = { type: 'FeatureCollection' }
  var projection = { name: 1, crs: 1, _id: 1 }
  var documents = await mongo.db().collection(`${root}`)
                                  .find(query, projection)
                                  .toArray()

  var content = getMetaData(serviceUrl, documents)
  
  return content
}

module.exports = {
  get,
}