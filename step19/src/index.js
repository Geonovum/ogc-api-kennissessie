process.browser = true
global.window = { process: { type: 'renderer' } }

const app = require('./app')
const config = require('./config/config') 
const database = require('./database/database')

database.load()

app.listen(config.express.port, function (error) {
  if (error) {
    console.log('Unable to listen for connections', error)
    process.exit(10)
  }

  console.log(`OGC API Feature listening on port ${config.express.port}`)
})