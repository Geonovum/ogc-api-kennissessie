const accepts = require('accepts')
const debug = require('debug')('controller')
var items = require('../models/items.js')
var utils = require('../utils/utils')

function get(req, res) {

  debug(`items ${req.url}`)

  var collectionId = req.params.collectionId
  var serviceUrl = utils.getServiceUrl(req)

  debug(`items serviceUrl ${serviceUrl} collectionId ${collectionId}`)

  var options = {}
  // (OAPIF) Requirement 21A The operation SHALL support a parameter limit
  options.limit = Number(req.query.limit) || 1000
  options.offset = Number(req.query.offset) || 0

  // remve not to be confused with other query parameters
  delete req.query.offset;
  delete req.query.limit;

  var query = req.query

  items.get(serviceUrl, collectionId, query, options, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    debug(`items content %j`, content)

    var accept = accepts(req)
    
    switch (accept.type(['json', 'html'])) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        content.geojson = JSON.stringify(content.features); // hack
        res.status(200).render(`items`, { content: content })
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })

}

module.exports = {
  get,
}