import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getProcesses, deleteProcess } from "../../database/processes.js";
import exceptions, { processException } from "./exceptions.js";

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
  if (process_.example) content.example = process_.example;

  content.links = [];

  getLinks(neutralUrl, format, content.links);

  return content;
}

export function getSummary(neutralUrl, format, processId, process_) {
  var content = getContent(neutralUrl, format, processId, process_);
  delete content.inputs;
  delete content.outputs;
  delete content.example;
  return content;
}

export function get(neutralUrl, format, processId, callback) {
  var processes = getProcesses();
  var process_ = processes[processId];
  if (!process_)
    return callback(
      processException(
        404,
        exceptions.NO_SUCH_PROCESS,
        "Make sure you use an existing processId. See /processes"
      ),
      undefined
    );

  var content = getContent(neutralUrl, format, processId, process_);

  return callback(undefined, content);
}

export function delete_(processId, callback) {
  var result = deleteProcess(processId);
  if (!result.ok)
    return callback(
      processException(
        result.httpCode,
        result.httpCode === 404
          ? exceptions.NO_SUCH_PROCESS
          : result.httpCode === 400
            ? exceptions.INVALID_PARAMETER
            : exceptions.SERVER_ERROR,
        result.description
      )
    );

  return callback(undefined, {});
}

export default {
  get,
  delete_,
  getContent,
  getSummary,
};
