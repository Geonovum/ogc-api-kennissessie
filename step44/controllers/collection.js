const debug = require('debug')('controller')
const accepts = require('accepts')
var collection = require('../models/collection.js')
var utils = require('../utils/utils')

function get (req, res) {
   
  debug(`collection ${req.url}`)

  var collectionId = req.params.collectionId
  var serviceUrl = utils.getServiceUrl(req)

  debug(`collections serviceUrl ${serviceUrl} collectionId ${collectionId}`)

  collection.get(serviceUrl, collectionId, function(err, content) {

    debug(`collection content %j`, content)

    var accept = accepts(req)

    switch (accept.type(['json', 'html'])) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`collection`, { content: content })
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })
  
}

module.exports = {
  get, 
}