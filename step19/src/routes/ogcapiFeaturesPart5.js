const router = require('express').Router()
const asyncHandler = require('express-async-handler');

const schema  = require('../controllers/schema')
const sortables  = require('../controllers/sortables')

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/schema.:ext?', asyncHandler(schema.get))
router.get('/collections/:collectionId/sortables.:ext?', asyncHandler(sortables.get))

module.exports = router