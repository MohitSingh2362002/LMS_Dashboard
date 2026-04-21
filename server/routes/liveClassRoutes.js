import express from "express";
import {
  createLiveClass,
  deleteLiveClass,
  endLiveClass,
  getLiveClasses
} from "../controllers/liveClassController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getLiveClasses)
  .post(protect, authorize("admin", "instructor"), createLiveClass);

router.put("/:id/end", protect, authorize("admin", "instructor"), endLiveClass);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteLiveClass);

export default router;
