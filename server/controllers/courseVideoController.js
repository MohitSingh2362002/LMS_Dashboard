import crypto from "crypto";
import axios from "axios";
import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

const BUNNY_API_BASE = "https://video.bunnycdn.com";

// Read env vars lazily (inside functions) so dotenv has time to load them
// before they are accessed — important in ESM where imports are hoisted
// before the dotenv.config() call in server.js.
const bunnyKey      = () => process.env.BUNNY_STREAM_API_KEY;
const bunnyLib      = () => process.env.BUNNY_STREAM_LIBRARY_ID;
const bunnyCdn      = () => process.env.BUNNY_STREAM_CDN_HOSTNAME;

// ── helpers ──────────────────────────────────────────────────────────────────

async function bunnyRequest(method, path, body = null) {
  try {
    const res = await axios({
      method,
      url: `${BUNNY_API_BASE}${path}`,
      headers: {
        AccessKey: bunnyKey(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { data: body } : {}),
    });
    return res.data;
  } catch (err) {
    const status   = err.response?.status;
    const msg      = err.response?.data?.Message || err.response?.data?.message || err.message;
    console.error(`[Bunny API - courseVideo] ${method} ${path} → ${status ?? "network error"}: ${msg}`);
    if (status === 401) throw new Error("Bunny API key invalid. Check BUNNY_STREAM_API_KEY.");
    throw new Error(`Bunny API error (${status ?? "network"}): ${msg}`);
  }
}

function buildTusSignature(videoId, expiryTs) {
  return crypto
    .createHash("sha256")
    .update(bunnyLib() + bunnyKey() + expiryTs + videoId)
    .digest("hex");
}

// ── POST /api/courses/:courseId/videos/init ───────────────────────────────────
// Admin: create a Bunny video entry + embed a placeholder in the course doc.
// Returns TUS credentials so the browser can upload directly to Bunny.
export const initCourseVideo = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description = "" } = req.body;

  if (!title?.trim()) {
    res.status(400);
    throw new Error("title is required");
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  let bunnyVideoId   = null;
  let playbackUrl    = null;
  let thumbnailUrl   = null;

  const apiKey    = bunnyKey();
  const libraryId = bunnyLib();
  const cdnHost   = bunnyCdn();

  if (apiKey && libraryId) {
    const bunnyVideo = await bunnyRequest(
      "POST",
      `/library/${libraryId}/videos`,
      { title: title.trim() }
    );
    bunnyVideoId = bunnyVideo.guid;
    playbackUrl  = cdnHost
      ? `https://${cdnHost}/${bunnyVideoId}/play_720p.mp4`
      : null;
    thumbnailUrl = cdnHost
      ? `https://${cdnHost}/${bunnyVideoId}/thumbnail.jpg`
      : null;
  }

  // Determine next order
  const order = course.courseVideos.length;

  // Embed placeholder doc
  course.courseVideos.push({
    title: title.trim(),
    description,
    bunnyVideoId,
    bunnyLibraryId: libraryId || null,
    playbackUrl,
    thumbnailUrl,
    order,
    status: bunnyVideoId ? "uploading" : "failed",
  });
  await course.save();

  const newVideo = course.courseVideos[course.courseVideos.length - 1];

  // TUS signature (valid 2 h)
  const expiryTs  = Math.floor(Date.now() / 1000) + 7200;
  const signature = bunnyVideoId ? buildTusSignature(bunnyVideoId, expiryTs) : null;

  res.status(201).json({
    videoId:     newVideo._id,
    bunnyVideoId,
    libraryId,
    tusEndpoint: "https://video.bunnycdn.com/tusupload",
    signature,
    expiryTs,
  });
});

// ── POST /api/courses/:courseId/videos/:videoId/complete ─────────────────────
// Called after TUS upload finishes. Marks the embedded doc as "processing".
export const completeCourseVideo = asyncHandler(async (req, res) => {
  const { courseId, videoId } = req.params;
  const { duration, size }   = req.body;

  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error("Course not found"); }

  const vid = course.courseVideos.id(videoId);
  if (!vid) { res.status(404); throw new Error("Video not found"); }

  vid.status = "processing";
  if (duration) vid.duration = duration;
  if (size)     vid.size     = size;
  await course.save();

  res.json({ message: "Upload complete — video is being processed", video: vid });
});

// ── GET /api/courses/:courseId/videos ─────────────────────────────────────────
// Admin / instructor: all videos.
// Learner: only ready videos for enrolled course.
export const getCourseVideos = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId).select("courseVideos title instructor");
  if (!course) { res.status(404); throw new Error("Course not found"); }

  if (req.user.role === "learner") {
    const enrolled = await Enrollment.findOne({ learner: req.user._id, course: courseId });
    if (!enrolled) { res.status(403); throw new Error("Not enrolled in this course"); }
    return res.json(course.courseVideos.filter((v) => v.status === "ready").sort((a, b) => a.order - b.order));
  }

  // Admin / instructor — return all, sorted by order
  res.json([...course.courseVideos].sort((a, b) => a.order - b.order));
});

// ── PUT /api/courses/:courseId/videos/:videoId ────────────────────────────────
// Admin: update title / description / order of an embedded video.
export const updateCourseVideo = asyncHandler(async (req, res) => {
  const { courseId, videoId } = req.params;
  const { title, description, order } = req.body;

  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error("Course not found"); }

  const vid = course.courseVideos.id(videoId);
  if (!vid) { res.status(404); throw new Error("Video not found"); }

  if (title !== undefined)       vid.title       = title.trim();
  if (description !== undefined) vid.description = description;
  if (order !== undefined)       vid.order       = Number(order);

  await course.save();
  res.json(vid);
});

// ── POST /api/courses/:courseId/videos/sync ───────────────────────────────────
// Admin: query Bunny directly for every processing/uploading video in this
// course and update their status in the DB. Returns the updated video list.
// This is used as a fallback when the Bunny webhook can't reach the server
// (e.g. local development / no public URL configured).
export const syncCourseVideoStatuses = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error("Course not found"); }

  const pending = course.courseVideos.filter(
    (v) => v.status === "processing" || v.status === "uploading"
  );

  if (pending.length === 0) {
    return res.json([...course.courseVideos].sort((a, b) => a.order - b.order));
  }

  const apiKey    = bunnyKey();
  const libraryId = bunnyLib();

  if (!apiKey || !libraryId) {
    return res.json([...course.courseVideos].sort((a, b) => a.order - b.order));
  }

  let changed = false;
  for (const vid of pending) {
    if (!vid.bunnyVideoId) continue;
    try {
      const data = await bunnyRequest(
        "GET",
        `/library/${libraryId}/videos/${vid.bunnyVideoId}`
      );
      // Bunny status: 0=Created,1=Uploaded,2=Processing,3=Transcoding,4=Finished,5=Error
      const s = Number(data.status ?? data.Status);
      if (s === 4) {
        vid.status = "ready";
        changed = true;
        console.log(`[syncCourseVideos] Marked ready: ${vid.bunnyVideoId}`);
      } else if (s === 5) {
        vid.status = "failed";
        changed = true;
        console.log(`[syncCourseVideos] Marked failed: ${vid.bunnyVideoId}`);
      }
    } catch (e) {
      console.warn(`[syncCourseVideos] Could not fetch status for ${vid.bunnyVideoId}:`, e.message);
    }
  }

  if (changed) await course.save();

  res.json([...course.courseVideos].sort((a, b) => a.order - b.order));
});

// ── DELETE /api/courses/:courseId/videos/:videoId ─────────────────────────────
// Admin: delete from Bunny + remove from course doc.
export const deleteCourseVideo = asyncHandler(async (req, res) => {
  const { courseId, videoId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) { res.status(404); throw new Error("Course not found"); }

  const vid = course.courseVideos.id(videoId);
  if (!vid) { res.status(404); throw new Error("Video not found"); }

  // Remove from Bunny
  if (vid.bunnyVideoId && bunnyKey() && bunnyLib()) {
    try {
      await bunnyRequest("DELETE", `/library/${bunnyLib()}/videos/${vid.bunnyVideoId}`);
    } catch (e) {
      console.warn("[courseVideo] Bunny delete failed (continuing):", e.message);
    }
  }

  vid.deleteOne();
  await course.save();

  res.json({ message: "Video deleted" });
});
