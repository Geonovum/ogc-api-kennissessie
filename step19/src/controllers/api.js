import accepts from 'accepts';
import { join } from 'path';
import YAML from 'yaml'
import { writeFileSync } from 'fs'
import api from '../models/api.js'
import utils from '../utils/utils.js'

const __dirname = import.meta.dirname

export function get(req, res) {

    // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return

  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400, 
  //         if the request URI includes a query parameter that is not specified in the API definition
  var queryParams = ['f']
  var rejected = utils.checkForAllowedQueryParams(req.query, queryParams)
  if (rejected.length > 0) 
  {
      res.status(400).json({'code': `The following query parameters are rejected: ${rejected}`, 'description': 'Valid parameters for this request are ' + queryParams })
      return 
  }

  var formatFreeUrl = utils.getFormatFreeUrl(req)

  var accept = accepts(req)
  var format = accept.type(['json', 'html', 'yaml'])

  api.get(formatFreeUrl, function (err, content) {

    if (err) {
      res.status(err.httpCode).json({ 'code': err.code, 'description': err.description })
      return
    }

    switch (format) {
      case 'json':
        var filename = join(__dirname, '..', 'public', 'api', 'openapi.json')
        writeFileSync(filename, JSON.stringify(content))
        res.set('Content-Type', 'application/vnd.oai.openapi+json;version=3.0')
        res.sendFile(filename)
        break
      case 'yaml':
        var filename = join(__dirname, '..', 'public', 'api', 'openapi.yaml')
        writeFileSync(filename, YAML.stringify(content))
        res.set('Content-Type', 'application/vnd.oai.openapi;version=3.0')
        res.sendFile(filename)
        break
      case 'html':
        res.statusCode = 302; // redirect
        res.setHeader("Location", "https://app.swaggerhub.com/apis/BartDeLathouwer/ogcapi-amstelveen/1.0.0");
        res.end();
        break
      case false:
      default:
        res.status(400).json({ 'code': 'InvalidParameterValue', 'description': 'Invalid format' })
    }
  })
}
