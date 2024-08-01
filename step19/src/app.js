import encodings from './middleware/encodings.js'
import apiVersion from './middleware/apiversion.js'
import { major } from 'semver'
import oapifp1 from './routes/ogcapiFeaturesPart1.js'
import oapifp3 from './routes/ogcapiFeaturesPart3.js'
import oapifp4 from './routes/ogcapiFeaturesPart4.js'
import oapifp5 from './routes/ogcapiFeaturesPart5.js'
import express, { json } from 'express'
import cors from 'cors'
import morgan from 'morgan'

export const app = express()

const __dirname = import.meta.dirname

app.use(morgan(':method :url :response-time', { stream: { write: msg => console.log(msg) } }));

app.use(cors({ origin: true }));

// For HTML rendering
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use(json());

// setup middleware to decode the content-type
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings)
app.use(apiVersion)

// Mount API on this path
const mountPath = process.env.MOUNTPATH // from config
const serviceRoot = `/${mountPath}/v${major(process.env.APIVERSION)}`

app.use(serviceRoot, oapifp1)
app.use(serviceRoot, oapifp3)
app.use(serviceRoot, oapifp4)
app.use(serviceRoot, oapifp5)

// (ADR) /core/http-methods: Only apply standard HTTP methods
// https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/http-methods
app.all('*', function (req, res, next) {
//    var stdHttpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
//    if (stdHttpMethods.includes(req.method))
//        next()
//    else
        res.status(405).json({ 'code': `Method Not Allowed`, 'description': `Not allowed` })
});
