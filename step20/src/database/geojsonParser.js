import * as turf from '@turf/turf'

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

function getDateTimeFromSchema(schema) {
    if (schema == undefined)
        return
    for (let propertyname in schema) {
        if (schema.hasOwnProperty(propertyname)) {
            var value = schema[propertyname];
            if (value.format !== undefined)
                if (value.format == 'date-time' || value.format == 'date') return { 'name': propertyname, 'format': value.format }
        }
    }

    return
}

export function makeOAPIF(geojson, dataDef) {

    // Ignore the optional name and crs values in the GeoJSON file, but use
    // the information from dataDef

    geojson.crs = []
    geojson.crs.push('http://www.opengis.net/def/crs/OGC/1.3/CRS84') // because its a GeoJSON file
    geojson.crs = geojson.crs.concat(dataDef.crs)
    geojson.storageCrs = "http://www.opengis.net/def/crs/OGC/1.3/CRS84"

    var idName = getId(dataDef)
    if (idName == undefined) return

    // TODO: where does it say we have to do this??
    // each Feature resource has id member
    geojson.features.forEach((feature) => feature.id = feature.properties[idName])

    // override name and description from metadata, 
    geojson.name = dataDef.title
    geojson.description = dataDef.description

    geojson.lastModified = new Date()

    geojson.schema = {}
    for (let propertyName in dataDef.schema.properties) {
        if (dataDef.schema.properties.hasOwnProperty(propertyName)) {
            var property = dataDef.schema.properties[propertyName]

            var item = {}
            if (property['label'])
                item.title = property['label']
            if (property['description'])
                item.description = property['description']
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

    // calculate the bbox from geometry
    let _bbox = turf.bbox(turf.featureCollection(geojson.features));
    // Note: some bbox numbers can get quite precise, up to 12 decimals behind the comma (I know, nonsensical),
    // that can get clipped when rounded to 7 decimals. This clipping is not always rounded in the 
    // correct way. To fix this, extend the bbox just a little (at the 7th decimal)
    _bbox[0] = (_bbox[0] - 0.0000001).toFixed(7)
    _bbox[1] = (_bbox[1] - 0.0000001).toFixed(7)
    _bbox[2] = (_bbox[2] + 0.0000001).toFixed(7)
    _bbox[3] = (_bbox[3] + 0.0000001).toFixed(7)

    geojson.extent = {}
    geojson.extent.spatial = {}
    geojson.extent.spatial.bbox = _bbox
    geojson.extent.spatial.crs = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
    geojson.extent.temporal = {}
    geojson.extent.temporal.interval = ['..', '..']
    geojson.extent.temporal.trs = 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
    
    // calculate temperal extent (if a datetime field is in the schema)
    let dateTimeProperty = getDateTimeFromSchema(geojson.schema)
    if (dateTimeProperty !== undefined)
    {
        let minDate = new Date(8640000000000000)
        let maxDate = new Date(-8640000000000000)

        geojson.features.forEach((feature) => 
        {
            const dateTime = new Date(feature.properties[dateTimeProperty.name])
            if (dateTime > maxDate) maxDate = dateTime;
            if (dateTime < minDate) minDate = dateTime;
        })

        geojson.extent.temporal.interval[0] = minDate
        geojson.extent.temporal.interval[1] = maxDate
    }

    return geojson
}

export default makeOAPIF