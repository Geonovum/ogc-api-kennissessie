import accepts from 'accepts'
import collections from '../models/collections.js'
import utils from '../utils/utils.js'

function get(req, res) {

  var serviceUrl = utils.getServiceUrl(req)

  collections.get(serviceUrl, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    var accept = accepts(req)

    // (OAPIC P2) Requirement 3A: A successful execution of the operation SHALL be reported as a response with a HTTP status code 200.
    switch (accept.type(['json', 'html'])) {
      case `json`:
        // Recommendations 10, Links included in payload of responses SHOULD also be 
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        res.set('link', utils.makeHeaderLinks(content.links))
        res.status(200).json(content)
        break
      case `html`:
        // Recommendations 10, Links included in payload of responses SHOULD also be 
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        res.set('link', utils.makeHeaderLinks(content.links))
        res.status(200).render(`collections`, content )
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })
}

export default {
  get,
}