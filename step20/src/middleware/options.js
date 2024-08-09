export var options = function (req, res, next) {
    if (req.method == 'OPTIONS') {

        // express does not deal well with OPTIONS

        var url = req.originalUrl.split('/')
        if (true) {
            res.set('Allow', '')
        }
        res.send(200);
    }
    else
        next()
}

export default options