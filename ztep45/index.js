const express = require('express')
const favicon = require('serve-favicon')
const debug = require('debug')('route')

var database = require('./database')
var encodings = require('./middlewares/encodings')

const app = express()

app.use(favicon('./public/favicon.ico'))

// for html rendering
app.set('views', __dirname + '/views');
app.set('view engine', 'pug')

app.use(express.static(__dirname + '/public'));

// setup middleware to decode the content-type
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings)

start()

async function start() {
  await database.connect()
  var collections = await database.db().listCollections().toArray()

  collections.forEach( root => {
    app.use(`/${root.name}.:ext?`, require('./route'))
    debug(`/${root.name} running`)
  })
}

module.exports = app
