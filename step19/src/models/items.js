import urlJoin from 'url-join'
import { getDatabases } from '../database/database.js'
import utils from '../utils/utils.js'
import projgeojson from '../utils/proj4.js'
import { bboxPolygon, booleanWithin } from '@turf/turf'

function getContent(neutralUrl, format, collection) {

  var item = {}
  item.type = collection.type
  item.features = collection.features
  item.timestamp = new Date().toISOString()
  item.links = []

  var selfUrl = new URL(neutralUrl)
  selfUrl.searchParams.append('f', format)
  item.links.push({ href: `${selfUrl}`, rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })

  utils.getAlternateFormats(format, ['json', 'html', 'csv']).forEach(altFormat => {
    var alternateUrl = new URL(neutralUrl)
    alternateUrl.searchParams.append('f', altFormat)
    item.links.push({ href: `${alternateUrl}`, rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
  })

  if (collection.crs.properties.name)
    item.headerContentCrs = collection.crs.properties.name

  return item
}

function getDatabase(collectionId) {
  var collections = getDatabases()
  return collections[collectionId]
}

function get(neutralUrl, format, collectionId, query, options, callback) {

  var collections = getDatabases()

  var collection = collections[collectionId]
  if (!collection)
    return callback({ 'httpCode': 404, 'code': `Collection not found: ${collectionId}`, 'description': 'Make sure you use an existing collectionId. See /Collections' }, undefined);

  var queryParams = ['f', 'bbox', 'bbox-crs', 'limit', 'offset', 'filter', 'filter-crs', 'filter-lang', 'skipGeometry', 'properties']
  // All attributes from schema can be queried
  for (var attributeName in collection.schema)
    if (collection.schema[attributeName]['x-ogc-role'] != 'primary-geometry')
      queryParams.push(attributeName)

  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400, 
  //         if the request URI includes a query parameter that is not specified in the API definition
  var rejected = utils.checkForAllowedQueryParams(query, queryParams)
  if (rejected.length > 0)
    return callback({ 'httpCode': 400, 'code': `The following query parameters are rejected: ${rejected}`, 'description': 'Valid parameters for this request are ' + queryParams }, undefined);

  var content = getContent(neutralUrl, format, collection)

  // make local copy to do subtraction (limit, offset, bbox,...) on
  var features = content.features
  //  var features = structuredClone(content.features) // deep copy for skipGeometry (don't understand)

  var doSkipGeometry = false
  var doProperties = []

  var _query = query
  if (_query) {
    // (OAPIF P1) Requirement 23A The operation SHALL support a parameter bbox
    // (OAPIF P2) Requirement 6 Each GET request on a 'features' resource SHALL support a query parameter bbox-crs 
    if (_query.bbox) {
      var corners = _query.bbox.split(',') // 
      var bbox = bboxPolygon(corners);

      if (_query['bbox-crs']) {
        // Assumption that content comes in WGS84
        var fromEpsg = utils.UriToEPSG(_query['bbox-crs'])
        bbox = projgeojson.projectBBox(bbox, fromEpsg, 'EPSG:4326')
        delete _query['bbox-crs']
      }

      features = features.filter(
        feature =>
          booleanWithin(feature, bbox)
      )
      delete _query.bbox
    }

    if (_query.crs) {
      var toEpsg = utils.UriToEPSG(query.crs)
      features = projgeojson.projectFeatureCollection(features, 'EPSG:4326', toEpsg);

      content.headerContentCrs = query.crs
      delete _query.crs
    }

    var filterLang = 'filter'
    if (_query['filter-lang']) {
      filterLang = _query['filter-lang'].replace(/^\W+|\W+$/g, '') // removes ' at start and end
      delete _query['filter-lang']
    }

    if (_query.filter) {
      var parts = _query.filter.split(' and ') // only AND supported (not OR)
      parts.forEach(element => {
        var ao = element.split(' ', 2)
        var attributeName = ao[0]
        var operator = ao[1]
        var tv = ao.join(' ') + ' '
        var targetValue = element.slice(tv.length).replace(/^\W+|\W+$/g, '') // removes ' at start and end

        if (operator != 'eq')
          return callback({ 'httpCode': 400, 'code': `Invalid operator: ${operator}`, 'description': 'Valid operators are: eq' }, undefined);

        features = features.filter(
          element =>
            element.properties[attributeName] == targetValue)
      });

      delete _query.filter
    }

    if (_query.skipGeometry)
      doSkipGeometry = true
    delete _query.skipGeometry

    if (_query.properties)
      doProperties = _query.properties.split(',')
    delete _query.properties

    // Filter parameters as query
    for (var attributeName in _query) {
      // is attribute part of the queryables?
      const hasAttribute = attributeName in collection.queryables;
      if (hasAttribute) {
        var targetValue = _query[attributeName]
        features = features.filter(
          element =>
            element.properties[attributeName] == targetValue)
      }
      else
        return callback({ 'httpCode': 400, 'code': `The following query parameters are rejected: ${attributeName}`, 'description': 'Valid parameters for this request are ' + collection.queryables }, undefined);

    }
  }

  content.numberMatched = features.length

  if (options)
    content.features = features.slice(options.offset, options.offset + options.limit)
  else
    content.features = features

  if (doSkipGeometry)
    features.forEach(function (feature) { delete feature.geometry });

  if (doProperties.length > 0) {
    features.forEach(function (feature) {
      for (var propertyName in feature.properties)
        if (!doProperties.includes(propertyName)) 
          delete feature.properties[propertyName]
    })
  }

  content.numberReturned = content.features.length

  var offsetLimit = '';
  if (options.offset > 0 || options.limit != process.env.LIMIT) {
    offsetLimit = `&offset=${options.offset}`;
    if (options.limit != process.env.LIMIT)
      offsetLimit += `&limit=${options.limit}`;
  }

  if (options.offset + options.limit < content.numberMatched) { // only if we need pagination
    content.links.push({ href: `${neutralUrl}?f=${format}`, rel: `first`, type: utils.getTypeFromFormat(format), title: `Next page` })
    content.links.push({ href: `${neutralUrl}?f=${format}&offset=${options.offset + options.limit}` + (options.limit == process.env.LIMIT ? '' : `&limit=${options.limit}`), rel: `next`, type: utils.getTypeFromFormat(format), title: `Next page` })
  }

  var offset = options.offset - options.limit;
  if (offset < 0) offset = 0
  if (options.offset != 0)
    content.links.push({ href: `${neutralUrl}?f=${format}&offset=${offset}` + (options.limit == process.env.LIMIT ? '' : `&limit=${options.limit}`), rel: `prev`, type: utils.getTypeFromFormat(format), title: `Previous page` })

  return callback(undefined, content);
}

export default {
  get, getContent, getDatabase
}
