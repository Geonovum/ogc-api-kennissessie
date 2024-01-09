const accepts = require('accepts')
const debug = require('debug')('controller')
var items = require('../models/items.js')
var utils = require('../utils/utils')

async function get (req, res) {
  
  debug(`items ${req.url}`)

  var collectionId = req.params.collectionId
  var serviceUrl = utils.getServiceUrl(req)

  debug(`items serviceUrl ${serviceUrl} collectionId ${collectionId}`)

  var options = {}
  options.skip  = req.query.startIndex || 0
  options.limit = req.query.limit || 10

  // remve not to be confused with other query parameters
  delete req.query.startIndex; 
  delete req.query.limit; 

  var query = {} // TODO, take from req.query

  var content = await items.get(serviceUrl, collectionId, query, options)

  debug(`items content %j`, content)

  var accept = accepts(req)

  switch (accept.type(['json', 'html'])) {
  case `json`:
    res.status(200).json(content)
    break
  case `html`:
    res.status(200).render(`items`, { content: content })
    break
  default:
    res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
  }
  
}

module.exports = {
  get, 
}