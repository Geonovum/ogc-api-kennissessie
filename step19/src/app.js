import encodings from './middleware/encodings.js'
import version from './middleware/apiversion.js'
import { major } from 'semver'
//import { mountPath, version as _version } from './config.env/index.js' 
import oapifp1 from './routes/ogcapiFeaturesPart1.js'
import oapifp3 from './routes/ogcapiFeaturesPart3.js'
import oapifp4 from './routes/ogcapiFeaturesPart4.js'
import oapifp5 from './routes/ogcapiFeaturesPart5.js'
import express, { json } from 'express'
//import cors from 'cors'
//import morgan from 'morgan'

const app = express()

//app.use(morgan(':method :url :response-time', { stream: { write: msg => console.log(msg) } }));

//app.use(cors({ origin: true }));

// For HTML rendering
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

//app.use(static(__dirname + '/public'));
app.use(json());

// setup middleware to decode the content-type
// see http://docs.opengeospatial.org/is/17-069r3/17-069r3.html#_encodings
app.use(encodings)
app.use(version)

// Mount API on this path
app.use(`/${mountPath}/v${major(_version)}`, oapifp1)
app.use(`/${mountPath}/v${major(_version)}`, oapifp3)
app.use(`/${mountPath}/v${major(_version)}`, oapifp4)
app.use(`/${mountPath}/v${major(_version)}`, oapifp5)

export default app
