import urlJoin from 'url-join'
import utils from '../../utils/utils.js'
import { getProcesses } from '../../database/processes.js'

function getLinks(neutralUrl, format, name, links) {  
  links.push({ href: urlJoin(neutralUrl, name, ), type: 'application/json', rel: `self`, title: `process description` })
}

function getContent(neutralUrl, format, name, document) {

  var content = {}
  content.id = document.id
  content.title = document.title
  content.description = document.description
  content.version = document.version
  content.jobControlOptions = document.jobControlOptions
  content.outputTransmission = document.outputTransmission

  content.links = []

  getLinks(neutralUrl, format, name, content.links)

  return content
}

function get(neutralUrl, format, callback) {

  var content = {};

  content.links = []
  // (OAPIC P2) Requirement 2B. The API SHALL support the HTTP GET operation on all links to a Collections Resource that have the relation type
  content.links.push({ href: urlJoin(neutralUrl, `f=${format}`), rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    content.links.push({ href: urlJoin(neutralUrl, `f=${altFormat}`), rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
  })

  content.processes = [];

  var processes = getProcesses()

  // get content per :process
  for (var name in processes) {
    var process = getContent(neutralUrl, format, name, processes[name])
    content.processes.push(process);
  }

  return callback(undefined, content);
}

export default {
  get,
}