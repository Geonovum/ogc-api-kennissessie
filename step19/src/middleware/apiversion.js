var version = function (req, res, next) {

    res.set('API-Version', _version)

    next()
}

export default version