import SupportTicket from "../models/SupportTicket.js";
import asyncHandler from "../utils/asyncHandler.js";

const populateTicket = (q) =>
  q.populate("createdBy", "name email role").populate("responses.by", "name role");

export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  if (!title?.trim() || !description?.trim()) {
    res.status(400); throw new Error("Title and description are required");
  }
  const ticket = await SupportTicket.create({
    title: title.trim(), description: description.trim(),
    category: category || "general",
    priority: priority || "medium",
    createdBy: req.user._id
  });
  const populated = await populateTicket(SupportTicket.findById(ticket._id));
  res.status(201).json(populated);
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await populateTicket(
    SupportTicket.find({ createdBy: req.user._id }).sort({ createdAt: -1 })
  );
  res.json(tickets);
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  const tickets = await populateTicket(SupportTicket.find(filter).sort({ createdAt: -1 }));
  res.json(tickets);
});

export const respondToTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) { res.status(404); throw new Error("Ticket not found"); }
  const { message, status } = req.body;
  if (!message?.trim()) { res.status(400); throw new Error("Response message required"); }
  ticket.responses.push({ message: message.trim(), by: req.user._id });
  if (status) ticket.status = status;
  else if (ticket.status === "open") ticket.status = "in-progress";
  await ticket.save();
  const populated = await populateTicket(SupportTicket.findById(ticket._id));
  res.json(populated);
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) { res.status(404); throw new Error("Ticket not found"); }
  ticket.status = req.body.status;
  await ticket.save();
  const populated = await populateTicket(SupportTicket.findById(ticket._id));
  res.json(populated);
});
