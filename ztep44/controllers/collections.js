const debug = require('debug')('controller')
const accepts = require('accepts')
var collections = require('../models/collections.js')
var utils = require('../utils/utils')

function get (req, res) {

  debug(`collections ${req.url}`)

  var serviceUrl = utils.getServiceUrl(req)
  debug(`collections serviceUrl ${serviceUrl}`)

  collections.get(serviceUrl, function(err, content) {

    debug(`collections content %j`, content)

    var accept = accepts(req)

    switch (accept.type(['json', 'html'])) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`collections`, { content: content })
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })
}

module.exports = {
  get, 
}