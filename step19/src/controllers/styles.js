import { getServiceUrl } from '../utils/utils.js'
import styles from '../models/styles.js'
import accepts from 'accepts'

function get(req, res) {
  var collectionId = req.params.collectionId
  var serviceUrl = getServiceUrl(req)

  var accept = accepts(req)

  switch (accept.type(['json', 'html'])) {
    case `json`:
      // Recommendations 10, Links included in payload of responses SHOULD also be 
      // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
      // This recommendation does not apply, if there are a large number of links included 
      // in a response or a link is not known when the HTTP headers of the response are created.
      // res.set('link', utils.makeHeaderLinks(content.links))
      res.status(200).json(content)
      break
    case `html`:
      // Recommendations 10, Links included in payload of responses SHOULD also be 
      // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
      // This recommendation does not apply, if there are a large number of links included 
      // in a response or a link is not known when the HTTP headers of the response are created.
      res.status(200).render(`styles`, content )
      break
    default:
      res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
  }

}

export default {
  get
}
