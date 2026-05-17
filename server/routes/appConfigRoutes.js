import express from "express";
import { getAppConfig, updateAppConfig, uploadBrandingImage } from "../controllers/appConfigController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getAppConfig);
router.put("/", protect, authorize("admin"), updateAppConfig);

// Upload logo or splash logo to S3 → returns { url }
router.post(
  "/upload",
  protect,
  authorize("admin"),
  upload.single("image"),
  uploadBrandingImage
);

export default router;
