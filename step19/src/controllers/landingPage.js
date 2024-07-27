// define the home page route
const accepts = require('accepts')
const landingPage = require('../models/landingPage.js');
const utils = require('../utils/utils')

async function get(req, res) {

    var serviceUrl = utils.getServiceUrl(req)

    await landingPage.get(serviceUrl, req.query, function (err, content) {

        if (err) {
            res.status(err.httpCode).json({'code': err.code, 'description': err.description})
            return
          }
      
        // http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#encodings
        var accept = accepts(req)

        switch (accept.type(['json', 'html'])) {
            case `json`:
                // Recommendations 1, A 200-response SHOULD include the following links in the links property of the response:
                res.set('link', utils.makeHeaderLinks(content.links))
                res.status(200).json(content)
                break
            case `html`:
                // Recommendations 1, A 200-response SHOULD include the following links in the links property of the response:
                res.set('link', utils.makeHeaderLinks(content.links))
                res.status(200).render(`landingPage`, content )
                break
            default:
                res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
        }
    })
}

module.exports = {
    get,
}