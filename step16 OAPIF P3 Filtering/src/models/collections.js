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
  content.title = document.name
  content.description = document.description
  content.attribution = global.config.metadata.attribution

  content.links = []

  // Requirement 15 A and B
  getLinks(neutralUrl, format, name, content.links)
  getChildrenLinks(neutralUrl, format, name, content.links)

  // An optional extent that can be used to provide an indication of the spatial and temporal 
  // extent of the collection - typically derived from the data;
  content.extent = document.extent

  // An optional indicator about the type of the items in the collection 
  // (the default value, if the indicator is not provided, is 'feature').
  content.itemType = 'feature'
  // An optional list of coordinate reference systems (CRS) in which geometries may be returned by the server. 
  // The default value is a list with the default CRS (WGS 84 with axis order longitude/latitude);
  content.crs = document.crs
  content.storageCrs = document.storageCrs

  return content
}

function get(neutralUrl, format, callback) {

  // (OAPIC P2) Requirement 3A: The content of that response SHALL be based upon the JSON schema collections.yaml.
  var content = {};
  // An optional title and description for the collection;
  content.title = global.config.title 
  content.description = global.config.description
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