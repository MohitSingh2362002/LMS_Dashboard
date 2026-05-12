import express from "express";
import {
  createCourse,
  deleteCourse,
  duplicateCourse,
  getCourseById,
  getCourses,
  updateCourse,
  updateCourseResources
} from "../controllers/courseController.js";
import {
  initCourseVideo,
  completeCourseVideo,
  getCourseVideos,
  updateCourseVideo,
  deleteCourseVideo,
  syncCourseVideoStatuses,
} from "../controllers/courseVideoController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { upload, uploadPdfFiles } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getCourses)
  .post(protect, authorize("admin"), upload.single("thumbnail"), createCourse);

router.post("/:id/duplicate", protect, authorize("admin"), duplicateCourse);
router.put(
  "/:id/resources",
  protect,
  authorize("admin", "instructor"),
  uploadPdfFiles.array("noteFiles", 10),
  updateCourseResources
);

router
  .route("/:id")
  .get(protect, getCourseById)
  .put(protect, authorize("admin"), upload.single("thumbnail"), updateCourse)
  .delete(protect, authorize("admin"), deleteCourse);

// ── Course video routes ───────────────────────────────────────────────────────
// Init: admin uploads a new video (gets TUS credentials back)
router.post("/:courseId/videos/init",    protect, authorize("admin"), initCourseVideo);
// Sync: poll Bunny directly for processing videos → updates status in DB
router.post("/:courseId/videos/sync",    protect, authorize("admin"), syncCourseVideoStatuses);
// Complete: browser calls after TUS upload finishes
router.post("/:courseId/videos/:videoId/complete", protect, authorize("admin"), completeCourseVideo);
// List: admin, instructor, or enrolled learner
router.get("/:courseId/videos",          protect, getCourseVideos);
// Update metadata
router.put("/:courseId/videos/:videoId", protect, authorize("admin"), updateCourseVideo);
// Delete
router.delete("/:courseId/videos/:videoId", protect, authorize("admin"), deleteCourseVideo);

export default router;
