import accepts from 'accepts'
import item from '../models/item.js'
import utils from '../utils/utils.js'

export function get (req, res) {

  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400, 
  //         if the request URI includes a query parameter that is not specified in the API definition
  var queryParams = ['f']
  var rejected = utils.checkForAllowedQueryParams(req.query, queryParams)
  if (rejected.length > 0) 
  {
      res.status(400).json({'code': `The following query parameters are rejected: ${rejected}`, 'description': 'Valid parameters for this request are ' + queryParams })
      return 
  }

  var collectionId = req.params.collectionId
  var featureId = req.params.featureId

  var formatFreeUrl = utils.getFormatFreeUrl(req)

  var accept = accepts(req)
  var format = accept.type(['json', 'html'])

  item.get(formatFreeUrl, format, collectionId, featureId, function(err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    switch (format) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`item`, content )
        break
      default:
        res.status(400).json({'code': 'InvalidParameterValue', 'description': `${accept} is an invalid format`})
    }
  })
}

export function replacee (req, res) {
  
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

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

export function deletee (req, res) {
  
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

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

export function update (req, res) {
  
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

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

export function options (req, res) {
  
  res.status(200).end()
}
