var path = require('path')

function getServiceUrl(req) {
  // remove the optional extension from the baseUrl
  var root = req.baseUrl.replace(/\.[^.]*$/,'')

  const proxyHost = req.headers["x-forwarded-host"]
  var host = proxyHost || req.headers.host
  host = path.join(host, root)
  var serviceUrl = `${req.protocol}://${host}`

  return new URL(serviceUrl);
}

function ISODateString(d) {
  function pad(n) {
    return n < 10 ? '0' + n : n;
  }
  return d.getUTCFullYear() + '-' 
       + pad(d.getUTCMonth() + 1) + '-' 
       + pad(d.getUTCDate()) + 'T'
       + pad(d.getUTCHours()) + ':'
       + pad(d.getUTCMinutes()) + ':'
       + pad(d.getUTCSeconds()) + 'Z';
}

function header(collection) {
  collection.title = "Title of " + collection.id;
  collection.description = "Description of " + collection.id;
  collection.links = [];

  return collection;
}

function link(href, rel, type, title) {
  var item = {};
  item.href = href;
  item.rel = rel;
  item.type = type;
  item.title = title;

  return item;
}

module.exports = {
  getServiceUrl, 
  ISODateString,
  link,
  header
}