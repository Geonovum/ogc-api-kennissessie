import accepts from 'accepts'
import items from '../models/items.js'
import utils from '../utils/utils.js'
import { join } from 'path'

function getNeutralUrl(req) {
  var root = req.baseUrl.replace(/\.[^.]*$/, '')

  const proxyHost = req.headers["x-forwarded-host"]
  var host = proxyHost || req.headers.host
  host = join(host, root)

  var query = ''
  for (var propName in req.query)
    query += `${propName}=${req.query[propName]}`

  return new URL(`${req.protocol}://${host}${req.path}?${query}`)
}


export function get(req, res, next) {

  var collectionId = req.params.collectionId

  var neutralUrl = getNeutralUrl(req)

  var options = {}
  options.offset = Number(req.query.offset) || 0
  options.limit = Number(req.query.limit) || 1000

  // remve not to be confused with other query parameters
  delete req.query.offset;
  delete req.query.limit;

  var accept = accepts(req)
  var format = accept.type(JSON.parse(process.env.FORMATS))

  items.get(neutralUrl, format, collectionId, req.query, options, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({'code': err.code, 'description': err.description})
      return
    }

    // Content-Crs
    if (content.headerContentCrs)
      res.set('Content-Crs', content.headerContentCrs)
    delete content.headerContentCrs

    switch (format) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`items`, content )
        break
      default:
        res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${accept} is an invalid format'}`)
    }
  })

}

export function options (req, res) {
  
  res.status(200).end()
}
