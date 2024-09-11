import express from "express";

import { get as getProcesses } from "../controllers/processes/processes.js";
import { get as getProcess } from "../controllers/processes/process.js";
import { post as postExecution } from "../controllers/processes/execution.js";
import { get as getJobs } from "../controllers/processes/jobs.js";
import {
  get as getJob,
  delete_ as deleteJob,
} from "../controllers/processes/job.js";
import { get as getResults } from "../controllers/processes/results.js";
import { get as getResultsOutput } from "../controllers/processes/output.js";
import { post as postCallback } from "../controllers/processes/callback.js";

const router = express.Router();

router.get("/processes", getProcesses);
router.get("/processes/:processId", getProcess);
router.post("/processes/:processId/execution", postExecution);

router.get("/jobs", getJobs);
router.get("/jobs/:jobId", getJob);
router.delete("/jobs/:jobId", deleteJob);
router.get("/jobs/:jobId/results", getResults);
router.get("/jobs/:jobId/results/:outputId", getResultsOutput);

router.post("/callback/:jobId", postCallback);

export default router;
