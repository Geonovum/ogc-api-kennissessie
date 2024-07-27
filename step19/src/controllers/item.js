const accepts = require('accepts')
const item = require('../models/item.js')
const utils = require('../utils/utils')

async function get (req, res) {

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

async function replacee (req, res) {
  
  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  await item.replacee(serviceUrl, collectionId, featureId, req.body, function(err, content, newId) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    res.set('location', `${serviceUrl}/collections/${collectionId}/items/${newId}`)
    res.status(204).end()
  })
}

async function deletee (req, res) {
  
  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  await item.deletee(serviceUrl, collectionId, featureId, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    res.status(204).end()
  })
}

async function update (req, res) {
  
  var collectionId = req.params.collectionId
  var featureId = req.params.featureId
  var serviceUrl = utils.getServiceUrl(req)

  await item.update(serviceUrl, collectionId, featureId, req.body, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    res.status(200).json(content)
  })
}

async function options (req, res) {
  
  res.status(200).end()
}

module.exports = {
  get, replacee, deletee, update, options
}
