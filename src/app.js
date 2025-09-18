/**
 * OGC API Features & Processes Express Application
 * 
 * This module sets up and configures the Express.js application for serving
 * OGC API Features and OGC API Processes endpoints. It implements multiple
 * OGC API standards including:
 * - OGC API Features Part 1 (Core)
 * - OGC API Features Part 3 (Filtering)
 * - OGC API Features Part 4 (Create, Replace, Update and Delete)
 * - OGC API Features Part 5 (Schema)
 * - OGC API Processes Part 1 (Core)
 * 
 * The application follows OGC API Common standards and implements
 * cross-origin resource sharing (CORS) for browser compatibility.
 * 
 * @author Geonovum
 * @version 1.2.3
 * @since 2024
 */

// Core Express.js imports
import express, { json } from "express";
import cors from "cors";
import morgan from "morgan";
import { major } from "semver";
import favicon from "serve-favicon";
import { join } from "path";
import YAML from "yaml";
import { readFileSync } from "fs";

// Custom middleware imports
import { options as mwOptions } from "./middlewares/options.js";
import encodings from "./middlewares/encodings.js";
import apiVersion from "./middlewares/apiversion.js";

// Route imports for different OGC API parts
import oapifp1 from "./routes/ogcapiFeaturesPart1.js";  // OGC API Features Part 1 - Core
import oapifp3 from "./routes/ogcapiFeaturesPart3.js";  // OGC API Features Part 3 - Filtering
import oapifp4 from "./routes/ogcapiFeaturesPart4.js";  // OGC API Features Part 4 - CRUD
import oapifp5 from "./routes/ogcapiFeaturesPart5.js";  // OGC API Features Part 5 - Schema
import oapipp1 from "./routes/ogcapiProcessesPart1Core.js"; // OGC API Processes Part 1 - Core

/**
 * Express application instance
 * Exported for use in index.js and testing
 */
export const app = express();

// Get current directory for ES modules (requires Node.js 20.16+)
const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

/**
 * Load Configuration from YAML
 * Reads the local.config.yml file and parses it into global.config
 * This configuration includes server settings, metadata, and API options
 */
const configPath = join(__dirname, "..");
const yamlStr = readFileSync(join(configPath, `local.config.yml`));
global.config = YAML.parse(yamlStr.toString());

/**
 * Environment Configuration
 * Sets default values for environment variables if not provided
 */
global.config.server.id    = global.config.server.id    || process.env.ID        || "demoservice";  // Service identifier for URL path
global.config.server.host  = global.config.server.host  || process.env.HOST      || "0.0.0.0";
global.config.server.port  = global.config.server.port  || process.env.PORT      || 8080;           // Server port
global.config.server.limit = global.config.server.limit || process.env.LIMIT     || 10;             // Default limit for pagination
global.config.api.version  = global.config.api.version  || process.env.VERSION   || "1.2.3";        // API version number
global.config.data.path    = global.config.data.path    || process.env.DATA_PATH;                   // Data path

/**
 * Middleware Configuration
 * Sets up various middleware components for the Express application
 */

// HTTP Request Logging
// Uses Morgan to log HTTP requests with method, URL, and response time
app.use(
  morgan(":method :url :response-time", {
    stream: { write: (msg) => console.log(msg) },
  })
);

// JSON Pretty Printing
// Enables pretty-printed JSON responses when configured
if (global.config.server && global.config.server.prettyPrint)
  app.set("json spaces", 2); // TODO: only when running DEBUG

// CORS (Cross-Origin Resource Sharing) Configuration
// Implements OGC API requirements for browser compatibility
// (OAPIF P1) 7.5 Servers implementing CORS will implement the method OPTIONS, too.
// (OAPIF P1) 7.8 Recommendation 5 If the server is intended to be accessed from the browser,
//         cross-origin requests SHOULD be supported.
//         Note that support can also be added in a proxy layer on top of the server.
// (OAPIC P1) 8.5 Support for Cross-Origin Requests
if (global.config.server && global.config.server.cors) app.use(cors()); // Enable All CORS Requests

// View Engine Configuration
// Sets up Pug template engine for HTML rendering
app.set("view engine", global.config.server.viewEngine || "pug");
app.set("views", join(__dirname, "views"));

// Static File Serving
// Serves favicon and other static assets from the public directory
app.use(favicon(join(__dirname, "public", "images", "favicon.ico")));
app.use(express.static(join(__dirname, "public")));

// JSON Body Parsing
// Enables parsing of JSON request bodies
app.use(json());

// Security Headers
// Controls the X-Powered-By header for security reasons
// No need to tell the world what tools we are using, it only gives
// out information to not-so-nice people
if (global.config.server && global.config.server["x-powered-by"])
  app.enable("x-powered-by");
else app.disable("x-powered-by");

// Custom Middleware
// Content-type encoding middleware for OGC API compliance
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings);

// API Version Header Middleware
// (ADR) /core/version-header: Return the full version number in a response header
// https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/version-header
app.use(apiVersion);

/**
 * API Route Configuration
 * Sets up the service root path and mounts all OGC API route handlers
 */

// Service Root Path Configuration
// (ADR) /core/uri-version: Include the major version number in the URI
// https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/uri-version
// Creates a versioned API path like /demoservice/v1
app.serviceRoot = `/${global.config.server.id}/v${major(global.config.api.version)}`;

//console.log(`serviceRoot ${serviceRoot}`)

/**
 * Mount OGC API Route Handlers
 * Each route handler implements a specific part of the OGC API standards
 */
app.use(app.serviceRoot, oapifp1);  // OGC API Features Part 1 - Core endpoints
app.use(app.serviceRoot, oapifp3);  // OGC API Features Part 3 - Filtering capabilities
app.use(app.serviceRoot, oapifp4);  // OGC API Features Part 4 - CRUD operations
app.use(app.serviceRoot, oapifp5);  // OGC API Features Part 5 - Schema definitions
app.use(app.serviceRoot, oapipp1);  // OGC API Processes Part 1 - Core process endpoints

/**
 * Global Error Handler
 * Handles requests that don't match any defined routes
 * (ADR) /core/http-methods: Only apply standard HTTP methods
 * https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/http-methods
 */
app.use((req, res) => {
  res
    .status(405)
    .json({ code: "Method Not Allowed", description: "Not allowed" });
});
