import { join } from 'path'
import YAML from 'yaml'
import { readdirSync, readFileSync } from 'fs'
import { makeOAPIF } from './geojsonParser.js'

function readGeoJSONfiles(dir) {
  var fileNames = readdirSync(dir).filter(fn => fn.endsWith('.geojson'))

  fileNames.forEach(fileName => {
    var rawData = readFileSync(join(dir, fileName))
    var geojson = JSON.parse(rawData)

    var ymlFilename = fileName.replace(/\.\w+$/, '.yml')
    var rawDataDef = readFileSync(join(dir, ymlFilename))
    var dataDef = YAML.parse(rawDataDef.toString())

    var oapif = makeOAPIF(geojson, dataDef)

    var name = fileName.replace(/\.\w+$/, '')
    dataDict[name] = oapif
  })
}

var dataDict = {};

export function load(dir) {
  readGeoJSONfiles(dir)
}

export function getDatabases() {
  return dataDict
}

export default getDatabases