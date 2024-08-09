import { join } from 'path'
import { app } from './app.js'
import { load } from './database/database.js'

const __dirname = import.meta.dirname
if (__dirname === undefined)
  console.log('need node 20.16 or higher')

// Load data (TODO: async)
var dataPath = process.env.DATA_PATH || join(__dirname, "../data")
load(dataPath)

app.listen(process.env.PORT, function (error) {
  if (error) {
    console.log('Unable to listen for connections', error)
    process.exit(10)
  }

  console.log(`OGC API Feature listening on port ${process.env.PORT}`)
})