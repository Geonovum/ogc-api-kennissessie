import express from "express";

import { get as getResultsOutput, get0th as getResultsOutput0th } from "../controllers/processes/output.js";

const router = express.Router();

router.get("/jobs/:jobId/results/:outputId/0", getResultsOutput0th);
router.get("/jobs/:jobId/results/:outputId", getResultsOutput);

export default router;
