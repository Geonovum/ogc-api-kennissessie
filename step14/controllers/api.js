const debug = require('debug')('controller')
const accepts = require('accepts')
var path = require('path');

function get(req, res) {

  debug(`api ${req.url}`)

  var accept = accepts(req)

      // Recommendations 1
    // A 200-response SHOULD include the following links in the links property of the response:

  switch (accept.type(['json', 'yaml', 'html'])) {
    case 'json':
    case 'yaml':
      res.set('Content-Type', 'application/vnd.oai.openapi+json;version=3.0')
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