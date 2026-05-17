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

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error("Not authorized — invalid or expired token");
  }

  const user = await User.findById(decoded.userId).select("-password");

  if (!user || !user.isActive) {
    res.status(401);
    throw new Error("User account is inactive");
  }

  // Single-device enforcement: reject tokens issued before the last login
  if (decoded.sessionVersion !== undefined && decoded.sessionVersion !== user.sessionVersion) {
    res.status(401);
    throw new Error("SESSION_EXPIRED");
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

/**
 * Middleware for the recording-specific JWT issued by /api/live-classes/:id/join-token.
 * Payload: { type: "recording", liveClassId, courseId, instructorId }
 * Signed with ROOM_JOIN_SECRET (same key used by livesession to verify join tokens).
 * Sets req.recordingClaims = { liveClassId, courseId, instructorId }.
 */
export const protectRecording = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    console.warn("[protectRecording] No Bearer token in Authorization header");
    res.status(401);
    return next(new Error("Recording token missing — please re-join the session from Dash"));
  }

  const token = header.split(" ")[1];
  try {
    const secret = process.env.ROOM_JOIN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== "recording") {
      console.warn("[protectRecording] Token type is not 'recording':", decoded.type);
      res.status(401);
      return next(new Error("Invalid recording token type"));
    }
    console.log("[protectRecording] OK — instructorId:", decoded.instructorId, "courseId:", decoded.courseId);
    req.recordingClaims = {
      liveClassId:  decoded.liveClassId,
      courseId:     decoded.courseId,
      instructorId: decoded.instructorId,
    };
    next();
  } catch (err) {
    console.warn("[protectRecording] JWT verify failed:", err.message);
    res.status(401);
    next(new Error(`Recording token invalid or expired: ${err.message}`));
  }
};
