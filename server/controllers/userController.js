import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  linkedLearners: user.linkedLearners || [],
  isActive: user.isActive,
  studentId: user.studentId || "",
  createdAt: user.createdAt
});

export const getUsers = asyncHandler(async (req, res) => {
  const filter = { isActive: { $ne: false } };
  if (req.query.role) {
    filter.role = req.query.role;
  } else {
    filter.role = { $in: ["learner", "instructor", "parent"] };
  }

  const users = await User.find(filter)
    .select("-password")
    .populate("linkedLearners", "name email avatar")
    .sort({ createdAt: -1 });
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, linkedLearners = [] } = req.body;

  if (!["instructor", "learner", "parent", "counsellor"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const existing = await User.findOne({ email: email?.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("User already exists");
  }

  if (role === "parent" && linkedLearners.length) {
    const learnerCount = await User.countDocuments({
      _id: { $in: linkedLearners },
      role: "learner",
      isActive: true
    });

    if (learnerCount !== linkedLearners.length) {
      res.status(400);
      throw new Error("One or more linked learner accounts are invalid");
    }
  }

  // Generate studentId for learners (STU + zero-padded count)
  let studentId = "";
  if (role === "learner") {
    const learnerCount = await User.countDocuments({ role: "learner" });
    studentId = `STU${String(learnerCount + 1).padStart(5, "0")}`;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    studentId,
    linkedLearners: role === "parent" ? linkedLearners : []
  });

  const populated = await User.findById(user._id)
    .select("-password")
    .populate("linkedLearners", "name email avatar");

  res.status(201).json(sanitizeUser(populated));
});

export const updateUserLinks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "parent") {
    res.status(400);
    throw new Error("Only parent accounts can be linked to learners");
  }

  const linkedLearners = req.body.linkedLearners || [];
  const learnerCount = await User.countDocuments({
    _id: { $in: linkedLearners },
    role: "learner",
    isActive: true
  });

  if (learnerCount !== linkedLearners.length) {
    res.status(400);
    throw new Error("One or more linked learner accounts are invalid");
  }

  user.linkedLearners = linkedLearners;
  await user.save();

  const populated = await User.findById(user._id)
    .select("-password")
    .populate("linkedLearners", "name email avatar");

  res.json(sanitizeUser(populated));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  const { name, email, isActive, studentId, avatar } = req.body;
  if (name      !== undefined) user.name      = name;
  if (email     !== undefined) user.email     = email;
  if (isActive  !== undefined) user.isActive  = isActive;
  if (studentId !== undefined) user.studentId = studentId;
  if (avatar    !== undefined) user.avatar    = avatar;
  await user.save();
  res.json(sanitizeUser(user));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = false;
  await user.save();
  res.json({ message: "User deactivated" });
});
