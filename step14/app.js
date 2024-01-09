process.browser = true
global.window = { process: { type: 'renderer' } }

const debug = require('debug')('http')
const app = require('./index')
const config = require('./config/server')

debug('booting..');

app.listen(config.express.port, function (error) {
  if (error) {
    debug('Unable to listen for connections', error)
    process.exit(10)
  }

  debug(`OGC API Feature Part 1 Core listening on port ${config.express.port}`)
})