import { bbox, featureCollection } from '@turf/turf'

function getId(dataDef) {
    if (dataDef.schema == undefined || dataDef.schema.properties == undefined)
        return


    for (let property in dataDef.schema.properties) {
        if (dataDef.schema.properties.hasOwnProperty(property)) {
            var value = dataDef.schema.properties[property];
            if (value.role !== undefined)
                if (value.role == 'ID') return value.name
        }
    }

    return
}

export function makeOAPIF(geojson, dataDef) {

    if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
        if (geojson.crs.properties.name.startsWith('EPSG'))
            geojson.crs.properties.name = 'http://www.opengis.net/def/crs/EPSG/0/' + geojson.crs.properties.name
    }
    else {
        geojson.crs = {}
        geojson.crs.properties = {}
        geojson.crs.properties.name = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' // default
    }

    var idName = getId(dataDef)
    if (idName == undefined) return

    // TODO: where does it say we have to do this??
    // each Feature resource has id member
    geojson.features.forEach((feature) => feature.id = feature.properties[idName])

    // override name and description from metadata, 
    geojson.name = dataDef.title
    geojson.description = dataDef.description

    geojson.lastModified = new Date()

    // calculate the bbox from geometry
    geojson.bbox = bbox(featureCollection(geojson.features));
    // Note: some bbox numbers can get quite precise, up to 12 decimals behind the comma (I know, nonsensical),
    // that can get clipped when rounded to 7 decimals. This clipping is not always rounded in the 
    // correct way. To fix this, extend the bbox just a little (at the 7th decimal)
    geojson.bbox[0] = (geojson.bbox[0] - 0.0000001).toFixed(7)
    geojson.bbox[1] = (geojson.bbox[1] - 0.0000001).toFixed(7)
    geojson.bbox[2] = (geojson.bbox[2] + 0.0000001).toFixed(7)
    geojson.bbox[3] = (geojson.bbox[3] + 0.0000001).toFixed(7)

    // --- begin construct schema ------------------- 
    geojson.schema = {}

    for (let propertyName in dataDef.schema.properties) {
        if (dataDef.schema.properties.hasOwnProperty(propertyName)) {
            var property = dataDef.schema.properties[propertyName]

            var item = {}
            if (property['label'])
                item.title = property['label']
            if (property['type'])
                item.type = property['type']
            if (property['format'])
                item.format = property['format']
            // (OAPIF P5) Requirement 4 The keyword "x-ogc-role" SHALL be used to declare a specific role of the property
            // (OAPIF P5) Requirement 5 A property with "x-ogc-role" set to "id" SHALL be the identifier of the 
            //            item in the collection that contains the item.
            // (OAPIF P5) Requirement 14 If the features have a property that represents the feature type, 
            //            the role "type" can be used for this property.
            //  Requirement 14A: A property with "x-ogc-role" set to "type" SHALL be a string property.
            //  Requirement 14B: At most one property in a schema SHALL have "x-ogc-role" with a value "type".
            // else if (item.type == 'string') item['x-ogc-role'] = 'type'
            if (property['role'])
                item['x-ogc-role'] = property['role'].toLowerCase()
            if (property.values)
                item.enum = property.values

            geojson.schema[propertyName] = item
        }
    }
    if (dataDef.schema.geometry) {
        var property = dataDef.schema.geometry
        var item = {}
        // (OAPIF P5) Requirement 9 A property with "x-ogc-role" set to "primary-geometry" SHALL be a spatial property.
        if (property['role'])
            item['x-ogc-role'] = property['role'].toLowerCase()
        item['format'] = `${property.type}-${property.geometryType}`.toLowerCase()
        geojson.schema['geometry'] = item
    }

    geojson.queryables = {}
    if (dataDef.queryables) {
        if (dataDef.queryables.spatial) {
            dataDef.queryables.spatial.forEach((geom) => {
                geojson.queryables[`geometry`] = geojson.schema[geom]
            })
        }
        if (dataDef.queryables.temporal) {
        }
        if (dataDef.queryables.q) {
            dataDef.queryables.q.forEach((propertyName) => {
                geojson.queryables[propertyName] = geojson.schema[propertyName]
            })
        }
        if (dataDef.queryables.other) {
        }
    }

    return geojson
}

export default makeOAPIF