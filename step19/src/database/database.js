import { join } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { bbox, featureCollection } from '@turf/turf'

const __dirname = import.meta.dirname

function readGeoJSONfiles() {
  if (__dirname === undefined)
    console.log('need node 20.16 or higher')
  
  var dir = process.env.DATA_PATH  || join(__dirname, "../../data")

  var fileNames = readdirSync(dir).filter(fn => fn.endsWith('.geojson'))

  fileNames.forEach(fileName => {
    var rawData = readFileSync(join(dir, fileName))

    var geojson = JSON.parse(rawData)
    dataDict[geojson.name] = geojson
  })
}

var dataDict = {};

export function load() {

  readGeoJSONfiles()

  Object.keys(dataDict).forEach(function (key) {
    var geojson = dataDict[key]

    if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
      if (geojson.crs.properties.name.startsWith('EPSG'))
        geojson.crs.properties.name = 'http://www.opengis.net/def/crs/EPSG/0/' + geojson.crs.properties.name
    }
    else {
      geojson.crs = {}
      geojson.crs.properties = {}
      geojson.crs.properties.name = 'urn:ogc:def:crs:OGC:1.3:CRS84' // default
    }

    // check if the properties contain an 'id' (used to uniquely identify the item)
    if (!geojson.features[0].properties.id)
      geojson.id = 'fid' // hack
    else
      geojson.id = 'id'

    geojson.lastModified = new Date()

    // calculate the bbox from geometry
    geojson.bbox = bbox(featureCollection(geojson.features));

    // --- begin construct queryables ------------------- 
    geojson.queryables = {}

    var feature = geojson.features[0]

    var geometry = feature.geometry
    var item = {
      'title': 'geometry',
      'description': `The geometry of ${key}`,
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

    // --- begin construct schema ------------------- 
    geojson.schema = {}

    var feature = geojson.features[0]

    // (OAPIF P5) Requirement 4 The keyword "x-ogc-role" SHALL be used to declare a specific role of the property

    // (OAPIF P5) Requirement 9 A property with "x-ogc-role" set to "primary-geometry" SHALL be a spatial property.
    var geometry = feature.geometry
    var item = {
      'x-ogc-role': 'primary-geometry',
      'format': geometry.type
    }
    geojson.schema[`geometry`] = item

    var properties = feature.properties
    for (var propertyName in properties) {
      var item = {
        'title': propertyName,
        'type': typeof properties[propertyName]
      }

        // (OAPIF P5) Requirement 5 A property with "x-ogc-role" set to "id" SHALL be the identifier of the 
        //            item in the collection that contains the item.
        if (propertyName == geojson.id) item['x-ogc-role'] = 'id'
        // (OAPIF P5) Requirement 14 If the features have a property that represents the feature type, 
        //            the role "type" can be used for this property.
        //  Requirement 14A: A property with "x-ogc-role" set to "type" SHALL be a string property.
        //  Requirement 14B: At most one property in a schema SHALL have "x-ogc-role" with a value "type".
        // else if (item.type == 'string') item['x-ogc-role'] = 'type'

      geojson.schema[`${propertyName}`] = item
    }

    // --- end construct schema ------------------- 
  })
}

export function getDatabases() {
  return dataDict
}

export default getDatabases