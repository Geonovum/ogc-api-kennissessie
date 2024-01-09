const debug = require('debug')('controller')
const accepts = require('accepts')
var path = require('path');

async function get (req, res) {

  debug(`api ${req.url}`)

  var accept = accepts(req)

  switch (accept.type(['json', 'html'])) {
  case 'json':
    res.sendFile(path.join(__dirname, '..', 'api', 'openapi.yaml'))
    break
  case 'html':
    res.statusCode = 302; // redirect
    res.setHeader("Location", "https://app.swaggerhub.com/apis/BartDeLathouwer/ogcapi-Kontich/1.0.0");
    res.end();    
    break
  case false:
  default:
    res.status(400).json("{'code': 'InvalidParameterValue', 'description': 'Invalid format'}")
  }
}

module.exports = {
  get, 
}