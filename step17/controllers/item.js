const accepts = require('accepts')
const debug = require('debug')('controller')

function get (req, res) {

  debug(`item ${req.url}`)

  var accept = req.headers['accept']
  
  //  console.log(dataDict);
    /*
    var urlParts = url.parse(req.url, true);
    if (null == urlParts.query.f) 
      res.send(make.collections("html", dataDict));
    else if ("json" == urlParts.query.f) 
      res.json(make.collections("json", dataDict));
    else if ("html" == urlParts.query.f)
      res.send(make.collections("html", dataDict));
    else
*/      res.json(400, "{'code': 'InvalidParameterValue', 'description': 'Invalid format'}")
}

module.exports = {
  get, 
}