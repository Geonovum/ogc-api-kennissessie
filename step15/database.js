const path = require('path');
const fs = require('fs');
const turf = require('@turf/turf');

var fileNames = fs.readdirSync(path.join(__dirname, "data")).filter(fn => fn.endsWith('.geojson'));

var dataDict = {};
fileNames.forEach(fileName => {
  var rawData = fs.readFileSync(path.join(__dirname, "data", fileName));
  var geojson = JSON.parse(rawData);

  geojson.crs = []
  if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
    if (geojson.crs.properties.name.startsWith('EPSG'))
      geojson.crs.push('http://www.opengis.net/def/crs/EPSG/0/' + geojson.crs.properties.name)
    geojson.crs.push('http://www.opengis.net/def/crs/EPSG/0/28992') // RD-New
    delete geojson.crs.properties
  }
  else {
    geojson.crs.push('urn:ogc:def:crs:OGC:1.3:CRS84') // 1st is default
    geojson.crs.push('http://www.opengis.net/def/crs/EPSG/0/28992') // RD-New
  }

  geojson.lastModified = new Date()

  // check if the properties contain an 'id' (used to uniquely identify the item)
  if (!geojson.features[0].properties.id)
    geojson.id = 'fid' // hack
  else
    geojson.id = 'id'

  // calculate the bbox from geometry
  geojson.bbox = turf.bbox(turf.featureCollection(geojson.features));

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
