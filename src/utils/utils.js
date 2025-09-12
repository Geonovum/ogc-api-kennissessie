import { join } from "path";
import { networkInterfaces } from "os";

var _formats = ["json", "html", "csv"];
var _encodings = ["application/json", "text/html", "text/csv"];
var _encodingsItems = ["application/geo+json", "text/html", "text/csv"];

function getServiceUrl(req) {
  // remove the optional extension from the baseUrl
  var root = req.baseUrl.replace(/\.[^.]*$/, "");

  const proxyHost = req.headers["x-forwarded-host"];
  var host = proxyHost || req.headers.host;
  host = join(host, root);
  var serviceUrl = `${req.protocol}://${host}`;

  return new URL(serviceUrl);
}

function ISODateString(d) {
  function pad(n) {
    return n < 10 ? "0" + n : n;
  }
  return (
    d.getUTCFullYear() +
    "-" +
    pad(d.getUTCMonth() + 1) +
    "-" +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    ":" +
    pad(d.getUTCMinutes()) +
    ":" +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function makeHeaderLinks(hls) {
  var link = "";
  hls.forEach((hl) => {
    link += `<${hl.href}>; rel="${hl.rel}"; title="${hl.title}"; type="${hl.type}",`;
  });

  // remove last ,
  link = link.slice(0, -1);

  return link;
}

function getTypeFromFormat(format) {
  var i = _formats.indexOf(format);
  return _encodings[i];
}

function getTypeItemsFromFormat(format) {
  var i = _formats.indexOf(format);
  return _encodingsItems[i];
}

function getAlternateFormats(format, formats) {
  var alternateFormats = formats;
  alternateFormats = alternateFormats.filter((item) => {
    return item !== format;
  });

  return alternateFormats;
}

function UriToEPSG(uri) {
  if (uri == "http://www.opengis.net/def/crs/OGC/1.3/CRS84")
    uri = "https://www.opengis.net/def/crs/EPSG/0/4326";

  var parts = uri.split("/");
  var identifier = parts.pop();
  parts.pop();
  var body = parts.pop();
  return `${body}:${identifier}`;
}

function EPSGtoProj4(epsg) {
  return "+proj=sterea +lat_0=52.1561605555556 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.4171,50.3319,465.5524,1.9342,-1.6677,9.1019,4.0725 +units=m +no_defs +type=crs";
}

function ifTrailingSlash(req, res) {
  if (req.url.endsWith("/")) {
    res
      .status(404)
      .json({
        code: "Path contains a trailing slash",
        description: "A URI MUST never contain a trailing slash",
      });
    return true;
  }
  return false;
}

function checkForAllowedQueryParams(query, params) {
  var rejected = [];
  if (query && typeof query === 'object') {
    for (var propName in query) {
      if (Object.prototype.hasOwnProperty.call(query, propName))
        if (!params.includes(propName)) rejected.push(propName);
    }
  }
  return rejected;
}

function getFormatFreeUrl(req) {
  var root = req.baseUrl.replace(/\.[^.]*$/, "");

  const proxyHost = req.headers["x-forwarded-host"];
  var host = proxyHost || req.headers.host;
  host = join(host, root);

  var url = new URL(`${req.protocol}://${host}${req.path}`);
  /*
    for (var propName in req.query) {
      if (req.query.hasOwnProperty(propName))
        url.searchParams.append(propName, req.query[propName])
    }
  */
  return url.toString();
}

function checkNumeric(value, name, res) {
  if (value == undefined) return true;

  if (isNaN(value)) {
    res
      .status(400)
      .json({
        code: "Bad request",
        description: `Parameter value '${value}' is invalid for parameter '${name}': The value is not an integer.`,
      });
    return false;
  }

  return true;
}

// Function to get all bindable IPv4 addresses
function getBindableAddresses() {
  const interfaces = networkInterfaces();
  const addresses = [];
  
  for (const [name, nets] of Object.entries(interfaces)) {
    for (const net of nets) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (!net.internal && net.family === 'IPv4') {
        addresses.push({
          interface: name,
          address: net.address,
          family: net.family
        });
      }
    }
  }
  
  return addresses;
}

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

export default {
  getServiceUrl,
  ISODateString,
  makeHeaderLinks,
  UriToEPSG,
  getTypeFromFormat,
  getTypeItemsFromFormat,
  getAlternateFormats,
  ifTrailingSlash,
  getFormatFreeUrl,
  checkForAllowedQueryParams,
  checkNumeric,
  getBindableAddresses,
  dates,
};
