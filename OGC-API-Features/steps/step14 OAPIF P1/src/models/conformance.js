import urlJoin from 'url-join'
import utils from '../utils/utils.js'

export function get(neutralUrl, format, callback) {

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

  content.links = []
  content.links.push({ href: urlJoin(neutralUrl, `conformance?f=${format}`), rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })

  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    content.links.push({ href: urlJoin(neutralUrl, `conformance?f=${altFormat}`), rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
  })

  return callback(undefined, content);
}
