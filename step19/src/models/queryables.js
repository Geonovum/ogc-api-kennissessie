const database = require('../database/database')

async function get(serviceUrl, collectionId, callback) {

  var collections = await database.getCollection()
  var document = collections[collectionId]

  var content = {}
  // Requirement 4B The parameter collectionId is each id property in the
  // Collections resource (JSONPath: $.collections[*].id).
  content.$id = `${serviceUrl}/collections/${collectionId}/queryables`
  content.$schema = 'https://json-schema.org/draft/2020-12/schema'
  content.type = 'object'
  // Recommendation 1A
  content.title = collectionId
  content.description = `Description of ${collectionId}`
  content.properties = document.queryables
  content.additionalProperties = false

  return callback(undefined, content);
}

module.exports = {
  get
}
