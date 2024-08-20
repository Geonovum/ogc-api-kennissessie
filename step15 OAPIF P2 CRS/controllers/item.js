const accepts = require('accepts')
const debug = require('debug')('controller')
const item = require('../models/item.js')
const utils = require('../utils/utils')

function get (req, res) {

  debug(`get item ${req.url}`)

  var collectionId = req.params.collectionId
  var itemId = req.params.itemId
  var serviceUrl = utils.getServiceUrl(req)

  item.get(serviceUrl, collectionId, itemId, function(err, content, headers) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    headers.forEach(header => 
      res.set(header.name, header.value))

    var accept = accepts(req)

    switch (accept.type(['json', 'html'])) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        var featureCollection = []
        featureCollection.push(content)
        content.geojson = JSON.stringify(featureCollection); // hack (see also in items)
        res.status(200).render(`item`, { content: content })
        delete content.geojson
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })
}

module.exports = {
  get
}