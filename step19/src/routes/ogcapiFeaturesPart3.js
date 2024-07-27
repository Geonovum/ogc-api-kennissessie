const router = require('express').Router()
const asyncHandler = require('express-async-handler');

const queryables  = require('../controllers/queryables')

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/queryables.:ext?', asyncHandler(queryables.get))

module.exports = router