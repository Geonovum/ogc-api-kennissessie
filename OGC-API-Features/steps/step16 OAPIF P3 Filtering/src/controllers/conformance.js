import accepts from 'accepts'
import utils from '../utils/utils.js'
import { get as _get } from '../models/conformance.js'

// To support "generic" clients that want to access multiple OGC API Features implementations
//  - and not "just" a specific API / server, the server has to declare the conformance classes 
// it implements and conforms to.

// The content of that response SHALL be based upon the OpenAPI 3.0 schema confClasses.yaml 
// and list all OGC API conformance classes that the server conforms to.

export function get(req, res) {

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

  // get the url without the f= query parameter
  var formatFreeUrl = utils.getFormatFreeUrl(req)

  var accept = accepts(req)
  var format = accept.type(['json', 'html'])

  _get(formatFreeUrl, format, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({ 'code': err.code, 'description': err.description })
      return
    }

    switch (format) {
      case 'json':
        // Recommendations 10, Links included in payload of responses SHOULD also be 
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        res.set('link', utils.makeHeaderLinks(content.links))
        res.status(200).json(content)
        break
      case `html`:
        // Recommendations 10, Links included in payload of responses SHOULD also be 
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        res.set('link', utils.makeHeaderLinks(content.links))
        res.status(200).render(`conformance`, content )
        break
      default:
        res.status(400).json({'code': 'InvalidParameterValue', 'description': `${accept} is an invalid format`})
    }
  })
}
