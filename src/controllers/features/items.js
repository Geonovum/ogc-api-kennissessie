import accepts from "accepts";
import feature from "../../models/features/feature.js";
import items from "../../models/features/items.js";
import geojson2csv from "../../utils/csv.js";
import utils from "../../utils/utils.js";

export function get(req, res, next) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var collectionId = req.params.collectionId;

  if (!utils.checkNumeric(req.query.offset, "offset", res)) return;
  if (!utils.checkNumeric(req.query.limit, "limit", res)) return;

  var options = {};
  options.offset = Number(req.query.offset) || 0;
  options.limit = Number(req.query.limit) || Number(process.env.LIMIT);

  // remve not to be confused with other query parameters
  delete req.query.offset;
  delete req.query.limit;

  var accept = accepts(req);
  var format = accept.type(["json", "geojson", "html", "csv"]);

  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var serviceUrl = utils.getServiceUrl(req);

  items.get(
    formatFreeUrl,
    format,
    collectionId,
    req.query,
    options,
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

      switch (format) {
        case "json":
        case "geojson":
          res.status(200).json(content);
          break;
        case `html`:
          res.status(200).render(`items`, { content, serviceUrl });
          break;
        case "csv":
          res.removeHeader("Content-Crs");
          res.set("Content-Type", utils.getTypeFromFormat(format));
          res.set(
            "Content-Disposition",
            `inline; filename="${collectionId}.csv"`
          );
          res.send(geojson2csv(content));
          break;
        default:
          res.status(400).json({
            code: "InvalidParameterValue",
            description: `${accept} is an invalid format`,
          });
      }
    }
  );
}

export function create(req, res) {
  // check Content-Crs

  var collectionId = req.params.collectionId;

  var formatFreeUrl = utils.getFormatFreeUrl(req);

  var accept = accepts(req);
  var format = accept.type(["geojson", "json", "html"]);

  feature.create(
    formatFreeUrl,
    collectionId,
    req.body,
    function (err, content, locationUri) {
      if (err) {
        res
          .status(err.httpCode)
          .json({ code: err.code, description: err.description });
        return;
      }

      // (OAPIF P4) Requirememt 6B: A response with HTTP status code 201 SHALL include a Location header
      //           with the URI of the newly added resource (i.e. path of the resource endpoint).
      res.set("location", locationUri);
      // (OAPIF P4) Requirememt 6A: A successful execution of the operation SHALL be reported as a response with a HTTP status code 201.
      res.status(201).end();
    }
  );
}

export function options(req, res) {
  res.set("allow", "GET, HEAD, POST");
}
