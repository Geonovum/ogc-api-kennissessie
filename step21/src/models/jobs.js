import urlJoin from 'url-join'
import utils from '../utils/utils.js'
import { getJobs } from '../database/processes.js'

function getLinks(neutralUrl, format, name, links) {  

  function getTypeFromFormat(format) {
    var _formats = ['json', 'html']
    var _encodings = ['application/json', 'text/html']
  
    var i = _formats.indexOf(format);
    return _encodings[i]
  }

  links.push({ href: urlJoin(neutralUrl, name ), rel: `self`, title: `Job document` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    links.push({ href: urlJoin(neutralUrl, name, `?f=${altFormat}`), rel: `alternate`, type: getTypeFromFormat(altFormat), title: `Job Document as ${altFormat}` })
  })

}

function getContent(neutralUrl, format, name, document) {

  var content = {}
  content.jobID = 'name' // required
  content.status = 'accepted'
  content.message = 'process started'
  content.progress = 12
  content.created = '2024'

  content.links = []

  // Requirement 15 A and B
  getLinks(neutralUrl, format, name, content.links)

  return content
}

function get(neutralUrl, format, callback) {

  // (OAPIC P2) Requirement 3A: The content of that response SHALL be based upon the JSON schema collections.yaml.
  var content = {};
  // An optional title and description for the collection;
  content.title = global.config.title 
  content.description = global.config.description
  content.links = []
  // (OAPIC P2) Requirement 2B. The API SHALL support the HTTP GET operation on all links to a Collections Resource that have the relation type
  content.links.push({ href: urlJoin(neutralUrl, `f=${format}`), rel: `self`, type: utils.getTypeFromFormat(format), title: `This document` })
  utils.getAlternateFormats(format, ['json', 'html']).forEach(altFormat => {
    content.links.push({ href: urlJoin(neutralUrl, `f=${altFormat}`), rel: `alternate`, type: utils.getTypeFromFormat(altFormat), title: `This document as ${altFormat}` })
  })

  content.jobs = [];

  var jobs = getJobs()

  // get content per :collection
  for (var name in jobs) {
    var job = getContent(neutralUrl, format, name, jobs[name])
    content.jobs.push(job);
  }

  return callback(undefined, content);
}

export default {
  get,
}