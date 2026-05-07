import express from "express";
import {
  createConversation,
  getAvailableParents,
  getBatchParents,
  getChatContacts,
  getConversations,
  getMessages,
  sendMessage
} from "../controllers/chatController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/contacts", protect, authorize("parent"), getChatContacts);
router.get("/available-parents", protect, authorize("admin", "instructor"), getAvailableParents);
router.get("/batch/:batchId/parents", protect, authorize("admin", "instructor"), getBatchParents);
router
  .route("/conversations")
  .get(protect, authorize("parent", "instructor", "admin"), getConversations)
  .post(protect, authorize("parent", "admin", "instructor"), createConversation);
router.get("/conversations/:id/messages", protect, authorize("parent", "instructor", "admin"), getMessages);
router.post("/conversations/:id/messages", protect, authorize("parent", "instructor", "admin"), sendMessage);

export default router;
