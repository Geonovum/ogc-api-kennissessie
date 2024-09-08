import urlJoin from 'url-join'
import utils from '../../utils/utils.js'
import { getProcesses } from '../../database/processes.js'

function getLinks(neutralUrl, format, name, links) {  

  function getTypeFromFormat(format) {
    var _formats = ['json', 'html']
    var _encodings = ['application/json', 'text/html']
  
    var i = _formats.indexOf(format);
    return _encodings[i]
  }

  links.push({ href: urlJoin(neutralUrl, name, ), type: getTypeFromFormat(format), rel: `self`, title: `process description as ${format}` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    links.push({ href: urlJoin(neutralUrl, name, `?f=${altFormat}`), rel: `alternate`, type: getTypeFromFormat(altFormat), title: `Process description as ${altFormat}` })
  })

  let serviceUrl = neutralUrl.substring(0, neutralUrl.indexOf('processes'));

  links.push({ href: urlJoin(serviceUrl, 'jobs?f=html'), rel: `http://www.opengis.net/def/rel/ogc/1.0/job-list`, type: 'text/html', title: `Jobs list as HTML` })
  links.push({ href: urlJoin(serviceUrl, 'jobs?f=json'), rel: `http://www.opengis.net/def/rel/ogc/1.0/job-list`, type: 'application/json', title: `Jobs list as JSON` })

  links.push({ href: urlJoin(neutralUrl, name, 'execution'), rel: `http://www.opengis.net/def/rel/ogc/1.0/execute`, title: `Execute endpoint` })
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