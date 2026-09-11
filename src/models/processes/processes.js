import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getProcesses } from "../../database/processes.js";
import { getSummary as getProcessSummary } from "./process.js";

const MAX_LIMIT = 10000;

function withQuery(neutralUrl, params) {
  var url = new URL(neutralUrl);
  Object.keys(params).forEach((key) => {
    var value = params[key];
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function listQueryParams(format, query, extra) {
  var params = { f: format, limit: query.limit };
  if (query.offset > 0) params.offset = query.offset;
  return Object.assign(params, extra || {});
}

function getLinks(neutralUrl, format, query, links) {
  links.push({
    href: withQuery(neutralUrl, listQueryParams(format, query)),
    rel: `self`,
    type: utils.getTypeFromFormat(format),
    title: `This document`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: withQuery(neutralUrl, listQueryParams(altFormat, query)),
      rel: `alternate`,
      type: utils.getTypeFromFormat(altFormat),
      title: `This document as ${altFormat}`,
    });
  });
}

function addPaginationLinks(links, neutralUrl, format, query, numberMatched) {
  if (query.offset + query.limit < numberMatched) {
    links.push({
      href: withQuery(
        neutralUrl,
        listQueryParams(format, query, { offset: query.offset + query.limit })
      ),
      rel: `next`,
      type: utils.getTypeFromFormat(format),
      title: `Next page of processes`,
    });
  }

  if (query.offset > 0) {
    links.push({
      href: withQuery(
        neutralUrl,
        listQueryParams(format, query, {
          offset: Math.max(0, query.offset - query.limit),
        })
      ),
      rel: `prev`,
      type: utils.getTypeFromFormat(format),
      title: `Previous page of processes`,
    });
  }
}

function get(neutralUrl, format, query, callback) {
  var content = {};
  content.links = [];
  getLinks(neutralUrl, format, query, content.links);

  var processes = getProcesses();
  var summaries = [];

  for (var name in processes) {
    summaries.push(
      getProcessSummary(urlJoin(neutralUrl, name), format, name, processes[name])
    );
  }

  // (OAPIP) Req 10: do not return more process summaries than limit
  content.processes = summaries.slice(
    query.offset,
    query.offset + query.limit
  );

  addPaginationLinks(content.links, neutralUrl, format, query, summaries.length);

  return callback(undefined, content);
}

export default {
  get,
  MAX_LIMIT,
};
