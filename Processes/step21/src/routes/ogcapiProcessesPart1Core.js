import express from 'express';

import { get as getProcesses } from '../controllers/processes/processes.js'
import { get as getProcess } from '../controllers/processes/process.js'
import { post as postExecution } from '../controllers/processes/execution.js'
import { get as getJobs } from '../controllers/processes/jobs.js'
import { get as getJob, delete_ as deleteJob,  } from '../controllers/processes/job.js'
import { get as getResults,  } from '../controllers/processes/results.js'

const router = express.Router();

router.get('/processes', getProcesses)
router.get('/processes/:processId', getProcess)
router.post('/processes/:processId/execution', postExecution)

router.get('/jobs', getJobs)
router.get('/jobs/:jobId', getJob)
router.delete('/jobs/:jobId', deleteJob)
router.get('/jobs/:jobId/results', getResults)

export default router