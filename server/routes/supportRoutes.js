import express from "express";
import { createTicket, getMyTickets, getAllTickets, respondToTicket, updateTicketStatus } from "../controllers/supportController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTicket);
router.get("/mine", protect, getMyTickets);
router.get("/", protect, authorize("admin"), getAllTickets);
router.post("/:id/respond", protect, authorize("admin"), respondToTicket);
router.patch("/:id/status", protect, authorize("admin"), updateTicketStatus);

export default router;
