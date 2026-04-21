import express from "express";
import {
  createReview,
  deleteReview,
  getReviews,
  updateReview
} from "../controllers/reviewController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getReviews)
  .post(protect, authorize("learner"), createReview);

router
  .route("/:id")
  .put(protect, authorize("learner"), updateReview)
  .delete(protect, deleteReview);

export default router;
