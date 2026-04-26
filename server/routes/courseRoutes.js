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

export default router;
