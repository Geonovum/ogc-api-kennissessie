import accepts from 'accepts'
import items from '../models/items.js'
import geojson2csv from '../utils/csv.js'
import utils from '../utils/utils.js'

export function get(req, res, next) {

  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

  var collectionId = req.params.collectionId

  if (!utils.checkNumeric(req.query.offset, 'offset', res)) return
  if (!utils.checkNumeric(req.query.limit, 'limit', res)) return

  var options = {}
  options.offset = Number(req.query.offset) || 0
  options.limit = Number(req.query.limit) || 1000

  // remve not to be confused with other query parameters
  delete req.query.offset;
  delete req.query.limit;

  var accept = accepts(req)
  var format = accept.type(['json', 'geojson', 'html', 'csv'])

  var formatFreeUrl = utils.getFormatFreeUrl(req)

  items.get(formatFreeUrl, format, collectionId, req.query, options, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({ 'code': err.code, 'description': err.description })
      return
    }

    // (OAPIF P2) Requirement 16: Content-Crs
    if (content.headerContentCrs)
      res.set('Content-Crs', `<${content.headerContentCrs}>`)
    delete content.headerContentCrs

    switch (format) {
      case 'json':
      case 'geojson':
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
        res.status(400).json({ 'code': 'InvalidParameterValue', 'description': `${accept} is an invalid format` })
    }
  })

}

export function options(req, res) {

  res.status(200).end()
}
