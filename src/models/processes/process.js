import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getProcesses } from "../../database/processes.js";

function getLinks(neutralUrl, format, links) {
  function getTypeFromFormat(format) {
    var _formats = ["json", "html"];
    var _encodings = ["application/json", "text/html"];

    var i = _formats.indexOf(format);
    return _encodings[i];
  }

  links.push({
    href: urlJoin(neutralUrl),
    rel: `self`,
    type: getTypeFromFormat(format),
    title: `Process description as ${format}`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: getTypeFromFormat(altFormat),
      title: `Process description as ${altFormat}`,
    });
  });

  let serviceUrl = neutralUrl.substring(0, neutralUrl.indexOf("processes"));

  links.push({
    href: urlJoin(serviceUrl, "jobs?f=html"),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/job-list`,
    type: "text/html",
    title: `Jobs list as HTML`,
  });
  links.push({
    href: urlJoin(serviceUrl, "jobs?f=json"),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/job-list`,
    type: "application/json",
    title: `Jobs list as JSON`,
  });

  links.push({
    href: urlJoin(neutralUrl, "execution"),
    rel: `http://www.opengis.net/def/rel/ogc/1.0/execute`,
    title: `Execute endpoint`,
  });
}

export function getContent(neutralUrl, format, processId, process_) {
  var content = {};
  content.id = process_.id;
  content.title = process_.title;
  content.description = process_.description;
  content.version = process_.version;
  content.jobControlOptions = process_.jobControlOptions;
  content.outputTransmission = process_.outputTransmission;

  content.inputs = process_.inputs;
  content.outputs = process_.outputs;

  content.links = [];

  getLinks(neutralUrl, format, content.links);

  return content;
}

export function get(neutralUrl, format, processId, callback) {
  var processes = getProcesses();
  var process_ = processes[processId];
  if (!process_)
    return callback(
      {
        httpCode: 404,
        code: `Process not found: ${processId}`,
        description: "Make sure you use an existing processId. See /processes",
      },
      undefined
    );

  var content = getContent(neutralUrl, format, processId, process_);

  return callback(undefined, content);
}

export default {
  get,
  getContent,
};
