const debug = require('debug')('models')

function get(serviceUrl, callback) {

  debug(`conformance`)

  // Recommendation 5 A: ... implementations SHOULD consider to support an HTML encoding.
  // Recommendation 6 A & B: ... implementations SHOULD consider to support GeoJSON as an encoding for features and feature collections

  var content = {};
  content.conformsTo = [];

  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/html");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/json");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/oas30");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-2/0.0/conf/collections");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-2/0.0/conf/html");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-common-2/0.0/conf/json");

  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-2/1.0/conf/crs");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/queryables");
  content.conformsTo.push("http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/filter");

  content.links = []
  content.links.push({ href: `${serviceUrl}/conformance?f=html`, rel: `alternate`, type: `text/html`, title: `this document` })
  content.links.push({ href: `${serviceUrl}/conformance?f=json`, rel: `self`, type: `application/json`, title: `this document in json` })

  return callback(undefined, content);
}

module.exports = {
  get,
}