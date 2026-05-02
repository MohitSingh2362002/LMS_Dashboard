import express from "express";
import { answerDoubt, createDoubt, getDoubts, reopenDoubt } from "../controllers/doubtController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { uploadAudio } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin", "instructor", "learner"), getDoubts)
  .post(protect, authorize("learner"), uploadAudio.single("audio"), createDoubt);

router.put("/:id/answer", protect, authorize("admin", "instructor"), answerDoubt);
router.put("/:id/reopen", protect, authorize("learner"), reopenDoubt);

export default router;
