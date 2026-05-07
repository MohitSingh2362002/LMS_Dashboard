import express from "express";
import { getMyPurchases, purchaseTest } from "../controllers/purchaseController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Any authenticated non-admin role can purchase or view purchases
router.get("/mine", protect, authorize("learner", "parent", "instructor"), getMyPurchases);
router.post("/test/:testId", protect, authorize("learner", "parent", "instructor"), purchaseTest);

export default router;
