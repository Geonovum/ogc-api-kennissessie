import { join } from 'path'
import { readFileSync } from 'fs'
import { getDatabases } from '../database/database.js'

const __dirname = import.meta.dirname

function get(neutralUrl, callback) {
    var content = {}

    // (OAPIF C) Requirement 47 The JSON representation SHALL conform to the OpenAPI Specification, version 3.0.
    // 
    // Note: OpenAPI definitions can be created using different approaches. A typical example is the representation 
    // of the feature collections. One approach is to use a path parameter collectionId, i.e., the API definition 
    // has only a single path entry for all feature collections. Another approach is to explicitly define each 
    // feature collection in a separate path and without a path parameter, which allows to specify filter parameters 
    // or explicit feature schemas per feature collection. Both approaches are valid.

    { // OpenAPI header, version
        var openapi = {}
        openapi.openapi = '3.0.2' // OpenAPI version (not the version this OGC API Features)
    }

    { // Info
        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'info.json'))
        var content = JSON.parse(jsonStr)

        var ff = JSON.stringify(content)

        ff = ff.replace(new RegExp('{{:title}}', 'g'), process.env.TITLE);
        ff = ff.replace(new RegExp('{{:description}}', 'g'), process.env.DESCRIPTION);
        ff = ff.replace(new RegExp('{{:version}}', 'g'), process.env.APIVERSION);

        var info = JSON.parse(ff)
    }

    { // Servers
        serverUrl = neutralUrl.toString() // remove /api from neutralUrl
        var serverUrl = serverUrl.substr(0, serverUrl.lastIndexOf("/"));

        var servers = { "servers": [] }

        var server = {}
        server.url = serverUrl
        servers.servers.push(server)
    }

    { // Tags
        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'tags.json'))
        var tags = JSON.parse(jsonStr)
    }

    { // Core
        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'core', 'paths.json'))
        var content = JSON.parse(jsonStr)

        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'core', 'components', 'parameters.json'))
        var parameters = JSON.parse(jsonStr)

        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'core', 'components', 'schema.json'))
        var schemas = JSON.parse(jsonStr)

        var paths = { 'paths': content }

        var components = { 'components': {} }
        components.components.schemas = {}
        components.components.parameters = {}

        for (var parameter in parameters) {
            components.components.parameters[parameter] = parameters[parameter]
        }

        for (var schema in schemas) {
            components.components.schemas[schema] = schemas[schema]
        }
    }

    { // Collections

        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'collections', 'paths.json'))
        var content = JSON.parse(jsonStr)

        paths.paths['/collections'] = content['/collections']

        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'collections', 'components', 'parameters.json'))
        var parameters = JSON.parse(jsonStr)

        var jsonStr = readFileSync(join(__dirname, '..', 'api', 'collections', 'components', 'schema.json'))
        var schemas = JSON.parse(jsonStr)

        for (var parameter in parameters) {
            components.components.parameters[parameter] = parameters[parameter]
        }

        for (var schema in schemas) {
            components.components.schemas[schema] = schemas[schema]
        }

        var databases = getDatabases()

        for (var name in databases) {
            var database = databases[name]

            var collectionTemplate = content['/collections/{{:collectionId}}']
            var ff = JSON.stringify(collectionTemplate)
    
            var ff = ff.replace(new RegExp('{{:collectionId}}', 'g'), name);
            var collection = JSON.parse(ff)

            paths.paths[`/collections/${name}`] = collection
        }
    }

    { // items

        var databases = getDatabases()

        for (var name in databases) {
            var database = databases[name]

            var jsonStr = readFileSync(join(__dirname, '..', 'api', 'features', 'paths.json'))
            var content = JSON.parse(jsonStr)

            var ff = JSON.stringify(content)
            var ff = ff.replace(new RegExp('{{:collectionId}}', 'g'), name);
            var items = JSON.parse(ff)

            var jsonStr = readFileSync(join(__dirname, '..', 'api', 'features', 'components', 'parameters.json'))
            var parameters = JSON.parse(jsonStr)
            var ff = JSON.stringify(parameters)
            var ff = ff.replace(new RegExp('{{:collectionId}}', 'g'), name);
            var parameters = JSON.parse(ff)

            var jsonStr = readFileSync(join(__dirname, '..', 'api', 'features', 'components', 'schema.json'))
            var schemas = JSON.parse(jsonStr)
            var ff = JSON.stringify(schemas)
            var ff = ff.replace(new RegExp('{{:collectionId}}', 'g'), name);
            var schemas = JSON.parse(ff)

            // TODO featureGeoJson from database schema
            var properties = schemas[`featureGeoJson_${name}`].properties.properties.properties
            var required = schemas[`featureGeoJson_${name}`].properties.properties.required
            required.push(database.id)
            for (var propName in database.schema) {
                var property = database.schema[propName]
                if (property['x-ogc-role'] == 'type')
                {
                    properties[property['title']] = {'title': property['title'], 'type': property['type']}
                }
            }

            for (var parameter in parameters) {
                components.components.parameters[parameter] = parameters[parameter]
            }

            for (var schema in schemas) {
                components.components.schemas[schema] = schemas[schema]
            }

            for (var part in items) {
                paths.paths[part] = items[part]
            }

        }
    }

    var content = { ...openapi, ...info, ...servers, ...tags, ...paths, ...components }

    return callback(undefined, content);
}

export default {
    get
}