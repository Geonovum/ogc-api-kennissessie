import express from 'express';

import { get as getProcesses } from '../controllers/processes.js'
import { get as getProcess } from '../controllers/process.js'
import { post as postExecution } from '../controllers/execution.js'
import { get as getJobs } from '../controllers/jobs.js'
import { get as getJob } from '../controllers/job.js'

const router = express.Router();

router.get('/processes', getProcesses)
router.get('/processes/:processId', getProcess)
router.post('/processes/:processId/execution', postExecution)

router.get('/jobs', getJobs)
router.get('/jobs/:jobId', getJob)

  
export default router