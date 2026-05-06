import express from "express";
import {
  createBatch,
  getBatches,
  getMyBatches,
  getMigrationRequests,
  requestMigration,
  reviewMigrationRequest,
  updateBatch,
  updateSyllabusProgress
} from "../controllers/batchController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin", "instructor"), getBatches)
  .post(protect, authorize("admin"), createBatch);

router.get("/mine", protect, authorize("learner"), getMyBatches);
router.get("/migrations", protect, authorize("admin", "instructor"), getMigrationRequests);
router.post("/migrations", protect, authorize("admin", "instructor"), requestMigration);
router.put("/migrations/:id/review", protect, authorize("admin"), reviewMigrationRequest);

router.put("/:id", protect, authorize("admin"), updateBatch);
router.patch("/:id/syllabus", protect, authorize("admin", "instructor"), updateSyllabusProgress);

export default router;
