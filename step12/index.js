const express = require('express')
const app = express()
const port = 80

var birds = require('./kontich')

app.use('/kontich', birds)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))