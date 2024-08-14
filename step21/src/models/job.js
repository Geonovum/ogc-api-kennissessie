import urlJoin from 'url-join'
import utils from '../utils/utils.js'

function getLinks(neutralUrl, format, name, links) {

  function getTypeFromFormat(format) {
    var _formats = ['json', 'html']
    var _encodings = ['application/json', 'text/html']
  
    var i = _formats.indexOf(format);
    return _encodings[i]
  }
  
  links.push({ href: urlJoin(neutralUrl, `?f=${format}`), rel: `self`, type: getTypeFromFormat(format), title: `Job description` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    links.push({ href: urlJoin(neutralUrl, `?f=${altFormat}`), rel: `alternate`, type: getTypeFromFormat(altFormat), title: `Job description as ${altFormat}` })
  })
}

function getMetaData(neutralUrl, format, name, document) {

  var content = {}
  // A local identifier for the collection that is unique for the dataset;
  content.id = name // required
  // An optional title and description for the collection;
  content.title = document.name
  content.description = document.description
  content.attribution = 'this dataset is attributed to the municipality of amstelveen'
  content.links = []

  getLinks(neutralUrl, format, name, content.links)

  return content
}

function get(neutralUrl, format, collectionId, callback) {

  var query = { type: 'FeatureCollection', name: `${collectionId}` };
  var projection = { name: 1, crs: 1, _id: 1 }

  var collections = getDatabases()
  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var content = getMetaData(neutralUrl, format, collectionId, collection)

  return callback(undefined, content);
}

export default {
  get
}