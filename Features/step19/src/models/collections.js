import urlJoin from 'url-join'
import { getDatabases } from '../database/database.js'
import utils from '../utils/utils.js'

function getLinks(neutralUrl, format, name, links) {  
  links.push({ href: urlJoin(neutralUrl, name, ), rel: `self`, title: `The Document` })
}

function getChildrenLinks(neutralUrl, format, name, links) {

  function getTypeFromFormat(format) {
    var _formats = ['json', 'geojson',  'html']
    var _encodings = ['application/geo+json', 'application/geo+json', 'text/html']
  
    var i = _formats.indexOf(format);
    return _encodings[i]
  }

  links.push({ href: urlJoin(neutralUrl, name, `items?f=${format}`), rel: `items`, type: getTypeFromFormat(format), title: `Access the features in the collection as ${format}` })
  utils.getAlternateFormats(format, ['json', 'html', 'csv']).forEach(altFormat => {
    links.push({ href: urlJoin(neutralUrl, name, `items?f=${altFormat}`), rel: `items`, type: getTypeFromFormat(altFormat), title: `Access the features in the collection as ${altFormat}` })
  })
}

function getContent(neutralUrl, format, name, document) {

  var content = {}
  // A local identifier for the collection that is unique for the dataset;
  content.id = name // required
  // An optional title and description for the collection;
  content.title = name
  content.description = name
  content.attribution = 'this dataset is attributed to the municipality of amstelveen'

  content.links = []

  // Requirement 15 A and B
  getLinks(neutralUrl, format, name, content.links)
  getChildrenLinks(neutralUrl, format, name, content.links)

  // An optional extent that can be used to provide an indication of the spatial and temporal 
  // extent of the collection - typically derived from the data;
  content.extent = {}
  content.extent.spatial = {}
  // Requirement 16 A and B
  content.extent.spatial.bbox = []
  content.extent.spatial.bbox.push(document.bbox)
  content.extent.spatial.crs = document.crs.properties.name
  content.extent.temporal = {}
  content.extent.temporal.interval = []
  content.extent.temporal.interval.push(['2010-02-15T12:34:56Z', '2030-02-15T12:34:56Z'])
  content.extent.temporal.trs = 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'

  // An optional indicator about the type of the items in the collection 
  // (the default value, if the indicator is not provided, is 'feature').
  content.itemType = 'feature'
  // An optional list of coordinate reference systems (CRS) in which geometries may be returned by the server. 
  // The default value is a list with the default CRS (WGS 84 with axis order longitude/latitude);
  content.crs = []
  if (document.crs.properties.name)
    content.crs.push(document.crs.properties.name)

  content.storageCrs = document.crs.properties.name

  return content
}

function get(neutralUrl, format, callback) {

  // (OAPIC P2) Requirement 3A: The content of that response SHALL be based upon the JSON schema collections.yaml.
  var content = {};
  // An optional title and description for the collection;
  content.title = process.env.TITLE // Requirement 2 B
  content.description = process.env.DESCRIPTION
  content.links = []
  // (OAPIC P2) Requirement 2B. The API SHALL support the HTTP GET operation on all links to a Collections Resource that have the relation type
  content.links.push({ href: urlJoin(neutralUrl, `f=${format}`), rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    content.links.push({ href: urlJoin(neutralUrl, `f=${altFormat}`), rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
  })

  content.collections = [];

  var collections = getDatabases()

  // get content per :collection
  for (var name in collections) {
    var collection = getContent(neutralUrl, format, name, collections[name])
  
    content.collections.push(collection);
  }

  return callback(undefined, content);
}

export default {
  get,
}