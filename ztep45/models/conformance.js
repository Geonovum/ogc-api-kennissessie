const debug = require('debug')('models')

async function get (callback) {
  
  debug(`conformance`)

  // Recommendation 5 A: ... implementations SHOULD consider to support an HTML encoding.
  // Recommendation 6 A & B: ... implementations SHOULD consider to support GeoJSON as an encoding for features and feature collections

  var content = {};
  content.conformsTo = [];
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson");

  return content
}

module.exports = {
  get,
}