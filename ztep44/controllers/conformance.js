const debug = require('debug')('controller')
var conformance = require('../models/conformance.js')

// To support "generic" clients that want to access multiple OGC API Features implementations
//  - and not "just" a specific API / server, the server has to declare the conformance classes 
// it implements and conforms to.

// The content of that response SHALL be based upon the OpenAPI 3.0 schema confClasses.yaml 
// and list all OGC API conformance classes that the server conforms to.

function get (req, res) { 

  debug(`conformance ${req.url}`)

  conformance.get(function(err, content) {
    debug(`conformance content %j`, content)

    res.status(200).json(content) // Requirement 6 A
  })
}

module.exports = {
  get, 
}