import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  linkedLearners: user.linkedLearners || [],
  avatar: user.avatar,
  createdAt: user.createdAt
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  if (!user || !user.isActive || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (role && user.role !== role) {
    res.status(403);
    throw new Error("Role mismatch");
  }

  // Increment sessionVersion — any token from a previous login is now invalid
  const newVersion = (user.sessionVersion || 0) + 1;
  await User.findByIdAndUpdate(user._id, { sessionVersion: newVersion });

  res.json({
    token: generateToken(user._id, newVersion),
    user: sanitizeUser(user)
  });
});

export const logout = asyncHandler(async (req, res) => {
  // Incrementing sessionVersion invalidates the current token on all devices
  await User.findByIdAndUpdate(req.user._id, { $inc: { sessionVersion: 1 } });
  res.json({ message: "Logged out successfully" });
});

export const registerLearner = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email?.toLowerCase() });

  if (existing) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "learner"
  });

  res.status(201).json({
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});
