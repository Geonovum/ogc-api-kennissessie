const express = require('express')
const route = require('./route')
const port = 80

const app = express()

app.engine('swig',swig.renderFile);

app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use('/amstelveen/v1', route)


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
