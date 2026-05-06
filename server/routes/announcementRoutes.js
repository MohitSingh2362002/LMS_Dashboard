import express from "express";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements
} from "../controllers/announcementController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",    protect, getAnnouncements);
router.post("/",   protect, authorize("admin", "instructor"), createAnnouncement);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteAnnouncement);

export default router;
