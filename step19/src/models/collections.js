import { getDatabases } from '../database/database.js'
import collection from './collection.js'
import utils from '../utils/utils.js'

function get(neutralUrl, format, callback) {

  // (OAPIC P2) Requirement 3A: The content of that response SHALL be based upon the JSON schema collections.yaml.
  var content = {};
  // An optional title and description for the collection;
  content.title = process.env.TITLE // Requirement 2 B
  content.description = process.env.DESCRIPTION
  content.links = []
  // (OAPIC P2) Requirement 2B. The API SHALL support the HTTP GET operation on all links to a Collections Resource that have the relation type
  content.links.push({ href: `${neutralUrl}?f=${format}`, rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    content.links.push({ href: `${neutralUrl}?f=${altFormat}`, rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
  })

  content.collections = [];

  var collections = getDatabases()

  for (var name in collections) {
    var item = collection.getMetaData(neutralUrl, format, name, collections[name])
  
    content.collections.push(item);
  };

  return callback(undefined, content);
}

export default {
  get,
}