var version = function (req, res, next) {

    res.set('API-Version', '1.0.0')

    next()
}

module.exports = version