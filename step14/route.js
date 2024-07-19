var router = require('express').Router()
var database = require('./database')

var landingPage = require('./controllers/landingPage')
var conformance = require('./controllers/conformance')
var collections = require('./controllers/collections')
var collection  = require('./controllers/collection')
var items       = require('./controllers/items')
var item        = require('./controllers/item')
//
var api         = require('./controllers/api')

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
  console.log('Time: ', new Date().toISOString())
  next()
})

// 7.5 The server SHOULD support the HTTP 1.1 method HEAD for all 
// resources that support the method GET.

// The app.get() function is automatically called for the HTTP HEAD method 
// in addition to the GET method if app.head() was not called for the path 
// before app.get().

// Requirement 7 A, Express.js conforms to HTTP 1.1 (no HTTPS for the moment)
// Recommendation 2 A, The server SHOULD support the HTTP 1.1 method HEAD for all resources that support the method GET.

// Requirement 1 A: The server SHALL support the HTTP GET operation at the path /
// (ext in index.js)
router.get('/.:ext?', landingPage.get)

// Requirement 5 A: The server SHALL support the HTTP GET operation at the path /conformance
router.get('/conformance.:ext?', conformance.get)

// Requirement 11 A: The server SHALL support the HTTP GET operation at the path /collections.
router.get('/collections.:ext?', collections.get)

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId.:ext?', collection.get)

// For every feature collection identified in the feature collections response (path /collections), 
// the server SHALL support the HTTP GET operation at the path /collections/{collectionId}/items.
router.get('/collections/:collectionId/items.:ext?', items.get)

// For every feature in a feature collection (path /collections/{collectionId}), 
// the server SHALL support the HTTP GET operation at the path /collections/{collectionId}/items/{featureId}.
router.get('/collections/:collectionId/items/:featureId', item.get)

// Every OGC Web API is expected to provide a definition that describes the capabilities of the 
// server and which can be used by developers to understand the API, by software clients to connect 
// to the server, or by development tools to support the implementation of servers and clients.
// Requirement 3 and Permission 1
router.get('/api.:ext?', api.get)

module.exports = router