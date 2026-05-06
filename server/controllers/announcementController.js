import Announcement from "../models/Announcement.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find()
    .populate("author", "name role avatar")
    .sort({ pinned: -1, createdAt: -1 })
    .limit(20);
  res.json(announcements);
});

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { type = "general", title = "", message, pinned = false } = req.body;

  if (!message?.trim()) {
    res.status(400);
    throw new Error("Announcement message is required");
  }

  const announcement = await Announcement.create({
    author: req.user._id,
    type,
    title: title.trim(),
    message: message.trim(),
    pinned
  });

  const populated = await Announcement.findById(announcement._id).populate("author", "name role avatar");
  res.status(201).json(populated);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);

  if (!announcement) {
    res.status(404);
    throw new Error("Announcement not found");
  }

  // Only author or admin can delete
  if (String(announcement.author) !== String(req.user._id) && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorised to delete this announcement");
  }

  await announcement.deleteOne();
  res.json({ message: "Announcement deleted" });
});
