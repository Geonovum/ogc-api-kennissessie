import express from "express";

import { get as getCollection } from "../controllers/features/collection.js";
import { get as getItems } from "../controllers/features/items.js";
import { get as getFeature } from "../controllers/features/feature.js";

const router = express.Router();

// 7.5 The server SHOULD support the HTTP 1.1 method HEAD for all
// resources that support the method GET.

//    The app.get() function is automatically called for the HTTP HEAD method
//    in addition to the GET method if app.head() was not called for the path
//    before app.get().

// Requirement 7 A, Express.js conforms to HTTP 1.1 (no HTTPS for the moment)
// Recommendation 2 A, The server SHOULD support the HTTP 1.1 method HEAD for all resources that support the method GET.

// (OAPIF P1) Requirement 1 A: The server SHALL support the HTTP GET operation at the path /

// OGC API Features Part 1 - Core

// OGC API Common Part 1 - Core
// See src/routes/ogcapiCommonPart1Core.js

// The server SHALL support the HTTP GET operation at the path /collections/{collectionId}.
router.get("/collections/:collectionId", getCollection);

// For every feature collection identified in the feature collections response (path /collections),
// the server SHALL support the HTTP GET operation at the path /collections/{collectionId}/items.
router.get("/collections/:collectionId/items", getItems);

// For every feature in a feature collection (path /collections/{collectionId}),
// the server SHALL support the HTTP GET operation at the path /collections/{collectionId}/items/{featureId}.
router.get("/collections/:collectionId/items/:featureId", getFeature);

export default router;
