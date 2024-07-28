const router = require('express').Router()

import { get as getQueryables } from '../controllers/queryables.js'

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/queryables', getQueryables)

export default router