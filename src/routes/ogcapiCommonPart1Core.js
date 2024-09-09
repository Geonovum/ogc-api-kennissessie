import express from "express";

import { get as getLandingPage } from "../controllers/common/core/landingPage.js";
import { get as getConformance } from "../controllers/common/core/conformance.js";

import { get as getAPI } from "../controllers/common/core/api.js";

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
router.get("/", getLandingPage);

// (OAPIF P1) Requirement 5 A: The server SHALL support the HTTP GET operation at the path /conformance
router.get("/conformance", getConformance);

// Every OGC Web API is expected to provide a definition that describes the capabilities of the
// server and which can be used by developers to understand the API, by software clients to connect
// to the server, or by development tools to support the implementation of servers and clients.
// Requirement 3 and Permission 1
router.get("/api.:ext?", getAPI);

export default router;
