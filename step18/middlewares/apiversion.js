const config = require('../config/server') 

var version = function (req, res, next) {

    res.set('API-Version', config.version)

    next()
}

module.exports = version