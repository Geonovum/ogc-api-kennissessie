import urlJoin from "url-join";
import utils from "../../utils/utils.js";
import { getProcesses } from "../../database/processes.js";
import { getContent as getProcessContent } from "./process.js";

function getLinks(neutralUrl, format, links) {
  links.push({
    href: urlJoin(neutralUrl, `?f=${format}`),
    rel: `self`,
    type: utils.getTypeFromFormat(format),
    title: `This document`,
  });
  utils.getAlternateFormats(format, ["json", "html"]).forEach((altFormat) => {
    links.push({
      href: urlJoin(neutralUrl, `?f=${altFormat}`),
      rel: `alternate`,
      type: utils.getTypeFromFormat(altFormat),
      title: `This document as ${altFormat}`,
    });
  });

}

function get(neutralUrl, format, callback) {
  var content = {};

  content.links = [];
  getLinks(neutralUrl, format, content.links)

  content.processes = [];

  var processes = getProcesses();

  for (var name in processes) {
    var process = getProcessContent(urlJoin(neutralUrl, name), format, name, processes[name]);
    content.processes.push(process);
  }

  return callback(undefined, content);
}

export default {
  get,
};
