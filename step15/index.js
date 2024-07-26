process.browser = true
global.window = { process: { type: 'renderer' } }

const debug = require('debug')('http') // see launch.json in .vscode
const app = require('./app')
const config = require('./config/server') // see server.js file in /config

debug('booting..');

app.listen(config.express.port, function (error) {
  if (error) {
    debug('Unable to listen for connections', error)
    process.exit(10)
  }

  debug(`OGC API Feature listening on port ${config.express.port}`)
})