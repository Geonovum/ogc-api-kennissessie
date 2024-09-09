import express from "express";

import { get as getQueryables } from "../controllers/common/collections/queryables.js";

const router = express.Router();

// (OAPIF P3) Requirement 2A: The Queryables resource SHALL support the HTTP GET operation
//            and the media type application/schema+json.
router.get("/collections/:collectionId/queryables", getQueryables);

export default router;
