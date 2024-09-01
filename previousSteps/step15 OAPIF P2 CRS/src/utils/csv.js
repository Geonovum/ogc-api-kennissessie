function geojson2csv(geojson) {
    if (typeof geojson.features !== 'undefined') {
        var properties = geojson.features.map(function (obj) {
            return { properties: obj.properties }
        })

        if (properties.length > 0) {
            var line = properties[0]

            var inline = ''
            for (var propertyName in line.properties)
                inline += propertyName + ','
            inline = inline.slice(0, -1);
            inline += '\r\n'

            properties.forEach((line) => {
                for (var propertyName in line.properties)
                    inline += line.properties[propertyName] + ','
                inline = inline.slice(0, -1);
                inline += '\r\n'
            });

            return inline;
        }
    }
    return undefined
}


export default geojson2csv