import accepts from 'accepts'
import items from '../models/items.js'
import geojson2csv from '../utils/csv.js'
import utils from '../utils/utils.js'

export function get(req, res, next) {

  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

  var collectionId = req.params.collectionId

  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400, 
  //         if the request URI includes a query parameter that is not specified in the API definition
  if (!utils.checkForAllowedQueryParams(req.query, ['f', 'bbox', 'limit', 'offset', 'filter'], res)) return // TODO: add entire schema

  // TODO: the above means that the API is constructed from the schema of the database!!!!!

  var formatFreeUrl = utils.getFormatFreeUrl(req)

  var options = {}
  options.offset = Number(req.query.offset) || 0
  options.limit = Number(req.query.limit) || 1000

  // remve not to be confused with other query parameters
  delete req.query.offset;
  delete req.query.limit;

  var accept = accepts(req)
  var format = accept.type(['json', 'html', 'csv'])

  items.get(formatFreeUrl, format, collectionId, req.query, options, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({ 'code': err.code, 'description': err.description })
      return
    }

    // Content-Crs
    if (content.headerContentCrs)
      res.set('Content-Crs', content.headerContentCrs)
    delete content.headerContentCrs

    var link = content.links.filter((link) => link.rel === 'self' && link.href.includes('bbox'))[0]
    if (typeof link !== 'undefined') {
      const url = new URL(link.href)
      console.log(url)
      const bbox = url.searchParams.get('bbox')
      console.log(bbox)
      var coords = bbox.split(',')
      var bounds = [[coords[0], coords[1]], [coords[2], coords[3]]];

    }

    switch (format) {
      case `json`:
        res.status(200).json(content)
        break
      case `html`:
        res.status(200).render(`items`, content)
        break
      case 'csv':
        res.removeHeader('Content-Crs');
        res.set('Content-Type', utils.getTypeFromFormat(format));
        res.set('Content-Disposition', `inline; filename="${collectionId}.csv"`);
        res.send(geojson2csv(content));
        break;
      default:
        res.status(400).json({'code': 'InvalidParameterValue', 'description': `${accept} is an invalid format`})
    }
  })

}

export function options(req, res) {

  res.status(200).end()
}
