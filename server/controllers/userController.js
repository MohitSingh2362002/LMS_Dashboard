import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) {
    filter.role = req.query.role;
  } else {
    filter.role = { $in: ["learner", "instructor"] };
  }

  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (role !== "instructor") {
    res.status(400);
    throw new Error("Admin can only create instructor accounts here");
  }

  const existing = await User.findOne({ email: email?.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password, role });
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt
  });
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
