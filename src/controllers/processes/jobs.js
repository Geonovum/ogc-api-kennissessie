import accepts from "accepts";
import jobs from "../../models/processes/jobs.js";
import utils from "../../utils/utils.js";
import { sendProcessException } from "../../models/processes/exceptions.js";

function toArray(value) {
  if (value === undefined || value === "") return [];
  var raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalInteger(value, name) {
  if (value === undefined || value === "")
    return { ok: true, value: undefined };
  var raw = Array.isArray(value) ? value[0] : value;
  if (isNaN(raw) || String(raw).trim() === "")
    return { ok: false, name };
  var parsed = Number(raw);
  if (!Number.isInteger(parsed)) return { ok: false, name };
  return { ok: true, value: parsed };
}

export function get(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

  // (OAPIP) Job-list query parameters: type, processID, status, datetime,
  //         minDuration, maxDuration, limit. offset is used for next links.
  var queryParams = [
    "f",
    "type",
    "processID",
    "status",
    "datetime",
    "minDuration",
    "maxDuration",
    "limit",
    "offset",
  ];
  var rejected = utils.checkForAllowedQueryParams(req.query, queryParams);
  if (rejected.length > 0) {
    res.status(400).json({
      code: `The following query parameters are rejected: ${rejected}`,
      description: "Valid parameters for this request are " + queryParams,
    });
    return;
  }

  var limitResult = optionalInteger(req.query.limit, "limit");
  var offsetResult = optionalInteger(req.query.offset, "offset");
  var minDurationResult = optionalInteger(req.query.minDuration, "minDuration");
  var maxDurationResult = optionalInteger(req.query.maxDuration, "maxDuration");

  var invalid = [limitResult, offsetResult, minDurationResult, maxDurationResult]
    .find((item) => !item.ok);
  if (invalid) {
    res.status(400).json({
      code: "InvalidParameterValue",
      description: `Parameter ${invalid.name} must be an integer`,
    });
    return;
  }

  var defaultLimit = Number(global.config.server.limit) || 10;
  var limit = limitResult.value === undefined ? defaultLimit : limitResult.value;
  var offset = offsetResult.value === undefined ? 0 : offsetResult.value;

  if (limit < 1) {
    res.status(400).json({
      code: "InvalidParameterValue",
      description: "Parameter limit must be at least 1",
    });
    return;
  }
  if (offset < 0) {
    res.status(400).json({
      code: "InvalidParameterValue",
      description: "Parameter offset must be at least 0",
    });
    return;
  }

  // (OAPIP) Req 77 B / Per 8: cap at the advertised maximum
  if (limit > jobs.MAX_LIMIT) limit = jobs.MAX_LIMIT;

  var query = {
    type: toArray(req.query.type),
    processID: toArray(req.query.processID),
    status: toArray(req.query.status),
    datetime: req.query.datetime,
    minDuration: minDurationResult.value,
    maxDuration: maxDurationResult.value,
    limit,
    offset,
  };

  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var serviceUrl = utils.getServiceUrl(req);

  var accept = accepts(req);
  var format = accept.type(["json", "html"]);

  jobs.get(formatFreeUrl, format, query, function (err, content) {
    if (err) {
      sendProcessException(res, err);
      return;
    }

    // (OAPIP) Req 78: successful job-list is HTTP 200
    switch (format) {
      case "json":
        res.set("link", utils.makeHeaderLinks(content.links));
        res.status(200).json(content);
        break;
      case `html`:
        res.set("link", utils.makeHeaderLinks(content.links));
        res.status(200).render(`jobs`, { content, serviceUrl });
        break;
      default:
        res.status(400).json({
          code: "InvalidParameterValue",
          description: `${accept} is an invalid format`,
        });
    }
  });
}

export function post(req, res) {
  if (utils.ifTrailingSlash(req, res)) return;

  res.status(200).end();
}

export function deleteAll(req, res) {
  if (utils.ifTrailingSlash(req, res)) return;

  jobs.deleteAll();
  res.status(204).end();
}
