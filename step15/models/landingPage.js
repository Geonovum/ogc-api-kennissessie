const debug = require('debug')('models')
var mongo = require('../database');
    
async function get  (serviceUrl) {

  debug(`landingPage ${serviceUrl}`)

  var root = serviceUrl.pathname.replace(/^\/+/, '') // remove any trailing /

  // Requirement 2 A & B
  // The content of that response SHALL be based upon the OpenAPI 3.0 schema landingPage.yaml (http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/landingPage.yaml)
  // and include at least links to the following resources:
  //
  // - the API definition (relation type `service-desc` or `service-doc`)
  // - /conformance (relation type `conformance`)
  // - /collections (relation type `data`)
  var content = {}
  content.title =' result.title' // Requirement 2 B
  content.description = 'result.description'              
  content.links = []
  content.links.push({ href: `${serviceUrl}/api?f=json`,         rel: `service-desc`, type: `application/vnd.oai.openapi+json;version=3.0`, title: `the API definition` } )
  content.links.push({ href: `${serviceUrl}/api.html`,           rel: `service-doc`,  type: `text/html`,                                    title: `the API documentation` } )
  content.links.push({ href: `${serviceUrl}/conformance`,        rel: `conformance`,  type: `application/json`,                             title: `OGC API conformance classes implemented by this server` } )
  content.links.push({ href: `${serviceUrl}/collections?f=json`, rel: `data`,         type: `application/json`,                             title: `Information about the feature collections` } )
  content.links.push({ href: `${serviceUrl}/collections?f=html`, rel: `data`,         type: `text/html`,                                    title: `Information about the feature collections` } )
  content.links.push({ href: `${serviceUrl}/?f=html`,            rel: `alternate`,    type: `text/html`,                                    title: `this document` } )
  content.links.push({ href: `${serviceUrl}/?f=json`,            rel: `self`,         type: `application/json`,                             title: `this document in json` } )

  debug(`landingPage content ${content}`)

  return content
}

module.exports = {
  get
}