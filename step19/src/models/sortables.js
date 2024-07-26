const debug = require('debug')('models')
const database = require('../database')

function get(serviceUrl, collectionId, callback) {

  var collections = database.getCollection()
  var document = collections[collectionId]
  if (!document)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var content = {}
  // Requirement 4B The parameter collectionId is each id property in the
  // Collections resource (JSONPath: $.collections[*].id).
  content.$id = `${serviceUrl}/collections/${collectionId}/sortables`
  content.$schema = 'https://json-schema.org/draft/2020-12/schema'
  content.type = 'object'
  // Recommendation 1A
  content.title = collectionId
  content.additionalProperties = false

  return callback(undefined, content);
}

module.exports = {
  get
}
