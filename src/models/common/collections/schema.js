import urlJoin from "url-join";
import { getDatabases } from "../../../database/database.js";

function get(neutralUrl, format, collectionId, callback) {
  var collections = getDatabases();
  var document = collections[collectionId];
  if (!document)
    return callback(
      {
        httpCode: 404,
        code: `Collection not found: ${collectionId}`,
        description:
          "Make sure you use an existing collectionId. See /Collections",
      },
      undefined
    );

  var content = {};
  // (OAPIF-P5) Requirement 1A The schema SHALL be a valid JSON Schema.
  // (OAPIF-P5) The schema SHALL have the following characteristics:
  //    "$schema" is "https://json-schema.org/draft/2020-12/schema";
  //    "$id" is a HTTP(S) URI without query parameters that returns the schema, if requested with the header "Accept: application/schema+json"
  //    "type" is "object".
  content.$id = urlJoin(neutralUrl, "collections", collectionId, "queryables");
  content.$schema = "https://json-schema.org/draft/2020-12/schema";
  content.type = "object";

  // (OAPIF-P5) Recommendation 1A Each property SHOULD have a human readable title ("title") and, where necessary for the understanding
  //     of the property, a description ("description").
  content.title = collectionId;

  // (OAPIF-P5) Requirement 2
  //    Each property SHALL include a "type" member, except for spatial properties
  //    Each spatial property SHALL not include a "type" or "$ref" member.
  content.properties = document.schema;

  content.required = []; // TODO: from yml file??

  return callback(undefined, content);
}

export default {
  get,
};
