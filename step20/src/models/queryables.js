import { getDatabases } from '../database/database.js'

function get(neutralUrl, format, collectionId, callback) {

  var collection = getDatabases()[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var content = {}
  // (OAPIF P3) Requirement 3B:  For responses that use application/schema+json as the Content-Type 
  //            of the response, the response SHALL have the following characteristics:
  //    - The property $schema is https://json-schema.org/draft/2020-12/schema.
  content.$schema = 'https://json-schema.org/draft/2020-12/schema'
  //    - The property $id is the URI of the resource without query parameters
  content.$id = `${neutralUrl}`
  //    - The type is object and each property is a queryable
  content.type = 'object'

  content.title = collectionId
  content.properties = collection.queryables

    // (OAPIF P3) Requirement 3G: The additionalProperties member with a value of true or false is 
    //            used to state the behavior with respect to properties that are not explicitly 
    //            declared in the queryables schema.
  content.additionalProperties = false

  return callback(undefined, content);
}

export default {
  get
}
