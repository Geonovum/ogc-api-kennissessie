import accepts from "accepts";
import feature from "../../models/features/feature.js";
import utils from "../../utils/utils.js";
import { getDatabases } from "../../database/database.js";

export function get(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var collectionId = req.params.collectionId;
  var featureId = req.params.featureId;

  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var serviceUrl = utils.getServiceUrl(req);

  var accept = accepts(req);
  var format = accept.type(["geojson", "json", "html", "csv"]);

  var collections = getDatabases();
  var collection = collections[collectionId];

  feature.get(
    formatFreeUrl,
    format,
    collection,
    featureId,
    req.query,
    function (err, content) {
      if (err) {
        res
          .status(err.httpCode)
          .json({ code: err.code, description: err.description });
        return;
      }

      // (OAPIF P2) Requirement 16: Content-Crs
      if (content.headerContentCrs)
        res.set("Content-Crs", `<${content.headerContentCrs}>`);
      delete content.headerContentCrs;

      // use the feature etag or last-modified
      if (global.config.server.locking.optimistic == "etag")
        res.set("ETag", content.etag);
      if (global.config.server.locking.optimistic == "timestamps")
        res.set("Last-Modified", content.lastModified.toUTCString());

      switch (format) {
        case "json":
        case "geojson":
          res.status(200).json(content);
          break;
        case `html`:
          res.status(200).render(`feature`, { content, serviceUrl });
          break;
        case "csv":
          res.removeHeader("Content-Crs");
          res.set("Content-Type", utils.getTypeFromFormat(format));
          res.set("Content-Disposition", `inline; filename="${featureId}.csv"`);
          res.send(geojson2csv(content));
        default:
          res.status(400).json({
            code: "InvalidParameterValue",
            description: `${accept} is an invalid format`,
          });
      }
    }
  );
}

export function replacee(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var collectionId = req.params.collectionId;
  var featureId = req.params.featureId;

  var formatFreeUrl = utils.getFormatFreeUrl(req);

  var accept = accepts(req);
  var format = accept.type(["geojson", "json", "html"]);

  var collections = getDatabases();
  var collection = collections[collectionId];

  feature.replacee(
    formatFreeUrl,
    collection,
    featureId,
    req.body,
    function (err, feature, resourceUrl) {
      if (err) {
        res
          .status(err.httpCode)
          .json({ code: err.code, description: err.description });
        return;
      }

      if (!doOptimisticLocking(req, res, feature)) return;

      if (global.config.server.locking.optimistic == "etag")
        res.set("ETag", feature.etag);
      if (global.config.server.locking.optimistic == "timestamps")
        res.set("Last-Modified", feature.lastModified.toUTCString());

      res.status(204).end();
    }
  );
}

export function deletee(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var collectionId = req.params.collectionId;
  var featureId = req.params.featureId;

  var collections = getDatabases();
  var collection = collections[collectionId];

  feature.deletee(collection, featureId, function (err, content) {
    if (err) {
      res
        .status(err.httpCode)
        .json({ code: err.code, description: err.description });
      return;
    }

    if (global.config.server.locking.optimistic == "etag")
      res.set("ETag", collection.etag);
    if (global.config.server.locking.optimistic == "timestamps")
      res.set("Last-Modified", collection.lastModified.toUTCString());

    // (OAPI P4) Requirement 14A: A successful execution of the operation SHALL be reported as a response with a HTTP status code 200 or 204.
    res.status(204).end();
  });
}

export function update(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var collectionId = req.params.collectionId;
  var featureId = req.params.featureId;

  var collections = getDatabases();
  var collection = collections[collectionId];

  feature.update(
    collection,
    featureId,
    req.body,
    function (err, feature, modified) {
      if (err) {
        res
          .status(err.httpCode)
          .json({ code: err.code, description: err.description });
        return;
      }

      if (!doOptimisticLocking(req, res, feature)) return;

      if (global.config.server.locking.optimistic == "etag")
        res.set("ETag", feature.etag);
      if (global.config.server.locking.optimistic == "timestamps")
        res.set("Last-Modified", feature.lastModified.toUTCString());

      res.status(modified ? 200 : 204).json(feature);
    }
  );
}

export function options(req, res) {
  res.set("allow", "GET, HEAD, PUT, PATCH, DELETE");
}

function doOptimisticLocking(req, res, feature) {
  if (!global.config.server.locking.required) return true;
  if (!global.config.server.locking.optimistic) return true;

  // 8.2 Optimistic locking using timestamps ------------------------
  if (global.config.server.locking.optimistic == "timestamps") {
    // 8.2.3 Conditional processing
    var ius = req.headers["if-unmodified-since"];
    // Requirement 25
    if (ius) {
      // Requirement 28
      var iusDate = new Date(ius)
      iusDate.setMilliseconds(0)

      if (iusDate.getTime() < feature.lastModified.getTime()) {
        // Permission 9
        res.status(412).end(); // Precondition Failed
        return false;
      }
    } else {
      if (global.config.server.locking.required) {
        // Permission 9, condition A
        res.status(428).end();
        //res.status(409).end();
        return false;
      }
    }
  }
  // 8.3 Optimistic locking with ETags ------------------------------
  else if (global.config.server.locking.optimistic == "etag") {
    var im = req.headers["if-match"];
    if (im) {
      if (im != feature.etag) {
        res.status(412).end(); // Precondition Failed
        return false;
      }
    } else {
      if (global.config.server.locking.required) {
        // Permission 10
        res.status(428).end();
        //res.status(409).end();
        return false;
      }
    }
  } else {
    res.status(428).end();
    //res.status(409).end();
    return false;
  }

  return true;
}
