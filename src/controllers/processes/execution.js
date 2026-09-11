import accepts from "accepts";
import execution from "../../models/processes/execution.js";
import utils from "../../utils/utils.js";
import { sendProcessException } from "../../models/processes/exceptions.js";

export function post(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var queryParams = ["f"];
  var rejected = utils.checkForAllowedQueryParams(req.query, queryParams);
  if (rejected.length > 0) {
    res.status(400).json({
      type: "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/invalid-parameter",
      title: "invalid-parameter",
      status: 400,
      detail: `The following query parameters are rejected: ${rejected}`,
    });
    return;
  }

  var processId = req.params.processId;
  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var accept = accepts(req);
  var format = accept.type(["json"]);
  var prefer = req.get("Prefer") || "";

  execution.post(
    formatFreeUrl,
    processId,
    req.body,
    prefer,
    function (err, result) {
      if (err) {
        sendProcessException(res, err);
        return;
      }

      if (result.location) res.set("Location", result.location);
      if (result.monitor)
        res.set("Link", `<${result.monitor}>; rel="monitor"`);
      if (result.preferenceApplied)
        res.set("Preference-Applied", result.preferenceApplied);

      switch (format) {
        case "json":
          res.status(result.httpStatus).json(result.content);
          break;
        default:
          res.status(400).json({
            type: "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/invalid-parameter",
            title: "invalid-parameter",
            status: 400,
            detail: `${accept} is an invalid format`,
          });
      }
    }
  );
}
