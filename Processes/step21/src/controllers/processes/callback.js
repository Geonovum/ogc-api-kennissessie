import accepts from "accepts";
import callback from "../../models/processes/callback.js";
import utils from "../../utils/utils.js";

export function post(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var queryParams = ["type"];
  var rejected = utils.checkForAllowedQueryParams(req.query, queryParams);
  if (rejected.length > 0) {
    res
      .status(400)
      .json({
        code: `The following query parameters are rejected: ${rejected}`,
        description: "Valid parameters for this request are " + queryParams,
      });
    return;
  }

  var jobId = req.params.jobId;

  var formatFreeUrl = utils.getFormatFreeUrl(req);

  var accept = accepts(req);
  var format = accept.type(["json"]);

  callback.post(formatFreeUrl, jobId, req.query, function (err, content) {
    if (err) {
      res
        .status(err.code)
        .json({ code: err.code, description: err.description });
      return;
    }

    switch (format) {
      case "json":
        // Recommendations 10, Links included in payload of responses SHOULD also be
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        // This recommendation does not apply, if there are a large number of links included
        // in a response or a link is not known when the HTTP headers of the response are created.
        res.status(200).json(content);
        break;
      default:
        res
          .status(400)
          .json({
            code: "InvalidParameterValue",
            description: `${accept} is an invalid format`,
          });
    }
  });
}
