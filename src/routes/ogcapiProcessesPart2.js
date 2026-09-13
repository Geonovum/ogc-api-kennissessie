import express from "express";

import { post as postProcesses } from "../controllers/processes/processes.js";
import { put as putProcess, delete_ as deleteProcess } from "../controllers/processes/process.js";
import { get as getPackage } from "../controllers/processes/package.js";

const router = express.Router();

router.post("/processes", postProcesses);
router.put("/processes/:processId", putProcess);
router.delete("/processes/:processId", deleteProcess);
router.get("/processes/:processId/package", getPackage);

export default router;
