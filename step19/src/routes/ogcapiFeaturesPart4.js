const router = require('express').Router()

const collection  = require('../controllers/collection')
const items       = require('../controllers/items')
const item        = require('../controllers/item')

router.post('/collections/:collectionId/items', collection.create)
router.put('/collections/:collectionId/items/:featureId', item.replacee)
router.delete('/collections/:collectionId/items/:featureId', item.deletee)
router.patch('/collections/:collectionId/items/:featureId', item.update)
router.options('/collections/:collectionId/items', items.options)
router.options('/collections/:collectionId/items/:featureId', item.options)

module.exports = router