/**
 * OGC API Features - Items Model
 * 
 * This module handles the retrieval and processing of feature items from collections
 * according to OGC API Features standards. It supports various query parameters,
 * filtering, pagination, and output formats.
 */

import * as turf from "@turf/turf";
import urlJoin from "url-join";
import { getDatabases } from "../../database/database.js";
import utils from "../../utils/utils.js";
import projgeojson from "../../utils/proj4.js";

/**
 * Generates pagination links for the response
 * 
 * Creates 'first', 'next', and 'previous' links based on the current pagination state.
 * These links help clients navigate through paginated results.
 * 
 * @param {Array} links - Array of existing links to append pagination links to
 * @param {Object} options - Pagination options containing offset and limit
 */
function getPaginationLinks(links, options) {
  // Use the self link as the basis for 'first', 'next' and 'previous'
  var paginationBase = links.filter((l) => l.rel === "self")[0];

  // Add 'first' link if not on the first page
  if (options.offset > 0)
    links.push({
      href: paginationBase.href,
      rel: `first`,
      type: paginationBase.type,
      title: `First page`,
    });

  // Always add 'next' link (assuming there might be more results)
  links.push({
    href:
      `${paginationBase.href}&offset=${options.offset + options.limit}` +
      (options.limit == global.config.server.limit ? "" : `&limit=${options.limit}`),
    rel: `next`,
    type: paginationBase.type,
    title: `Next page`,
  });

  // Add 'previous' link if not on the first page
  var offset = options.offset - options.limit;
  if (offset < 0) offset = 0;
  if (options.offset != 0)
    links.push({
      href:
        `${paginationBase.href}&offset=${offset}` +
        (options.limit == global.config.server.limit ? "" : `&limit=${options.limit}`),
      rel: `prev`,
      type: paginationBase.type,
      title: `Previous page`,
    });
}

/**
 * Generates HATEOAS links for the response
 * 
 * Creates 'self' and 'alternate' links for different output formats.
 * This follows OGC API Features standards for providing multiple representation options.
 * 
 * @param {string} neutralUrl - Base URL without format parameter
 * @param {string} format - Current requested format
 * @param {Array} links - Array to append the generated links to
 */
function getLinks(neutralUrl, format, links) {
  /**
   * Maps format names to their corresponding MIME types
   * 
   * @param {string} format - Format name (json, html, csv)
   * @returns {string} Corresponding MIME type
   */
  function getTypeFromFormat(format) {
    var _formats = ["json", "html", "csv"];
    var _encodings = ["application/geo+json", "text/html", "text/csv"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  // Add self link for the current format
  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Access the features in the collection as ${format}`,
  });
  
  // Add alternate links for other supported formats
  utils
    .getAlternateFormats(format, ["json", "html", "csv"])
    .forEach((altFormat) => {
      links.push({
        href: urlJoin(neutralUrl, `?f=${altFormat}`),
        rel: `alternate`,
        type: getTypeFromFormat(altFormat),
        title: `Access the features in the collection as ${altFormat}`,
      });
    });
}

/**
 * Creates the base content structure for the items response
 * 
 * Initializes a GeoJSON FeatureCollection with metadata, links, and CRS information.
 * This forms the foundation that will be modified by query parameters and filters.
 * 
 * @param {string} neutralUrl - Base URL without format parameter
 * @param {string} format - Requested output format
 * @param {Object} collection - Collection data from database
 * @returns {Object} Base items object with GeoJSON structure
 */
function getContent(neutralUrl, format, collection) {
  // Normalize geojson format to json for internal processing
  if (format == "geojson") format = "json";

  // Initialize the base GeoJSON FeatureCollection structure
  var items = {};
  items.type = collection.type;                    // "FeatureCollection"
  items.features = collection.features;            // Array of GeoJSON features
  items.defaultSortOrder = ["+fid"];              // Default sorting by feature ID
  items.timeStamp = new Date().toISOString();     // Response timestamp
  items.links = [];                               // HATEOAS links array

  // Generate self and alternate format links
  getLinks(neutralUrl, format, items.links);

  // Set the coordinate reference system for the response
  items.headerContentCrs = collection.crs[0];

  return items;
}

/**
 * Main function to retrieve and process feature items from a collection
 * 
 * This is the core function that handles all OGC API Features query parameters,
 * filtering, sorting, and pagination. It implements various parts of the OGC API
 * Features specification including Parts 1-9.
 * 
 * @param {string} neutralUrl - Base URL without format parameter
 * @param {string} format - Requested output format (json, html, csv)
 * @param {string} collectionId - ID of the collection to query
 * @param {Object} query - Query parameters from the request
 * @param {Object} options - Pagination options (offset, limit)
 * @param {Function} callback - Callback function for async response
 */
function get(neutralUrl, format, collectionId, query, options, callback) {
  // Get all available collections from the database
  var collections = getDatabases();
  var collection = collections[collectionId];
  
  // Validate that the requested collection exists
  if (!collection)
    return callback(
      {
        httpCode: 404,
        code: `Collection not found: ${collectionId}`,
        description:
          "Make sure you use an existing collectionId. See /Collections",
      },
      undefined
    );

  // Define all supported query parameters according to OGC API Features spec
  var queryParams = [
    "f",              // Format parameter
    "crs",            // Coordinate Reference System
    "bbox",           // Bounding box filter
    "bbox-crs",       // CRS for bounding box
    "limit",          // Maximum number of features to return
    "offset",         // Number of features to skip
    "datetime",       // Temporal filter
    "filter",         // CQL filter expression
    "filter-crs",     // CRS for filter
    "filter-lang",    // Filter language
    "skipGeometry",   // Skip geometry in response
    "properties",     // Part 6: Property Selection
    "featuresLimit",  // Alternative limit parameter
    "sortby",         // Part 8: Sortable parameters
    "zoom-level",     // Part 7: Geometry Simplification
    "q",              // Part 9: Text Search
  ];
  
  // Add all schema attributes as queryable parameters
  // (except primary geometry which is handled separately)
  for (var attributeName in collection.schema)
    if (collection.schema[attributeName]["x-ogc-role"] != "primary-geometry")
      queryParams.push(attributeName);
      
  // Validate query parameters against allowed list
  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400,
  //         if the request URI includes a query parameter that is not specified in the API definition
  var rejected = utils.checkForAllowedQueryParams(query, queryParams);
  if (rejected.length > 0)
    return callback(
      {
        httpCode: 400,
        code: `The following query parameters are rejected: ${rejected}`,
        description: "Valid parameters for this request are " + queryParams,
      },
      undefined
    );

  // Create the base content structure
  var content = getContent(neutralUrl, format, collection);

  // Create a deep copy of features for processing
  // This is necessary because we'll be modifying the features array with filters,
  // and we need to preserve the original for potential geometry operations
  var features = structuredClone(content.features);

  // Initialize flags for post-processing
  var doSkipGeometry = false;  // Whether to remove geometry from response
  var doProperties = [];       // Properties to include in response

  var _query = query;
  if (_query) {
    // Process query parameters in order of efficiency:
    // Simple queries that limit features first, then complex geo queries on smaller datasets
    
    // ===== TEMPORAL FILTERING =====
    // (OAPIF C) Requirement 26: Only features that have a temporal geometry that intersects 
    // the temporal information in the datetime parameter SHALL be part of the result set
    if (_query.datetime) {
      // Parse datetime parameter - supports single date or date range
      var datetimes = _query.datetime.split("/");
      if (datetimes.length <= 0 || datetimes.length > 2)
        return callback(
          {
            httpCode: 400,
            code: `Bad Request`,
            description: `Excepting 1 or 2 dates, got ${datetimes.length}`,
          },
          undefined
        );

      // Find the datetime property in the collection schema
      var datetimeAttribName = undefined;
      for (var attributeName in collection.schema) {
        var value = collection.schema[attributeName];
        if (
          value.format != "undefined" &&
          (value.format == "date-time" || value.format == "date")
        ) {
          datetimeAttribName = attributeName;
          break;
        }
      }
      
      // Validate that a datetime field exists in the collection
      if (datetimeAttribName == undefined)
        return callback(
          {
            httpCode: 400,
            code: `Bad Request`,
            description: `datetime query requested, but no datetime field in database`,
          },
          undefined
        );

      // Apply temporal filtering based on datetime parameter format
      if (datetimes.length == 1) {
        // Single date: exact match
        features = features.filter(
          (element) =>
            utils.dates.compare(
              element.properties[datetimeAttribName].toString(),
              datetimes[0]
            ) == 0
        );
      } else {
        // Date range: [beginDate, endDate] or [beginDate, ..] or [.., endDate] or [.., ..]
        var beginDate = datetimes[0];
        var endDate = datetimes[1];
        
        if (beginDate != ".." && endDate != "..") {
          // Bounded range: [date1, date2]
          features = features.filter((element) =>
            utils.dates.inRange(
              element.properties[datetimeAttribName].toString(),
              datetimes[0],
              datetimes[1]
            )
          );
        } else if (beginDate == ".." && endDate != "..") {
          // Half-bounded: [.., endDate] - everything before endDate
          features = features.filter((element) =>
            utils.dates.until(
              element.properties[datetimeAttribName].toString(),
              datetimes[1]
            )
          );
        } else if (beginDate != ".." && endDate == "..") {
          // Half-bounded: [beginDate, ..] - everything after beginDate
          features = features.filter((element) =>
            utils.dates.from(
              element.properties[datetimeAttribName].toString(),
              datetimes[0]
            )
          );
        } else if (beginDate == ".." && endDate == "..") {
          // Non-bounded: [.., ..] - no temporal filtering (all features pass)
        }
      }
      delete _query.datetime;
    }

    // ===== SPATIAL FILTERING (BOUNDING BOX) =====
    // (OAPIF P1) Requirement 23A: The operation SHALL support a parameter bbox
    // (OAPIF P2) Requirement 6: Each GET request on a 'features' resource SHALL support a query parameter bbox-crs
    if (_query.bbox) {
      // Parse bounding box coordinates (minx,miny,maxx,maxy)
      var corners = _query.bbox.split(",");
      var bbox = turf.bboxPolygon(corners);

      // Handle coordinate reference system transformation if bbox-crs is specified
      if (_query["bbox-crs"]) {
        // Transform bbox from specified CRS to WGS84 (EPSG:4326)
        // Assumption: content is stored in WGS84
        var fromEpsg = utils.UriToEPSG(_query["bbox-crs"]);
        bbox = projgeojson.projectBBox(bbox, fromEpsg, "EPSG:4326");
        
        if (bbox == undefined)
          return callback(
            {
              httpCode: 400,
              code: `Bad Request`,
              description: `Invalid bbox-crs: ${fromEpsg}`,
            },
            undefined
          );

        delete _query["bbox-crs"];
      }

      // Filter features that are within the bounding box
      features = features.filter((feature) =>
        turf.booleanWithin(feature, bbox)
      );

      delete _query.bbox;
    }

    // ===== COORDINATE REFERENCE SYSTEM TRANSFORMATION =====
    // Transform the entire feature collection to the requested CRS
    if (_query.crs) {
      var toEpsg = utils.UriToEPSG(query.crs);
      features = projgeojson.projectFeatureCollection(
        features,
        "EPSG:4326",  // From WGS84 (assumed storage CRS)
        toEpsg        // To requested CRS
      );
      
      if (features == undefined)
        return callback(
          {
            httpCode: 400,
            code: `Bad Request`,
            description: `Invalid CRS: ${query.crs}`,
          },
          undefined
        );

      // Update the response header to indicate the output CRS
      content.headerContentCrs = query.crs;
      delete _query.crs;
    }

    // ===== CQL FILTERING =====
    // Handle Common Query Language (CQL) filter expressions
    var filterLang = "filter";  // Default filter language
    if (_query["filter-lang"]) {
      filterLang = _query["filter-lang"].replace(/^\W+|\W+$/g, ""); // Remove quotes
      delete _query["filter-lang"];
    }

    if (_query.filter) {
      // Parse CQL filter - currently only supports AND operations
      // Format: "attribute operator value and attribute2 operator value2"
      var filterParts = _query.filter.split(" and ");
      
      filterParts.forEach((element) => {
        // Parse each filter part: "attribute operator value"
        var ao = element.split(" ", 2);
        var attributeName = ao[0];
        var operator = ao[1];
        var tv = ao.join(" ") + " ";
        var targetValue = element.slice(tv.length).replace(/^\W+|\W+$/g, ""); // Remove quotes

        // Currently only equality operator is supported
        if (operator != "eq")
          return callback(
            {
              httpCode: 400,
              code: `Invalid operator: ${operator}`,
              description: "Valid operators are: eq",
            },
            undefined
          );

        // Apply the filter to the features
        features = features.filter(
          (element) => element.properties[attributeName] == targetValue
        );
      });

      delete _query.filter;
    }

    // ===== GEOMETRY SIMPLIFICATION (OAPIF P7) =====
    // Simplify geometries based on zoom level for better performance at different scales
    if (_query["zoom-level"]) {
      let zoomLevel = Number(_query["zoom-level"]);
      let tolerance = zoomLevel;  // Use zoom level as simplification tolerance
      
      features.forEach((feature) => {
        var options = {};
        options.tolerance = tolerance;
        options.highQuality = false;  // Faster but less accurate simplification
        options.mutate = true;        // Modify the feature in place
        feature = turf.simplify(feature, options);
      });
      delete _query["zoom-level"];
    }

    // ===== TEXT SEARCH (OAPIF P9) =====
    // (OAPIF P9) Recommendation 1: The q operator SHOULD, at least, be applied to the following resource properties if present:
    // - title, description, keywords
    if (_query.q) {
      // Parse text search query according to OAPIF P9 requirements:
      // Req 1: Single search term - resources containing that term in any text field
      // Req 2: Comma-separated terms (logical OR) - resources containing any of the terms
      // Req 3: Space-separated terms - resources containing all terms in order
      var queryParts = _query.q.split(",");
      
      // TODO: Implement text search logic based on the parsed query parts
      // This would typically search through title, description, and keyword fields
      
      delete _query.q;
    }

    // ===== SORTING (OAPIF P8) =====
    // (OAPIF P8) Requirement 6A: If the sortby parameter is specified, then the resources in a response SHALL be ordered by
    //            the keys and sort directions (i.e. ascending or descending) specified.
    //            Requirement 6B: The specific set of keys that may be used for sorting SHALL be specified by
    //            the /collections/{collectionId}/sortables resource.
    if (_query.sortby) {
      // Parse sortby parameter - supports multiple fields with direction indicators
      // Pattern: '[+|-]?[A-Za-z_].*' (e.g., "+name,-date", "name", "-id")
      let sortByParts = _query.sortby.split(",");

      /**
       * Creates a multi-field sorting function
       * 
       * @param {Array} fields - Array of field names with optional direction indicators
       * @returns {Function} Sorting function for Array.sort()
       */
      function fieldSorter(fields) {
        return function (a, b) {
          return fields
            .map(function (o) {
              // Parse direction indicator: + (ascending, default) or - (descending)
              var dir = 1; // Default to ascending
              if (o[0] === "-") {
                dir = -1;  // Descending
                o = o.substring(1);
              } else if (o[0] === "+") {
                dir = 1;   // Ascending (explicit)
                o = o.substring(1);
              }
              
              // Compare values and apply direction
              if (a.properties[o] > b.properties[o]) return dir;
              if (a.properties[o] < b.properties[o]) return -dir;
              return 0;  // Equal values
            })
            .reduce(function firstNonZeroValue(p, n) {
              // Return the first non-zero comparison result (for multi-field sorting)
              return p ? p : n;
            }, 0);
        };
      }

      // Apply sorting to the features array
      features.sort(fieldSorter(sortByParts));

      delete _query.sortby;
    }

    // ===== RESPONSE MODIFICATION FLAGS =====
    // Set flags for post-processing the response
    if (_query.skipGeometry === "true") doSkipGeometry = true;
    delete _query.skipGeometry;

    // Parse property selection for response filtering
    if (_query.properties) doProperties = _query.properties.split(",");
    delete _query.properties;

    // ===== ATTRIBUTE-BASED FILTERING =====
    // Handle direct attribute queries (e.g., ?name=value&type=category)
    // TODO: Consider using JSONPath Plus for more advanced querying: https://github.com/JSONPath-Plus/JSONPath
    for (var attributeName in _query) {
      // Validate that the attribute is queryable according to the collection schema
      const hasAttribute = attributeName in collection.queryables;
      if (hasAttribute) {
        var targetValue = _query[attributeName];
        features = features.filter(
          (element) => element.properties[attributeName] == targetValue
        );
      } else {
        // Reject unknown query parameters
        return callback(
          {
            httpCode: 400,
            code: `The following query parameters are rejected: ${attributeName}`,
            description:
              "Valid parameters for this request are " + collection.queryables,
          },
          undefined
        );
      }
    }
  }

  // ===== PAGINATION AND RESPONSE PREPARATION =====
  
  // Set the total number of features that matched the query (before pagination)
  content.numberMatched = features.length;

  // Apply pagination if options are provided
  if (options)
    content.features = features.slice(
      options.offset,
      options.offset + options.limit
    );
  else 
    content.features = features;

  // ===== POST-PROCESSING =====
  
  // Remove geometry from features if requested (for lightweight responses)
  if (doSkipGeometry)
    features.forEach(function (feature) {
      delete feature.geometry;
    });

  // Filter properties to only include requested ones (OAPIF P6: Property Selection)
  if (doProperties.length > 0) {
    features.forEach(function (feature) {
      for (var propertyName in feature.properties)
        if (!doProperties.includes(propertyName))
          delete feature.properties[propertyName];
    });
  }

  // Set the number of features actually returned in this response
  content.numberReturned = content.features.length;

  // Add pagination links if there are more results available
  if (options.offset + options.limit < content.numberMatched)
    getPaginationLinks(content.links, options);

  // Return the processed response
  return callback(undefined, content);
}

/**
 * Module exports
 * 
 * Provides the main functions for handling OGC API Features items requests
 */
export default {
  get,        // Main function for retrieving and processing feature items
  getContent, // Helper function for creating base content structure
};
