import express from "express";

import { get as getCollections } from "../controllers/common/collections/collections.js";

const router = express.Router();

// 7.5 The server SHOULD support the HTTP 1.1 method HEAD for all
// resources that support the method GET.

//    The app.get() function is automatically called for the HTTP HEAD method
//    in addition to the GET method if app.head() was not called for the path
//    before app.get().

// Requirement 7 A, Express.js conforms to HTTP 1.1 (no HTTPS for the moment)
// Recommendation 2 A, The server SHOULD support the HTTP 1.1 method HEAD for all resources that support the method GET.

// OGC API Common Part 2 - Collections

// (OAPIF P1) Requirement 11 A: The server SHALL support the HTTP GET operation at the path /collections.
// (OAPIC P2) Recommendation 1: An implementation of the /Collections Requirements Class SHOULD also
//            implement the Core Conformance Class defined in OGC API - Common Part 1.
// (OAPIC P2) Recommendation 2: An implementation of the /Collections Requirements Class SHOULD also
//            implement the Landing Page Conformance Class defined in OGC API - Common Part 1.
// (OAPIC P2) Requirement 2A. The API SHALL support the HTTP GET operation at the path /collections
router.get("/collections", getCollections);

export default router;
