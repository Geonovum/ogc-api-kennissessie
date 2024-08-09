import { options as itemsOptions } from '../controllers/items.js'
import { options as featureOptions } from '../controllers/feature.js'

export var options = function (req, res, next) {

    // (OAPIF P4) Requirement 2 Condition: Server declares support for the POST method on the 
    //           resources endpoint via the Allow header in the response to an OPTIONS request. 
    // (OAPIF P4) Requirement 15A: The server SHALL support the HTTP OPTIONS operation at each 
    //            resource endpoint.

    // (OAPIF P4) Requirement 16B: A response with HTTP status code 200 SHALL include an Allow header.
    // (OAPIF P4) Requirement 16C: The value of the Allow header SHALL be the list of methods that are 
    //            allowed for the resource at the time and within the context of the request
    var pathParts = req.originalUrl.split('/')
    if (pathParts.length >= 2) {
        var part1 = pathParts[pathParts.length - 1]
        var part2 = pathParts[pathParts.length - 2]
        if (part1 == 'items') // items
            itemsOptions(req, res)
        if (part2 == 'items') // feature
            featureOptions(req, res)
    }

    // (OAPIF P4) Permission 6A: 
    // (OAPIF P4) Permission 6B: Servers MAY discard the request body
    // (ignore body)

    next()
}

export default options