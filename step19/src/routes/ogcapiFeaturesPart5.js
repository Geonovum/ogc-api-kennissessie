const router = require('express').Router()

import { get as getSchema } from '../controllers/schema.js'
import { get as getSortables } from '../controllers/sortables.js'

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/schema', getSchema)
router.get('/collections/:collectionId/sortables', getSortables)

export default router