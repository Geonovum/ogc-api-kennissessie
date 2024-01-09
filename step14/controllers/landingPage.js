const debug = require('debug')('controller')
const accepts = require('accepts')
var landingPage = require('../models/landingPage.js');
var utils = require('../utils/utils')

function get (req, res) {

  debug(`landingPage ${req.url}`)

  var serviceUrl = utils.getServiceUrl(req)
  
  debug(`landingPage serviceUrl ${serviceUrl}`)

  landingPage.get(serviceUrl, function(err, content) {

    debug(`landingPage content %j`, content)

    // http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#encodings
    var accept = accepts(req)

    switch (accept.type(['json', 'html'])) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`landingPage`, { content: content })
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  }) 
}

module.exports = {
  get, 
}