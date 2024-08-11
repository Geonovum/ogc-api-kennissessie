import * as turf from "@turf/turf";
import { JSONPath } from "jsonpath-plus";
import urlJoin from "url-join";
import { getDatabases } from "../database/database.js";
import utils from "../utils/utils.js";
import projgeojson from "../utils/proj4.js";

var dates = {
  convert: function (d) {
    // Converts the date in d to a date-object. The input can be:
    //   a date object: returned without modification
    //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
    //   a number     : Interpreted as number of milliseconds
    //                  since 1 Jan 1970 (a timestamp)
    //   a string     : Any format supported by the javascript engine, like
    //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
    //  an object     : Interpreted as an object with year, month and date
    //                  attributes.  **NOTE** month is 0-11.
    return d.constructor === Date
      ? d
      : d.constructor === Array
      ? new Date(d[0], d[1], d[2])
      : d.constructor === Number
      ? new Date(d)
      : d.constructor === String
      ? new Date(d)
      : typeof d === "object"
      ? new Date(d.year, d.month, d.date)
      : NaN;
  },
  compare: function (a, b) {
    // Compare two dates (could be of any type supported by the convert
    // function above) and returns:
    //  -1 : if a < b
    //   0 : if a = b
    //   1 : if a > b
    // NaN : if a or b is an illegal date
    // NOTE: The code inside isFinite does an assignment (=).
    return isFinite((a = this.convert(a).valueOf())) &&
      isFinite((b = this.convert(b).valueOf()))
      ? (a > b) - (a < b)
      : NaN;
  },
  inRange: function (d, start, end) {
    // Checks if date in d is between dates in start and end.
    // Returns a boolean or NaN:
    //    true  : if d is between start and end (inclusive)
    //    false : if d is before start or after end
    //    NaN   : if one or more of the dates is illegal.
    // NOTE: The code inside isFinite does an assignment (=).
    return isFinite((d = this.convert(d).valueOf())) &&
      isFinite((start = this.convert(start).valueOf())) &&
      isFinite((end = this.convert(end).valueOf()))
      ? start <= d && d <= end
      : NaN;
  },
  until: function (d, end) {
    // Checks if date in d is between dates in start and end.
    // Returns a boolean or NaN:
    //    true  : if d is between start and end (inclusive)
    //    false : if d is before start or after end
    //    NaN   : if one or more of the dates is illegal.
    // NOTE: The code inside isFinite does an assignment (=).
    return isFinite((d = this.convert(d).valueOf())) &&
      isFinite((end = this.convert(end).valueOf()))
      ? d <= end
      : NaN;
  },
  from: function (d, start) {
    // Checks if date in d is between dates in start and end.
    // Returns a boolean or NaN:
    //    true  : if d is between start and end (inclusive)
    //    false : if d is before start or after end
    //    NaN   : if one or more of the dates is illegal.
    // NOTE: The code inside isFinite does an assignment (=).
    return isFinite((d = this.convert(d).valueOf())) &&
      isFinite((start = this.convert(start).valueOf()))
      ? start <= d
      : NaN;
  },
};

function getPaginationLinks(links, options) {
  // Use the self link as the basis for 'first', 'next' and 'previous'
  var paginationBase = links.filter((l) => l.rel === "self")[0];

  // First
  if (options.offset > 0)
    links.push({
      href: paginationBase.href,
      rel: `first`,
      type: paginationBase.type,
      title: `First page`,
    });

  // Next
  links.push({
    href:
      `${paginationBase.href}&offset=${options.offset + options.limit}` +
      (options.limit == process.env.LIMIT ? "" : `&limit=${options.limit}`),
    rel: `next`,
    type: paginationBase.type,
    title: `Next page`,
  });

  // Previous
  var offset = options.offset - options.limit;
  if (offset < 0) offset = 0;
  if (options.offset != 0)
    links.push({
      href:
        `${paginationBase.href}&offset=${offset}` +
        (options.limit == process.env.LIMIT ? "" : `&limit=${options.limit}`),
      rel: `prev`,
      type: paginationBase.type,
      title: `Previous page`,
    });
}

function getLinks(neutralUrl, format, links) {
  function getTypeFromFormat(format) {
    var _formats = ["json", "html", "csv"];
    var _encodings = ["application/geo+json", "text/html", "text/csv"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Access the features in the collection as ${format}`,
  });
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

function getContent(neutralUrl, format, collection) {
  if (format == "geojson") format = "json";

  var items = {}
  items.type = collection.type
  items.features = collection.features
  items.defaultSortOrder = ["+fid"]
  items.timeStamp = new Date().toISOString()
  items.links = []

  getLinks(neutralUrl, format, items.links)

  items.headerContentCrs = collection.crs[0]

  return items;
}

function get(neutralUrl, format, collectionId, query, options, callback) {
  var collections = getDatabases();
  var collection = collections[collectionId];
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

  var queryParams = [
    "f",
    "crs",
    "bbox",
    "bbox-crs",
    "limit",
    "offset",
    "datetime",
    "filter",
    "filter-crs",
    "filter-lang",
    "skipGeometry",
    "properties", // Part 6: Property Selection
    "featuresLimit",
    "sortby",
    "zoom-level", // Part 7: Geometry Simplification
    "q", // Part 9: Text Search
  ];
  // All attributes from schema can be queried
  for (var attributeName in collection.schema)
    if (collection.schema[attributeName]["x-ogc-role"] != "primary-geometry")
      queryParams.push(attributeName);
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

  var content = getContent(neutralUrl, format, collection);

  // make local copy to do subtraction (limit, offset, bbox,...) on
  //var features = content.features
  var features = structuredClone(content.features); // deep copy for skipGeometry (i don't understand for the moment)

  var doSkipGeometry = false;
  var doProperties = [];

  var _query = query;
  if (_query) {
    // simple queries that limit the features go on top. Its better to have the complex (geo) queries on smaller features collections
    if (_query.datetime) {
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

      // find the datetime property in the schema
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
      if (datetimeAttribName == undefined)
        return callback(
          {
            httpCode: 400,
            code: `Bad Request`,
            description: `datetime query requested, but no datetime field in database`,
          },
          undefined
        );

      // (OAPIF C) Requirement 26 Only features that have a temporal geometry that intersects the temporal information in the datetime
      //           parameter SHALL be part of the result set, if the parameter is provided.
      // check if we have temporal geometry (aka fields in the properties)
      // (what with features that have no temperal geometry??)

      if (datetimes.length == 1) {
        features = features.filter(
          (element) =>
            dates.compare(
              element.properties[datetimeAttribName].toString(),
              datetimes[0]
            ) == 0
        );
      } else {
        var beginDate = datetimes[0];
        var endDate = datetimes[1];
        if (beginDate != ".." && endDate != "..") {
          // bounded
          features = features.filter((element) =>
            dates.inRange(
              element.properties[datetimeAttribName].toString(),
              datetimes[0],
              datetimes[1]
            )
          );
        } else if (beginDate == ".." && endDate != "..") {
          // half-bounded [.., date]
          features = features.filter((element) =>
            dates.until(
              element.properties[datetimeAttribName].toString(),
              datetimes[1]
            )
          );
        } else if (beginDate != ".." && endDate == "..") {
          // half-bounded [date, ..]
          features = features.filter((element) =>
            dates.from(
              element.properties[datetimeAttribName].toString(),
              datetimes[0]
            )
          );
        } else if (beginDate == ".." && endDate == "..") {
          // non-bounded [.., ..] - everything passes
          // no filter
        }
      }
      delete _query.datetime;
    }

    // (OAPIF P1) Requirement 23A The operation SHALL support a parameter bbox
    // (OAPIF P2) Requirement 6 Each GET request on a 'features' resource SHALL support a query parameter bbox-crs
    if (_query.bbox) {
      var corners = _query.bbox.split(","); //
      var bbox = turf.bboxPolygon(corners);

      if (_query["bbox-crs"]) {
        // Assumption that content comes in WGS84
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

      //      features.forEach((feature) => {if (!booleanWithin(feature, bbox))   console.log(feature)})

      features = features.filter((feature) =>
        turf.booleanWithin(feature, bbox)
      );

      delete _query.bbox;
    }

    if (_query.crs) {
      var toEpsg = utils.UriToEPSG(query.crs);
      features = projgeojson.projectFeatureCollection(
        features,
        "EPSG:4326",
        toEpsg
      );
      if (features == undefined)
        return callback(
          {
            httpCode: 400,
            code: `Bad Request`,
            description: `Invalid operator: ${query.crs}`,
          },
          undefined
        );

      content.headerContentCrs = query.crs;
      delete _query.crs;
    }

    var filterLang = "filter";
    if (_query["filter-lang"]) {
      filterLang = _query["filter-lang"].replace(/^\W+|\W+$/g, ""); // removes ' at start and end
      delete _query["filter-lang"];
    }

    if (_query.filter) {
      var parts = _query.filter.split(" and "); // only AND supported (not OR)
      parts.forEach((element) => {
        var ao = element.split(" ", 2);
        var attributeName = ao[0];
        var operator = ao[1];
        var tv = ao.join(" ") + " ";
        var targetValue = element.slice(tv.length).replace(/^\W+|\W+$/g, ""); // removes ' at start and end

        if (operator != "eq")
          return callback(
            {
              httpCode: 400,
              code: `Invalid operator: ${operator}`,
              description: "Valid operators are: eq",
            },
            undefined
          );

        features = features.filter(
          (element) => element.properties[attributeName] == targetValue
        );
      });

      delete _query.filter;
    }

    if (_query["zoom-level"]) {
      let zoomLevel = Number(_query["zoom-level"]);
      let tolerance = zoomLevel;
      features.forEach((feature) => {
        var options = {};
        options.tolerance = tolerance;
        options.highQuality = false;
        options.mutate = true;
        feature = turf.simplify(feature, options);
      });
      delete _query["zoom-level"];
    }

    // (OAPIF P8) Recommendation 1 The q operator SHOULD, at least, be applied to the following resource properties if present:
    // - title
    // - description
    // - keywords
    if (_query["q"]) {
      // Req 1: If a single search term is specified, then only resources that contain that search term in one or
      //        more of the searched text fields SHALL be in the result set.
      // Req 2: For multiple search terms that are comma separated (logical OR), only resources that contain one
      //        or more the specified search terms in one or more of the searched text fields SHALL be in the result set.
      // Req 3: For multiple search terms that are white space separated, only resources that contain all the search terms
      //        specified, in the order specified and separated by any number of white spaces in one or more of the
      //        searched text fields SHALL be in the result set.
      var parts = _query["q"].split(",");

      delete _query["q"];
    }

    if (_query["sortby"]) {
      // (OAPIF P8) Requirement 6A: If the sortby parameter is specified, then the resources in a response SHALL be ordered by
      //            the keys and sort directions (i.e. ascending or descending) specified.
      //            Requirement 6B: The specific set of keys that may be used for sorting SHALL be specified by
      //            the /collections/{collectionId}/sortables resource.

      // (OAPIF P8) At a sortable resource endpoint, the operation SHALL support a parameter sortby with the following
      //            characteristics (using an OpenAPI Specification 3.0 fragment):
      //            -     pattern: '[+|-]?[A-Za-z_].*'
      let parts = _query["sortby"].split(",");

      function fieldSorter(fields) {
        return function (a, b) {
          return fields
            .map(function (o) {
              // `Req 5B: The default sort order SHALL be ascending (i.e. +).
              var dir = 1; // +
              if (o[0] === "-") {
                dir = -1;
                o = o.substring(1);
              } else if (o[0] === "+") {
                dir = 1;
                o = o.substring(1);
              }
              if (a.properties[o] > b.properties[o]) return dir;
              if (a.properties[o] < b.properties[o]) return -dir;
              return 0;
            })
            .reduce(function firstNonZeroValue(p, n) {
              return p ? p : n;
            }, 0);
        };
      }

      features.sort(fieldSorter(parts));

      delete _query["sortby"];
    }

    if (_query.skipGeometry === "true") doSkipGeometry = true;
    delete _query.skipGeometry;

    if (_query.properties) doProperties = _query.properties.split(",");
    delete _query.properties;

    // Filter parameters as query (TODO: using JSONPath Plus, https://github.com/JSONPath-Plus/JSONPath)
    for (var attributeName in _query) {
      // is attribute part of the queryables?
      const hasAttribute = attributeName in collection.queryables;
      if (hasAttribute) {
        var targetValue = _query[attributeName];
        features = features.filter(
          (element) => element.properties[attributeName] == targetValue
        );
      } else
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

  content.numberMatched = features.length;

  if (options)
    content.features = features.slice(
      options.offset,
      options.offset + options.limit
    );
  else content.features = features;

  if (doSkipGeometry)
    features.forEach(function (feature) {
      delete feature.geometry;
    });

  if (doProperties.length > 0) {
    features.forEach(function (feature) {
      for (var propertyName in feature.properties)
        if (!doProperties.includes(propertyName))
          delete feature.properties[propertyName];
    });
  }

  content.numberReturned = content.features.length;

  // Pagination
  if (options.offset + options.limit < content.numberMatched)
    getPaginationLinks(content.links, options);

  return callback(undefined, content);
}

export default {
  get,
  getContent,
};
