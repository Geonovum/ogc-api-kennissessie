const router = require('express').Router()
const asyncHandler = require('express-async-handler');

const collection  = require('../controllers/collection')
const items       = require('../controllers/items')
const item        = require('../controllers/item')

// On Items
router.post   ('/collections/:collectionId/items', asyncHandler(collection.create))
router.options('/collections/:collectionId/items', asyncHandler(items.options))

// On Items/{featureId}
router.put    ('/collections/:collectionId/items/:featureId', asyncHandler(item.replacee))
router.delete ('/collections/:collectionId/items/:featureId', asyncHandler(item.deletee))
router.patch  ('/collections/:collectionId/items/:featureId', asyncHandler(item.update))
router.options('/collections/:collectionId/items/:featureId', asyncHandler(item.options))


module.exports = router