var path = require('path');
var fs = require('fs');

var fileNames = fs.readdirSync(path.join(__dirname, "data")).filter(fn => fn.endsWith('.geojson'));

var dataDict = {};
fileNames.forEach(fileName => {
  var rawData = fs.readFileSync(path.join(__dirname, "data", fileName));
  var geojson = JSON.parse(rawData);

  if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
    if (geojson.crs.properties.name.startsWith('EPSG'))
      geojson.crs.properties.name = 'http://www.opengis.net/def/crs/EPSG/0/' + geojson.crs.properties.name
  }
  else {
    geojson.crs = {}
    geojson.crs.properties = {}
    geojson.crs.properties.name = 'urn:ogc:def:crs:OGC:1.3:CRS84'
  }

  var id = fileName.replace(/\.[^/.]+$/, "")

  // --- begin construct queryables ------------------- 
  geojson.queryables = {}

  var feature = geojson.features[0]

  var geometry = feature.geometry
  var item = {
    'title': 'geometry',
    'description': `The geometry of ${id}`,
    'format': geometry.type
  }
  geojson.queryables[`geometry`] = item

  var properties = feature.properties
  for (var propertyName in properties) {
    var item = {
      'title': propertyName,
      'description': `Description of ${propertyName}`,
      'type': typeof properties[propertyName]
    }
    geojson.queryables[`${propertyName}`] = item
  }

  // --- end construct queryables ------------------- 

  dataDict[id] = geojson;
});

function getCollection() {
  return dataDict
}

module.exports = { getCollection }
