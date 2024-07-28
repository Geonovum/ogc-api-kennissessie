const router = require('express').Router()

import { create } from '../controllers/collection.js'
import { options } from '../controllers/items.js'
import { replacee, deletee, update, options as _options } from '../controllers/item.js'

router.post('/collections/:collectionId/items', create)
router.put('/collections/:collectionId/items/:featureId', replacee)
router.delete('/collections/:collectionId/items/:featureId', deletee)
router.patch('/collections/:collectionId/items/:featureId', update)
router.options('/collections/:collectionId/items', options)
router.options('/collections/:collectionId/items/:featureId', _options)

export default router