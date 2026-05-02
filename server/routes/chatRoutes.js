import express from "express";
import {
  createConversation,
  getChatContacts,
  getConversations,
  getMessages,
  sendMessage
} from "../controllers/chatController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/contacts", protect, authorize("parent"), getChatContacts);
router
  .route("/conversations")
  .get(protect, authorize("parent", "instructor", "admin"), getConversations)
  .post(protect, authorize("parent"), createConversation);
router.get("/conversations/:id/messages", protect, authorize("parent", "instructor", "admin"), getMessages);
router.post("/conversations/:id/messages", protect, authorize("parent", "instructor"), sendMessage);

export default router;
