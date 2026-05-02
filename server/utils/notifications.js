import Notification from "../models/Notification.js";

export const createNotification = async (io, payload) => {
  const notification = await Notification.create(payload);
  const populated = await Notification.findById(notification._id).populate("recipient", "name email role");
  io?.to(`user:${payload.recipient}`).emit("notification:new", populated);
  return populated;
};

export const createNotifications = async (io, notifications = []) =>
  Promise.all(notifications.map((notification) => createNotification(io, notification)));
