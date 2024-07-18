var path = require('path');
var url = require('url');

//-------------------------------------------------------------------
// interpret all incoming requests before moving to the route handler
//-------------------------------------------------------------------

// http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings

// This standard does not mandate any encoding or format for representing 
// features or feature collections. In addition to HTML as the standard 
// encoding for Web content, rules for commonly used encodings for spatial 
// data on the web are provided (GeoJSON, GML).

// None of these encodings is mandatory and an implementation of the Core 
// requirements class may implement none of them but implement another encoding instead.

// Support for HTML is recommended as HTML is the core language of the World Wide Web. 
// A server that supports HTML will support browsing the data with a web browser 
// and will enable search engines to crawl and index the dataset.

// GeoJSON is a commonly used format that is simple to understand and 
// well supported by tools and software libraries. Since most Web developers 
// are comfortable with using a JSON-based format, this version of 
// OGC API Features recommends supporting GeoJSON for encoding feature data, 
// if the feature data can be represented in GeoJSON for the intended use.

// Note:
//   Two common approaches are:
//   - an additional path for each encoding of each resource
//     (this can be expressed, for example, using format 
//     specific suffixes like '.html');
//   - an additional query parameter (for example, 'accept' or 'f')
//     that overrides the Accept header of the HTTP request.

var encodings = function(req, res, next) {

  var mediaType = req.query.f 
               || req.query.accept 
               || path.extname(req.path).replace(/^\./, '') 

  delete req.query.f; 
  delete req.query.accept; 

  if (mediaType)
  {
    if (['json', 'application/json'].includes(mediaType))
      req.headers['accept'] = 'application/json,' + req.headers['accept'] 
    else if (['html', 'text/html'].includes(mediaType))
      req.headers['accept'] = 'text/html,' + req.headers['accept'] 
    else {
      res.status(400).json(`{'code': 'InvalidParameterValue', 'description': '${mediaType}' is an invalid format'}`)
      return
    }
  }

  next()
}

module.exports = encodings