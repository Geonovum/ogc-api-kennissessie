const express = require('express')
const app = express()
const port = 80

var birds = require('./birds')

app.use('/birds', birds)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))