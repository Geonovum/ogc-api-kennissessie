import accepts from "accepts";
import output from "../../models/processes/output.js";
import utils from "../../utils/utils.js";

export function get(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  var jobId = req.params.jobId;
  var outputId = req.params.outputId;

  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var serviceUrl = utils.getServiceUrl(req);

  var accept = accepts(req);
  var format = accept.type(["json", "html"]);

  output.get(formatFreeUrl, format, jobId, outputId, function (err, content) {
    if (err) {
      res
        .status(err.httpCode)
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
      case `html`:
        // Recommendations 10, Links included in payload of responses SHOULD also be
        // included as Link headers in the HTTP response according to RFC 8288, Clause 3.
        // This recommendation does not apply, if there are a large number of links included
        // in a response or a link is not known when the HTTP headers of the response are created.
        res.status(200).render(`results`, { content, serviceUrl });
        break;
      default:
        res.status(400).json({
          code: "InvalidParameterValue",
          description: `${accept} is an invalid format`,
        });
    }
  });
}
