//process.browser = true
//global.window = { process: { type: 'renderer' } }

import { listen } from './app.js'
import { load } from './database/database.js'

load()

listen(express.port, function (error) {
  if (error) {
    console.log('Unable to listen for connections', error)
    process.exit(10)
  }

  console.log(`OGC API Feature listening on port ${express.port}`)
})