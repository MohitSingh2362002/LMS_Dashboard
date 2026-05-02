import Batch from "../models/Batch.js";
import Conversation from "../models/Conversation.js";
import Enrollment from "../models/Enrollment.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notifications.js";

const populateConversation = (query) =>
  query
    .populate("parent", "name email avatar")
    .populate("teacher", "name email avatar")
    .populate("learner", "name email avatar")
    .populate("batch", "name")
    .populate("course", "title");

const canAccessConversation = (user, conversation) => {
  if (user.role === "admin") return true;
  if (user.role === "parent") return String(conversation.parent) === String(user._id);
  if (user.role === "instructor") return String(conversation.teacher) === String(user._id);
  return false;
};

const getAllowedTeacherLinks = async (parent) => {
  const learnerIds = parent.linkedLearners || [];
  const [learners, batches, enrollments] = await Promise.all([
    User.find({ _id: { $in: learnerIds }, role: "learner" }).select("name email avatar"),
    Batch.find({ learners: { $in: learnerIds }, status: "active" })
      .populate("mentor", "name email avatar")
      .populate("course", "title")
      .populate("learners", "name email avatar"),
    Enrollment.find({ learner: { $in: learnerIds } })
      .populate("learner", "name email avatar")
      .populate({
        path: "course",
        select: "title instructor",
        populate: { path: "instructor", select: "name email avatar" }
      })
  ]);

  const links = [];
  const seen = new Set();

  batches.forEach((batch) => {
    batch.learners
      .filter((learner) => learnerIds.some((id) => String(id) === String(learner._id)))
      .forEach((learner) => {
        if (!batch.mentor) return;
        const key = `${learner._id}:${batch.mentor._id}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push({
          learner,
          teacher: batch.mentor,
          batch: { _id: batch._id, name: batch.name },
          course: batch.course,
          source: "batch mentor"
        });
      });
  });

  enrollments.forEach((enrollment) => {
    const teacher = enrollment.course?.instructor;
    const learner = enrollment.learner;
    if (!teacher || !learner) return;
    const key = `${learner._id}:${teacher._id}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({
      learner,
      teacher,
      batch: null,
      course: enrollment.course,
      source: "course teacher"
    });
  });

  return { learners, links };
};

export const getChatContacts = asyncHandler(async (req, res) => {
  if (req.user.role !== "parent") {
    res.json({ learners: [], links: [] });
    return;
  }

  res.json(await getAllowedTeacherLinks(req.user));
});

export const getConversations = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "parent") filter.parent = req.user._id;
  if (req.user.role === "instructor") filter.teacher = req.user._id;

  const conversations = await populateConversation(Conversation.find(filter).sort({ lastMessageAt: -1, updatedAt: -1 }));
  res.json(conversations);
});

export const createConversation = asyncHandler(async (req, res) => {
  if (req.user.role !== "parent") {
    res.status(403);
    throw new Error("Only parents can start parent-teacher conversations");
  }

  const { learner, teacher } = req.body;
  const { links } = await getAllowedTeacherLinks(req.user);
  const link = links.find(
    (item) => String(item.learner._id) === String(learner) && String(item.teacher._id) === String(teacher)
  );

  if (!link) {
    res.status(403);
    throw new Error("This teacher is not assigned to the linked learner");
  }

  const conversation = await Conversation.findOneAndUpdate(
    { parent: req.user._id, teacher, learner },
    {
      parent: req.user._id,
      teacher,
      learner,
      batch: link.batch?._id || null,
      course: link.course?._id || null
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const populated = await populateConversation(Conversation.findById(conversation._id));
  res.status(201).json(populated);
});

export const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || !canAccessConversation(req.user, conversation)) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  await Message.updateMany(
    { conversation: conversation._id, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  const messages = await Message.find({ conversation: conversation._id })
    .populate("sender", "name email avatar role")
    .sort({ createdAt: 1 });

  res.json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation || !canAccessConversation(req.user, conversation)) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    body: req.body.body,
    readBy: [req.user._id]
  });

  conversation.lastMessage = req.body.body;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const populated = await Message.findById(message._id).populate("sender", "name email avatar role");
  const recipient = req.user.role === "parent" ? conversation.teacher : conversation.parent;

  req.io?.to(`conversation:${conversation._id}`).emit("chat:message", populated);
  req.io?.to(`user:${recipient}`).emit("chat:message", populated);
  await createNotification(req.io, {
    recipient,
    title: "New parent-teacher message",
    message: req.body.body,
    type: "system",
    link: req.user.role === "parent" ? "/instructor/chat" : "/parent/chat",
    metadata: { conversation: conversation._id }
  });

  res.status(201).json(populated);
});
