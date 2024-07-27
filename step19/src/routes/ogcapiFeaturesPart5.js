const router = require('express').Router()

const schema  = require('../controllers/schema')
const sortables  = require('../controllers/sortables')

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/schema', schema.get)
router.get('/collections/:collectionId/sortables', sortables.get)

module.exports = router