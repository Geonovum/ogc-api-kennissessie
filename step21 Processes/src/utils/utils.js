import { join } from 'path'

var _formats = ['json', 'html', 'csv']
var _encodings = ['application/json', 'text/html', 'text/csv']
var _encodingsItems = ['application/geo+json', 'text/html', 'text/csv']

function getServiceUrl(req) {
  // remove the optional extension from the baseUrl
  var root = req.baseUrl.replace(/\.[^.]*$/, '')

  const proxyHost = req.headers["x-forwarded-host"]
  var host = proxyHost || req.headers.host
  host = join(host, root)
  var serviceUrl = `${req.protocol}://${host}`

  return new URL(serviceUrl);
}

function ISODateString(d) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }
  return d.getUTCFullYear() + '-'
    + pad(d.getUTCMonth() + 1) + '-'
    + pad(d.getUTCDate()) + 'T'
    + pad(d.getUTCHours()) + ':'
    + pad(d.getUTCMinutes()) + ':'
    + pad(d.getUTCSeconds()) + 'Z';
}

function makeHeaderLinks(hls) {
  var link = ""
  hls.forEach(hl => {
    link += `<${hl.href}>; rel="${hl.rel}"; title="${hl.title}"; type="${hl.type}",`
  });

  // remove last ,
  link = link.slice(0, -1);

  return link;
}

function getTypeFromFormat(format) {
  var i = _formats.indexOf(format);
  return _encodings[i]
}

function getTypeItemsFromFormat(format) {
  var i = _formats.indexOf(format);
  return _encodingsItems[i]
}

function getAlternateFormats(format, formats) {
  var alternateFormats = formats
  alternateFormats = alternateFormats.filter(item => {
    return item !== format
  })

  return alternateFormats;
}

function UriToEPSG(uri) {

if (uri == 'http://www.opengis.net/def/crs/OGC/1.3/CRS84')
  uri = 'https://www.opengis.net/def/crs/EPSG/0/4326'

  var parts = uri.split('/');
  var identifier = parts.pop()
  parts.pop()
  var body = parts.pop()
  return `${body}:${identifier}`
}

function EPSGtoProj4(epsg) {
  return "+proj=sterea +lat_0=52.1561605555556 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.4171,50.3319,465.5524,1.9342,-1.6677,9.1019,4.0725 +units=m +no_defs +type=crs";
}

function ifTrailingSlash(req, res) {
  if (req.url.endsWith('/')) {
    res.status(404).json({ 'code': 'Path contains a trailing slash', 'description': 'A URI MUST never contain a trailing slash' })
    return true
  }
  return false
}

function checkForAllowedQueryParams(query, params) {
  var rejected = []
  for (var propName in query) {
    if (query.hasOwnProperty(propName))
      if (!params.includes(propName))
        rejected.push(propName)
  }
  return rejected;
}

function getFormatFreeUrl(req) {
  var root = req.baseUrl.replace(/\.[^.]*$/, '')

  const proxyHost = req.headers["x-forwarded-host"]
  var host = proxyHost || req.headers.host
  host = join(host, root)

  var url = new URL(`${req.protocol}://${host}${req.path}`)
  /*
    for (var propName in req.query) {
      if (req.query.hasOwnProperty(propName))
        url.searchParams.append(propName, req.query[propName])
    }
  */
  return url.toString()
}

function checkNumeric(value, name, res) {

  if (value == undefined) return true

  if (isNaN(value)) {
    res.status(400).json({ 'code': 'Bad request', 'description': `Parameter value '${value}' is invalid for parameter '${name}': The value is not an integer.` })
    return false
  }

  return true
}

export default {
  getServiceUrl,
  ISODateString,
  makeHeaderLinks,
  UriToEPSG,
  getTypeFromFormat,
  getTypeItemsFromFormat,
  getAlternateFormats,
  ifTrailingSlash,
  getFormatFreeUrl,
  checkForAllowedQueryParams,
  checkNumeric}