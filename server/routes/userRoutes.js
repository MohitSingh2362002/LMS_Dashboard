import express from "express";
import { createUser, deleteUser, getUsers, updateUserLinks } from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("admin"), getUsers)
  .post(protect, authorize("admin"), createUser);

router.delete("/:id", protect, authorize("admin"), deleteUser);
router.put("/:id/links", protect, authorize("admin"), updateUserLinks);

export default router;
