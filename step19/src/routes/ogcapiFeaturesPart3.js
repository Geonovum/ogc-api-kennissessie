const router = require('express').Router()

const queryables  = require('../controllers/queryables')

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/queryables', queryables.get)

module.exports = router