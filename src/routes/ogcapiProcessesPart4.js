import express from "express";

import { post as postJobs } from "../controllers/processes/jobs.js";
import { patch as patchJobs } from "../controllers/processes/job.js";
import { patch as patchDefinition } from "../controllers/processes/definition.js";
import { post as postResults } from "../controllers/processes/results.js";

const router = express.Router();

// Job management
router.post ("/jobs", postJobs);
router.patch("/jobs/:jobId", patchJobs);
router.patch("/jobs/:jobId/definition", patchDefinition);
router.post ("/jobs/:jobId/results", postResults);

export default router;
