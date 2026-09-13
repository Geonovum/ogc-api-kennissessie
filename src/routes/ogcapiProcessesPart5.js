import express from "express";

import { get as getProv } from "../controllers/processes/prov.js";

const router = express.Router();

// Provenance
router.get("/jobs/:jobId/prov", getProv);

export default router;
