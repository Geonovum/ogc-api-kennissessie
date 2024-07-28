import utils from '../utils/utils.js'
import { get as _get } from '../models/conformance.js'

// To support "generic" clients that want to access multiple OGC API Features implementations
//  - and not "just" a specific API / server, the server has to declare the conformance classes 
// it implements and conforms to.

// The content of that response SHALL be based upon the OpenAPI 3.0 schema confClasses.yaml 
// and list all OGC API conformance classes that the server conforms to.

export function get(req, res) {

  var serviceUrl = utils.getServiceUrl(req)

  _get(serviceUrl, function (err, content) {
    // Recommendations 1, A 200-response SHOULD include the following links in the links property of the response:
    res.set('link', utils.makeHeaderLinks(content.links))
    res.status(200).json(content) // Requirement 6 A
  })
}
