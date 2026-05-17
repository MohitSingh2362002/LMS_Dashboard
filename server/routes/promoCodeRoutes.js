import express from "express";
import { authorize, protect } from "../middleware/authMiddleware.js";
import {
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  resetPromoCodeUsage,
  validatePromoCode,
  applyPromoCode,
} from "../controllers/promoCodeController.js";

const router = express.Router();

// ── Admin routes ──────────────────────────────────────────────────────────
router.get(   "/",            protect, authorize("admin"), getAllPromoCodes);
router.post(  "/",            protect, authorize("admin"), createPromoCode);
router.put(   "/:id",         protect, authorize("admin"), updatePromoCode);
router.delete("/:id",         protect, authorize("admin"), deletePromoCode);
router.patch( "/:id/reset",   protect, authorize("admin"), resetPromoCodeUsage);

// ── Learner routes ────────────────────────────────────────────────────────
router.post("/validate", protect, authorize("learner", "parent", "instructor"), validatePromoCode);
router.post("/apply",    protect, authorize("learner", "parent", "instructor"), applyPromoCode);

export default router;
