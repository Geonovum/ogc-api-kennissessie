const compression = require('compression')
const helmet = require('helmet');
const express = require('express')
const favicon = require('serve-favicon')
const debug = require('debug')('route')

var database = require('./database')
var encodings = require('./middlewares/encodings')

const app = express()

app.use(helmet())
app.use(compression())

app.use(favicon('./public/favicon.ico'))

// for html rendering
app.set('views', __dirname + '/views');
app.set('view engine', 'pug')

app.use(express.static(__dirname + '/public'));

// setup middleware to decode the content-type
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings)

// connect to the database, and 
// create a root for every collection in the database
database.connect( function(err) {
  if (err) console.log(err);

  database.getCollections( './data', function(err, collections) {
    if(err) console.log(err);

    collections.forEach( root => {
      app.use(`/${root}.:ext?`, require('./route'))
      debug(`/${root} running`)
    })
  })
})

module.exports = app
