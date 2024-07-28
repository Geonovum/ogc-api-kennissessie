export var apiVersion = function (req, res, next) {

    res.set('API-Version', process.env.APIVERSION)

    next()
}

export default apiVersion