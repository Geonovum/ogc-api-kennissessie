const express = require('express')
const app = express()
const port = 80

var amstelveen = require('./amstelveen')

app.use('/amstelveen/v1', amstelveen)

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
