const debug = require('debug')('models')
var mongo = require('../database');
var utils = require('../utils/utils')
  
function getMetaData (serviceUrl, document) {
  
  var content = {}
  content.type = 'FeatureCollection'
  content.links = []
  content.links.push({ href: `${serviceUrl}/collections/${document.name}/items?f=html`, rel: `alternate`, type: `html/text`,            title: `This document in HTML` } )
  content.links.push({ href: `${serviceUrl}/collections/${document.name}/items?f=json`, rel: `self`,      type: `application/geo+json`, title: `This document` } )
  content.numberReturned = document.features.length // Requirement 30 A and B
  content.timeStamp = utils.ISODateString(new Date()) // Requirement 29 A
  content.features = document.features

  // TODO Next
  // var next = `&offset=${startIndex + limit}` // <<<
  // content.links.push({ href: `${serviceUrl}/collections/${document.name}/items?f=html` + next, rel: `next`, type: `application/geo+json`, title: `This document in HTML` } )
  // content.links.push({ href: `${serviceUrl}/collections/${document.name}/items?f=json` + next, rel: `next`, type: `application/geo+json`, title: `This document` } )

  // content.numberMatched  = document.features.length // Requirement 30 A and B

  return content
}

async function get (serviceUrl, collectionId, query, options, callback) {
      
  debug(`items ${serviceUrl}`)

  var root = serviceUrl.pathname.replace(/^\/+/, '') // remove any trailing /

  var query = { type: 'FeatureCollection', name: `${collectionId}` }

  var document = await mongo.db().collection(`${root}`)
                                 .findOne(query, options)
              
  var content = getMetaData(serviceUrl, document)

  debug(`items content ${content}`)

  return content
}

module.exports = {
  get,
}