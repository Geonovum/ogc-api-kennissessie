var path = require('path');
var fs = require('fs');

var fileNames = fs.readdirSync(path.join(__dirname, "data")).filter(fn => fn.endsWith('.geojson'));

var dataDict = {};
fileNames.forEach(fileName => {
  var rawData = fs.readFileSync(path.join(__dirname, "data", fileName));
  var geojson = JSON.parse(rawData);

  var id = fileName.replace(/\.[^/.]+$/, "")

  dataDict[id] = geojson;
});

function getCollection() {
  return dataDict
}

module.exports = { getCollection }
