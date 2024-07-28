import express from 'express';

import { get as getQueryables } from '../controllers/queryables.js'

const router = express.Router();

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get('/collections/:collectionId/queryables', getQueryables)

export default router