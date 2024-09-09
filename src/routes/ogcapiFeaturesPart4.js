import express from "express";

import { create, options } from "../controllers/features/items.js";
import {
  replacee,
  deletee,
  update,
  options as _options,
} from "../controllers/features/feature.js";

const router = express.Router();

// router.options does not work . Taken over by app.js
//router.options('/collections/:collectionId/items', options)
//router.options('/collections/:collectionId/items/:featureId', _options)
router.post("/collections/:collectionId/items", create);
router.put("/collections/:collectionId/items/:featureId", replacee);
router.delete("/collections/:collectionId/items/:featureId", deletee);
router.patch("/collections/:collectionId/items/:featureId", update);

export default router;
