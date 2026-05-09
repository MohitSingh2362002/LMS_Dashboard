import express from "express";
import { getMe, login, logout, registerLearner } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", registerLearner);
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);   // invalidates token on all other devices too

export default router;
