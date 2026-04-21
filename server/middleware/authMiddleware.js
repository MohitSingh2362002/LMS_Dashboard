import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Not authorized");
  }

  const token = header.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select("-password");

  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  req.user = user;
  next();
});

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("Forbidden");
    }

    next();
  };
