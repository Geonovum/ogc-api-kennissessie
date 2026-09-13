import express from "express";

import { get as getResultsOutput } from "../controllers/processes/output.js";

const router = express.Router();

router.get("/jobs/:jobId/results/:outputId", getResultsOutput);

export default router;
