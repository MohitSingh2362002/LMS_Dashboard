import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.isRead = true;
  await notification.save();
  res.json(notification);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: "Notifications marked as read" });
});
