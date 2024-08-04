import urlJoin from 'url-join'
import { getDatabases } from '../database/database.js'
import utils from '../utils/utils.js'

function get(neutralUrl, format, callback) {

    // Requirement 2 A & B
    // The content of that response SHALL be based upon the OpenAPI 3.0 schema landingPage.yaml (http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/landingPage.yaml)
    // and include at least links to the following resources:
    //
    // - the API definition (relation type `service-desc` or `service-doc`)
    // - /conformance (relation type `conformance`)
    // - /collections (relation type `data`)
    var content = {}
    content.title = process.env.TITLE // Requirement 2 B
    content.description = process.env.DESCRIPTION
    content.attribution = 'Thanks to Acme'

    content.extend = {}
    content.extend.spatial = {}
    content.extend.spatial.bbox = []
    content.extend.temporal = {}
    content.extend.temporal.interval = [[]]
    content.extend.temporal.trs = 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'

    var collections = getDatabases()
    for (var name in collections) {
        var collection = collections[name]
        content.extend.spatial.bbox.push(collection.bbox)
        content.extend.spatial.crs = collection.crs
    }

    content.links = []
    content.links.push({ href: urlJoin(neutralUrl, `?f=${format}`), rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })

    utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
        content.links.push({ href: urlJoin(neutralUrl, `?f=${altFormat}`), rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
    })

    content.links.push({ href: urlJoin(neutralUrl, 'conformance'), rel: `conformance`,                                        title: `OGC API conformance classes implemented by this server` })
    content.links.push({ href: urlJoin(neutralUrl, 'conformance'), rel: `http://www.opengis.net/def/rel/ogc/1.0/conformance`, title: `OGC API conformance classes implemented by this server` })

    content.links.push({ href: urlJoin(neutralUrl, 'api?f=json'), rel: `service-desc`, type: `application/vnd.oai.openapi+json;version=3.0`, title: `Definition of the API in OpenAPI 3.0` })
    content.links.push({ href: urlJoin(neutralUrl, 'api?f=yaml'), rel: `service-desc`, type: `application/vnd.oai.openapi;version=3.0`,      title: `Definition of the API in OpenAPI 3.0` })
    content.links.push({ href: urlJoin(neutralUrl, 'api?f=html'), rel: `service-doc`,  type: `text/html`,                                    title: `Documentation of the API` })
    
    content.links.push({ href: urlJoin(neutralUrl, 'collections'), rel: `data`, title: `Access the data` })
    content.links.push({ href: urlJoin(neutralUrl, 'collections'), rel: `http://www.opengis.net/def/rel/ogc/1.0/data`, title: `Access the data` })

    content.links.push({ href: `http://creativecommons.org/publicdomain/zero/1.0/deed.nl`, rel: `license`, title: `CC0 1.0`, type: `text/html` })
  
    return callback(undefined, content);
}

export default {
    get
}