import express from "express";

import { create, options } from "../controllers/features/items.js";
import {
  replacee,
  deletee,
  update,
  options as _options,
} from "../controllers/features/feature.js";

const router = express.Router();

// OAPIF Part 4
// 6. Requirements Class "Create/Replace/Delete"
// https://docs.ogc.org/DRAFTS/20-002r1.html#create
router.post("/collections/:collectionId/items", create);
// https://docs.ogc.org/DRAFTS/20-002r1.html#replace
router.put("/collections/:collectionId/items/:featureId", replacee);
// https://docs.ogc.org/DRAFTS/20-002r1.html#delete
router.delete("/collections/:collectionId/items/:featureId", deletee);

// router.options does not work . Taken over by app.js
// https://docs.ogc.org/DRAFTS/20-002r1.html#options
//router.options('/collections/:collectionId/items', options)
//router.options('/collections/:collectionId/items/:featureId', _options)
// Options in Express are not handled well - sorry

// OAPIF Part 4
// 7. Requirements Class "Update"
// https://docs.ogc.org/DRAFTS/20-002r1.html#update
router.patch("/collections/:collectionId/items/:featureId", update);

export default router;
