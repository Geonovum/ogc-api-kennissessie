const router = require('express').Router()

const collection  = require('../controllers/collection')

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/queryables', collection.getQueryables)

module.exports = router