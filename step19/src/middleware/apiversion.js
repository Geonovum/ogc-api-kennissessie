const config = require('../config/config') 

var version = function (req, res, next) {

    res.set('API-Version', config.version)

    next()
}

module.exports = version