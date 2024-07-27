const accepts = require('accepts')
const item = require('../models/item.js')
const utils = require('../utils/utils')

function get (req, res) {

  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  item.get(serviceUrl, collectionId, featureId, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    var accept = accepts(req)

    switch (accept.type(['json', 'html'])) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`item`, content )
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })
}

function replacee (req, res) {
  
  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  item.replacee(serviceUrl, collectionId, featureId, req.body, function(err, content, newId) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    res.set('location', `${serviceUrl}/collections/${collectionId}/items/${newId}`)
    res.status(204).end()
  })
}

function deletee (req, res) {
  
  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  item.deletee(serviceUrl, collectionId, featureId, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    res.status(204).end()
  })
}

function update (req, res) {
  
  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  item.update(serviceUrl, collectionId, featureId, req.body, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    res.status(200).json(content)
  })
}

function options (req, res) {
  
  res.status(200).end()
}

module.exports = {
  get, replacee, deletee, update, options
}
