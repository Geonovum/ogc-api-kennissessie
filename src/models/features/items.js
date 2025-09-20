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
 * @param {number} totalMatched - Total number of features that matched the query
 */
function getPaginationLinks(links, options, totalMatched) {
  // Use the self link as the basis for 'first', 'next' and 'previous'
  var paginationBase = links.filter((l) => l.rel === "self")[0];
  
  if (!paginationBase) return;

  // Helper function to build URL with pagination parameters
  function buildPaginationUrl(offset, limit) {
    var url = new URL(paginationBase.href);
    url.searchParams.set('offset', offset);
    if (limit !== global.config.server.limit) {
      url.searchParams.set('limit', limit);
    }
    return url.toString();
  }

  // Add 'first' link if not on the first page
  if (options.offset > 0) {
    links.push({
      href: buildPaginationUrl(0, options.limit),
      rel: `first`,
      type: paginationBase.type,
      title: `First page`,
    });
  }

  // Add 'previous' link if not on the first page
  if (options.offset > 0) {
    var prevOffset = Math.max(0, options.offset - options.limit);
    links.push({
      href: buildPaginationUrl(prevOffset, options.limit),
      rel: `prev`,
      type: paginationBase.type,
      title: `Previous page`,
    });
  }

  // Add 'next' link if there are more results
  if (options.offset + options.limit < totalMatched) {
    links.push({
      href: buildPaginationUrl(options.offset + options.limit, options.limit),
      rel: `next`,
      type: paginationBase.type,
      title: `Next page`,
    });
  }

  // Add 'last' link if we're not on the last page
  if (options.offset + options.limit < totalMatched) {
    var lastOffset = Math.floor((totalMatched - 1) / options.limit) * options.limit;
    links.push({
      href: buildPaginationUrl(lastOffset, options.limit),
      rel: `last`,
      type: paginationBase.type,
      title: `Last page`,
    });
  }
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
 * @param {Object} options - Pagination options to include in self link
 */
function getLinks(neutralUrl, format, links, options) {
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

  // Build self link with current pagination parameters
  let selfUrl = neutralUrl + `?f=${format}`;
  if (options && (options.offset > 0 || options.limit !== global.config.server.limit)) {
    selfUrl += `&offset=${options.offset}`;
    if (options.limit !== global.config.server.limit) {
      selfUrl += `&limit=${options.limit}`;
    }
  }

  // Add self link for the current format
  links.push({
    href: selfUrl,
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Access the features in the collection as ${format}`,
  });
  
  // Add alternate links for other supported formats
  utils
    .getAlternateFormats(format, ["json", "html", "csv"])
    .forEach((altFormat) => {
      let altUrl = neutralUrl + `?f=${altFormat}`;
      if (options && (options.offset > 0 || options.limit !== global.config.server.limit)) {
        altUrl += `&offset=${options.offset}`;
        if (options.limit !== global.config.server.limit) {
          altUrl += `&limit=${options.limit}`;
        }
      }
      
      links.push({
        href: altUrl,
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
function getContent(neutralUrl, format, collection, options) {
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
  getLinks(neutralUrl, format, items.links, options);

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
  var content = getContent(neutralUrl, format, collection, options);

  // Create a shallow copy of features for processing
  // This is necessary because we'll be modifying the features array with filters,
  // and we need to preserve the original for potential geometry operations
  // Using shallow copy is much faster than structuredClone for large datasets
  var features = content.features.slice();

  // Initialize flags for post-processing
  var doSkipGeometry = false;  // Whether to remove geometry from response
  var doProperties = [];       // Properties to include in response

  var _query = query;
  if (_query) {
    // Pre-compute filter conditions to avoid repeated calculations
    var filterConditions = [];
    var datetimeAttribName = null;
    var bbox = null;
    
    // Cache frequently accessed collection properties for better performance
    var collectionSchema = collection.schema;
    var collectionQueryables = collection.queryables;
    
    // ===== PREPARE TEMPORAL FILTERING =====
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
      for (var attributeName in collectionSchema) {
        var value = collectionSchema[attributeName];
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

      // Prepare temporal filter condition
      if (datetimes.length == 1) {
        // Single date: exact match
        filterConditions.push((element) =>
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
          filterConditions.push((element) =>
            utils.dates.inRange(
              element.properties[datetimeAttribName].toString(),
              datetimes[0],
              datetimes[1]
            )
          );
        } else if (beginDate == ".." && endDate != "..") {
          // Half-bounded: [.., endDate] - everything before endDate
          filterConditions.push((element) =>
            utils.dates.until(
              element.properties[datetimeAttribName].toString(),
              datetimes[1]
            )
          );
        } else if (beginDate != ".." && endDate == "..") {
          // Half-bounded: [beginDate, ..] - everything after beginDate
          filterConditions.push((element) =>
            utils.dates.from(
              element.properties[datetimeAttribName].toString(),
              datetimes[0]
            )
          );
        }
        // Non-bounded: [.., ..] - no temporal filtering (all features pass)
      }
      delete _query.datetime;
    }

    // ===== PREPARE SPATIAL FILTERING (BOUNDING BOX) =====
    if (_query.bbox) {
      // Parse bounding box coordinates (minx,miny,maxx,maxy)
      var corners = _query.bbox.split(",");
      bbox = turf.bboxPolygon(corners);

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

      // Prepare spatial filter condition
      filterConditions.push((feature) => turf.booleanWithin(feature, bbox));
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

    // ===== PREPARE CQL FILTERING =====
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

        // Add CQL filter condition
        filterConditions.push(
          (element) => element.properties[attributeName] == targetValue
        );
      });

      delete _query.filter;
    }

    // ===== PREPARE GEOMETRY SIMPLIFICATION (OAPIF P7) =====
    // Defer geometry simplification until after filtering for better performance
    var zoomLevel = null;
    if (_query["zoom-level"]) {
      zoomLevel = Number(_query["zoom-level"]);
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

    // ===== PREPARE SORTING (OAPIF P8) =====
    // Parse sorting parameters but defer execution until after filtering
    var sortByParts = null;
    if (_query.sortby) {
      // Parse sortby parameter - supports multiple fields with direction indicators
      // Pattern: '[+|-]?[A-Za-z_].*' (e.g., "+name,-date", "name", "-id")
      sortByParts = _query.sortby.split(",");
      delete _query.sortby;
    }

    // ===== RESPONSE MODIFICATION FLAGS =====
    // Set flags for post-processing the response
    if (_query.skipGeometry === "true") doSkipGeometry = true;
    delete _query.skipGeometry;

    // Parse property selection for response filtering
    if (_query.properties) doProperties = _query.properties.split(",");
    delete _query.properties;

    // ===== PREPARE ATTRIBUTE-BASED FILTERING =====
    // Handle direct attribute queries (e.g., ?name=value&type=category)
    // TODO: Consider using JSONPath Plus for more advanced querying: https://github.com/JSONPath-Plus/JSONPath
    for (var attributeName in _query) {
      // Validate that the attribute is queryable according to the collection schema
      const hasAttribute = attributeName in collectionQueryables;
      if (hasAttribute) {
        var targetValue = _query[attributeName];
        filterConditions.push(
          (element) => element.properties[attributeName] == targetValue
        );
      } else {
        // Reject unknown query parameters
        return callback(
          {
            httpCode: 400,
            code: `The following query parameters are rejected: ${attributeName}`,
            description:
              "Valid parameters for this request are " + collectionQueryables,
          },
          undefined
        );
      }
    }

    // ===== APPLY ALL FILTERS IN SINGLE PASS =====
    // This is much more efficient than chaining multiple filter operations
    if (filterConditions.length > 0) {
      features = features.filter((feature) => {
        // All filter conditions must pass (AND logic)
        return filterConditions.every(condition => condition(feature));
      });
    }

    // ===== APPLY SORTING AFTER FILTERING =====
    // Sort the filtered results for better performance
    if (sortByParts) {
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

      // Apply sorting to the filtered features array
      features.sort(fieldSorter(sortByParts));
    }

    // ===== APPLY GEOMETRY SIMPLIFICATION AFTER FILTERING =====
    // Simplify geometries only for the filtered results
    if (zoomLevel !== null) {
      let tolerance = zoomLevel;  // Use zoom level as simplification tolerance
      
      // Pre-create options object to avoid repeated object creation
      var options = {
        tolerance: tolerance,
        highQuality: false,  // Faster but less accurate simplification
        mutate: true         // Modify the feature in place
      };
      
      // Use for loop instead of forEach for better performance
      for (let i = 0; i < features.length; i++) {
        features[i] = turf.simplify(features[i], options);
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

  // ===== SPATIAL EXTENT =====
  // Note: Spatial extent calculation moved to items.pug view for better separation of concerns
  
  // ===== POST-PROCESSING =====
  
  // Remove geometry from features if requested (for lightweight responses)
  if (doSkipGeometry) {
    for (let i = 0; i < features.length; i++) {
      delete features[i].geometry;
    }
  }

  // Filter properties to only include requested ones (OAPIF P6: Property Selection)
  if (doProperties.length > 0) {
    // Convert to Set for O(1) lookup performance
    const propertiesSet = new Set(doProperties);
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const properties = feature.properties;
      for (var propertyName in properties) {
        if (!propertiesSet.has(propertyName)) {
          delete properties[propertyName];
        }
      }
    }
  }

  // Set the number of features actually returned in this response
  content.numberReturned = content.features.length;

  // Add pagination links if there are more results available
  if (options && content.numberMatched > options.limit)
    getPaginationLinks(content.links, options, content.numberMatched);

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
