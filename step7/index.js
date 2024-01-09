const express = require('express')
const app = express()
const port = 80

var kontich = require('./kontich')

app.use('/kontich', kontich)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
