import accepts from "accepts";
import processes from "../../models/processes/processes.js";
import utils from "../../utils/utils.js";
import { sendProcessException } from "../../models/processes/exceptions.js";

export function get(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  // (OAPIP) Req 9: limit on GET /processes
  var queryParams = ["f", "limit", "offset"];
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

  if (!utils.checkNumeric(req.query.limit, "limit", res)) return;
  if (!utils.checkNumeric(req.query.offset, "offset", res)) return;

  var defaultLimit = Number(global.config.server.limit) || 10;
  var limit = req.query.limit === undefined ? defaultLimit : Number(req.query.limit);
  var offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

  if (limit < 1) {
    res.status(400).json({
      type: "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/invalid-parameter",
      title: "invalid-parameter",
      status: 400,
      detail: "Parameter limit must be at least 1",
    });
    return;
  }
  if (offset < 0) {
    res.status(400).json({
      type: "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/invalid-parameter",
      title: "invalid-parameter",
      status: 400,
      detail: "Parameter offset must be at least 0",
    });
    return;
  }
  if (limit > processes.MAX_LIMIT) limit = processes.MAX_LIMIT;

  var query = { limit, offset };

  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var serviceUrl = utils.getServiceUrl(req);

  var accept = accepts(req);
  var format = accept.type(["json", "html"]);

  processes.get(formatFreeUrl, format, query, function (err, content) {
    if (err) {
      sendProcessException(res, err);
      return;
    }

    switch (format) {
      case "json":
        res.set("link", utils.makeHeaderLinks(content.links));
        res.status(200).json(content);
        break;
      case `html`:
        res.set("link", utils.makeHeaderLinks(content.links));
        res.status(200).render(`processes`, { content, serviceUrl });
        break;
      default:
        res.status(400).json({
          type: "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/invalid-parameter",
          title: "invalid-parameter",
          status: 400,
          detail: `${accept} is an invalid format`,
        });
    }
  });
}
