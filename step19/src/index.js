//process.browser = true
//global.window = { process: { type: 'renderer' } }

import { app } from './app.js'
import { load } from './database/database.js'

load()

var port = 80 // config
app.listen(port, function (error) {
  if (error) {
    console.log('Unable to listen for connections', error)
    process.exit(10)
  }

  console.log(`OGC API Feature listening on port ${port}`)
})