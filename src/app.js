import express, { json } from "express";
import cors from "cors";
import morgan from "morgan";
import { major } from "semver";
import favicon from "serve-favicon";
import { join } from "path";
import YAML from "yaml";
import { readFileSync } from "fs";
import { options as mwOptions } from "./middlewares/options.js";
import encodings from "./middlewares/encodings.js";
import apiVersion from "./middlewares/apiversion.js";
import oapifp1 from "./routes/ogcapiFeaturesPart1.js";
import oapifp3 from "./routes/ogcapiFeaturesPart3.js";
import oapifp4 from "./routes/ogcapiFeaturesPart4.js";
import oapifp5 from "./routes/ogcapiFeaturesPart5.js";
import oapipp1 from "./routes/ogcapiProcessesPart1Core.js";

export const app = express();

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

process.env.ID = process.env.ID || "demoservice";
process.env.APIVERSION = process.env.APIVERSION || "1.2.3";
process.env.PORT = process.env.PORT || 8080;
process.env.LIMIT = process.env.LIMIT || 10;

const configPath = join(__dirname, "..");
const yamlStr = readFileSync(join(configPath, `local.config.yml`));
global.config = YAML.parse(yamlStr.toString());

app.use(
  morgan(":method :url :response-time", {
    stream: { write: (msg) => console.log(msg) },
  })
);

if (global.config.server && global.config.server.prettyPrint)
  app.set("json spaces", 2); // TODO: only when running DEBUG

// Deal with 'options' prior to cors,
app.options("*", mwOptions);

// (OAPIF P1) 7.5 Servers implementing CORS will implement the method OPTIONS, too.
// (OAPIF P1) 7.8 Recommendation 5 If the server is intended to be accessed from the browser,
//         cross-origin requests SHOULD be supported.
//         Note that support can also be added in a proxy layer on top of the server.
// (OAPIC P1) 8.5 Support for Cross-Origin Requests
if (global.config.server && global.config.server.cors) app.use(cors()); // Enable All CORS Requests

// For HTML rendering
app.set("view engine", global.config.server.viewEngine || "pug");
app.set("views", join(__dirname, "views"));

app.use(favicon(join(__dirname, "public", "images", "favicon.ico")));

//app.use(express.static(pathToSwaggerUi))
app.use(express.static(join(__dirname, "public")));
app.use(json());

// No need to tell the world what tools we are using, it only gives
// out information to not-so-nice people
if (global.config.server && global.config.server["x-powered-by"])
  app.enable("x-powered-by");
else app.disable("x-powered-by");

// setup middleware to decode the content-type
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings);
// (ADR) /core/version-header: Return the full version number in a response header
// https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/version-header
app.use(apiVersion);

// Mount API on this path
// (ADR) /core/uri-version: Include the major version number in the URI
// https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/uri-version
const serviceRoot = `/${process.env.ID}/v${major(process.env.APIVERSION)}`;

console.log(`serviceRoot ${serviceRoot}`)

app.use(serviceRoot, oapifp1);
app.use(serviceRoot, oapifp3);
app.use(serviceRoot, oapifp4);
app.use(serviceRoot, oapifp5);
app.use(serviceRoot, oapipp1);

// (ADR) /core/http-methods: Only apply standard HTTP methods
// https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/http-methods
app.all("*", function (req, res, next) {
  res
    .status(405)
    .json({ code: `Method Not Allowed`, description: `Not allowed` });
});
