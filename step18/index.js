const encodings = require('./middlewares/encodings')
const version = require('./middlewares/apiversion')
const semver = require('semver')
const config = require('./config/server') 
const oapifp1 = require('./routes/ogcapiFeaturesPart1')
const oapifp3 = require('./routes/ogcapiFeaturesPart3')
const oapifp4 = require('./routes/ogcapiFeaturesPart4')
const oapifp5 = require('./routes/ogcapiFeaturesPart5')
const swig = require('swig');
const express = require('express')
const port = 80

const app = express()

// For HTML rendering
app.engine('swig',swig.renderFile);
app.set('view engine', 'swig');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(express.json());

// setup middleware to decode the content-type
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings)
app.use(version)

// Mount API on this path
app.use(`/${config.mountPath}/v${semver.major(config.version)}`, oapifp1)
app.use(`/${config.mountPath}/v${semver.major(config.version)}`, oapifp3)
app.use(`/${config.mountPath}/v${semver.major(config.version)}`, oapifp4)
app.use(`/${config.mountPath}/v${semver.major(config.version)}`, oapifp5)

module.exports = app