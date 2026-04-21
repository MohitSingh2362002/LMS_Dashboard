import express from "express";
import { getMe, login, registerLearner } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerLearner);
router.get("/me", protect, getMe);

export default router;
