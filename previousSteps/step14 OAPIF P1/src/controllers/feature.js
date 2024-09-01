import accepts from "accepts";
import feature from "../models/feature.js";
import utils from "../utils/utils.js";

export function get(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var collectionId = req.params.collectionId;
  var featureId = req.params.featureId;

  var formatFreeUrl = utils.getFormatFreeUrl(req);

  var accept = accepts(req);
  var format = accept.type(["geojson", "json", "html", "csv"]);

  feature.get(
    formatFreeUrl,
    format,
    collectionId,
    featureId,
    req.query,
    function (err, content) {
      if (err) {
        res
          .status(err.httpCode)
          .json({ code: err.code, description: err.description });
        return;
      }

      switch (format) {
        case "json":
        case "geojson":
          res.status(200).json(content);
          break;
        case `html`:
          res.status(200).render(`feature`, content);
          break;
        case "csv":
          res.set("Content-Type", utils.getTypeFromFormat(format));
          res.set(
            "Content-Disposition",
            `inline; filename="${featureId}.csv"`
          );
          res.send(geojson2csv(content));
        default:
          res
            .status(400)
            .json({
              code: "InvalidParameterValue",
              description: `${accept} is an invalid format`,
            });
      }
    }
  );
}

export function options(req, res) {
  res.set("allow", "GET, HEAD, PUT, PATCH, DELETE");
}
