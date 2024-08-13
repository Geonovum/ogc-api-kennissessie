import { app } from './app.js'
import { load } from './database/database.js'

// Load data (TODO: async)
load()

app.listen(process.env.PORT, function (error) {
  if (error) {
    console.log('Unable to listen for connections', error)
    process.exit(10)
  }

  console.log(`OGC API Feature listening on port ${process.env.PORT}`)
})