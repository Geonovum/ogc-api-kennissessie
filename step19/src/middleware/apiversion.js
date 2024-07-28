export var apiVersion = function (req, res, next) {

    res.set('API-Version', global.APIVERSION)

    next()
}

export default apiVersion