import urlJoin from 'url-join'
import { getDatabases } from '../database/database.js'
import utils from '../utils/utils.js'

function getMetaData(neutralUrl, format, name, document) {

  var content = {}
  // A local identifier for the collection that is unique for the dataset;
  content.id = name // required
  // An optional title and description for the collection;
  content.title = name
  content.description = name
  content.attribution = 'this dataset is attributed to the municipality of amstelveen'
  content.links = []
  // Requirement 15 A and B
  content.links.push({ href: urlJoin(neutralUrl, `?f=${format}`), rel: `self`, type: utils.getTypeFromFormat(format), title: `The Document` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    content.links.push({ href: urlJoin(neutralUrl, `?f=${altFormat}`), rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `The Docuemnt as ${altFormat}` })
  })

  content.links.push({ href: urlJoin(neutralUrl, `/items?f=${format}`), rel: `items`, type: utils.getTypeFromFormat(format), title: `Access the features in the collection as ${format}` })
  utils.getAlternateFormats(format, ['geojson', 'json', 'html', 'csv']).forEach(altFormat => {
    content.links.push({ href: urlJoin(neutralUrl, `/items?f=${altFormat}`), rel: `items`, type: utils.getTypeFromFormat(altFormat), title: `Access the features in the collection as ${altFormat}` })
  })

  // An optional extent that can be used to provide an indication of the spatial and temporal 
  // extent of the collection - typically derived from the data;
  content.extent = {}
  content.extent.spatial = {}
  // Requirement 16 A and B
  content.extent.spatial.bbox = []
  content.extent.spatial.bbox.push(document.bbox)
  content.extent.spatial.crs = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
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

function get(neutralUrl, format, collectionId, callback) {

  var query = { type: 'FeatureCollection', name: `${collectionId}` };
  var projection = { name: 1, crs: 1, _id: 1 }

  var collections = getDatabases()

  var content = getMetaData(neutralUrl, format, collectionId, collections[collectionId])

  return callback(undefined, content);
}

export default {
  get, getMetaData
}