const router = require('express').Router()

const collection  = require('../controllers/collection')
const items       = require('../controllers/items')
const item        = require('../controllers/item')

router.post('/collections/:collectionId/items', collection.create)
router.put('/collections/:collectionId/items/:itemId', item.replacee)
router.delete('/collections/:collectionId/items/:itemId', item.deletee)
router.patch('/collections/:collectionId/items/:itemId', item.update)
router.options('/collections/:collectionId/items', items.options)
router.options('/collections/:collectionId/items/:itemId', item.options)

module.exports = router