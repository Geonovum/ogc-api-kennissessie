const debug = require('debug')('controller')
const accepts = require('accepts')
const collection = require('../models/collection.js')
const utils = require('../utils/utils')

function get (req, res) {
   
  debug(`collection ${req.url}`)

  var collectionId = req.params.collectionId
  var serviceUrl = utils.getServiceUrl(req)

  debug(`collections serviceUrl ${serviceUrl} collectionId ${collectionId}`)

  collection.get(serviceUrl, collectionId, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    debug(`collection content %j`, content)

    var accept = accepts(req)

    switch (accept.type(['json', 'html'])) {
      case `json`:
        // Recommendations 10, Links included in payload of responses SHOULD also be 
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        // This recommendation does not apply, if there are a large number of links included 
        // in a response or a link is not known when the HTTP headers of the response are created.
        // res.set('link', utils.makeHeaderLinks(content.links))
        res.status(200).json(content)
        break
      case `html`:
        // Recommendations 10, Links included in payload of responses SHOULD also be 
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        // This recommendation does not apply, if there are a large number of links included 
        // in a response or a link is not known when the HTTP headers of the response are created.
        // res.set('link', utils.makeHeaderLinks(content.links))
        res.status(200).render(`collection`, { content: content })
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })
  
}

function getQueryables (req, res) {

  var collectionId = req.params.collectionId
  var serviceUrl = utils.getServiceUrl(req)

  debug(`collections getQueryables serviceUrl ${serviceUrl} collectionId ${collectionId}`)

  collection.getQueryables(serviceUrl, collectionId, function(err, content) {
    res.status(200).json(content)
  })
}

module.exports = {
  get, getQueryables
}