import crypto from "crypto";
import asyncHandler from "express-async-handler";
import RecordedSession from "../models/RecordedSession.js";
import LiveClass from "../models/LiveClass.js";
import Enrollment from "../models/Enrollment.js";
import Batch from "../models/Batch.js";

const BUNNY_API_KEY       = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_LIBRARY_ID    = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME  = process.env.BUNNY_STREAM_CDN_HOSTNAME; // e.g. vz-abc.b-cdn.net
const BUNNY_API_BASE      = "https://video.bunnycdn.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function bunnyRequest(method, path, body = null) {
  const res = await fetch(`${BUNNY_API_BASE}${path}`, {
    method,
    headers: {
      AccessKey: BUNNY_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bunny API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function buildTusSignature(videoId, expiryTs) {
  // SHA-256 of (libraryId + apiKey + expiry + videoId)
  return crypto
    .createHash("sha256")
    .update(BUNNY_LIBRARY_ID + BUNNY_API_KEY + expiryTs + videoId)
    .digest("hex");
}

// ── POST /api/recordings/init ─────────────────────────────────────────────────
// Called by livesession host right after stopping recording.
// Creates a Bunny video entry + DB record, returns TUS upload credentials.
export const initRecording = asyncHandler(async (req, res) => {
  const { liveClassId, courseId, title, duration, size } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("courseId is required");
  }

  // Verify the live class belongs to this instructor (if provided)
  if (liveClassId) {
    const lc = await LiveClass.findById(liveClassId);
    if (
      lc &&
      lc.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorised to record this session");
    }
  }

  // 1. Create video entry in Bunny Stream
  const videoTitle = title || `Session ${new Date().toISOString()}`;
  let bunnyVideoId = null;
  let playbackUrl  = null;
  let thumbnailUrl = null;

  if (BUNNY_API_KEY && BUNNY_LIBRARY_ID) {
    const bunnyVideo = await bunnyRequest(
      "POST",
      `/library/${BUNNY_LIBRARY_ID}/videos`,
      { title: videoTitle }
    );
    bunnyVideoId = bunnyVideo.guid;
    playbackUrl  = `https://${BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/play_720p.mp4`;
    thumbnailUrl = `https://${BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/thumbnail.jpg`;
  }

  // 2. Create DB record
  const recorded = await RecordedSession.create({
    title: videoTitle,
    liveClass:     liveClassId || null,
    course:        courseId,
    instructor:    req.user._id,
    bunnyVideoId,
    bunnyLibraryId: BUNNY_LIBRARY_ID || null,
    playbackUrl,
    thumbnailUrl,
    duration:  duration || 0,
    size:      size     || 0,
    status:    bunnyVideoId ? "uploading" : "failed",
  });

  // 3. Generate TUS upload signature (valid for 2 hours)
  const expiryTs  = Math.floor(Date.now() / 1000) + 7200;
  const signature = bunnyVideoId
    ? buildTusSignature(bunnyVideoId, expiryTs)
    : null;

  res.status(201).json({
    recordedSessionId: recorded._id,
    bunnyVideoId,
    libraryId:   BUNNY_LIBRARY_ID,
    tusEndpoint: "https://video.bunnycdn.com/tusupload",
    signature,
    expiryTs,
  });
});

// ── POST /api/recordings/complete ─────────────────────────────────────────────
// Called by livesession after TUS upload finishes.
export const completeRecording = asyncHandler(async (req, res) => {
  const { recordedSessionId, duration, size } = req.body;

  const recorded = await RecordedSession.findById(recordedSessionId);
  if (!recorded) {
    res.status(404);
    throw new Error("Recording not found");
  }
  if (recorded.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorised");
  }

  recorded.status   = "processing"; // Bunny will transcode
  if (duration) recorded.duration = duration;
  if (size)     recorded.size     = size;
  await recorded.save();

  res.json({ message: "Upload complete — video is being processed", recording: recorded });
});

// ── POST /api/recordings/:id/ready ────────────────────────────────────────────
// Bunny webhook: called when transcoding is done.
// Configure this URL in your Bunny Stream library settings.
export const markReady = asyncHandler(async (req, res) => {
  // Bunny sends VideoId in the body
  const { VideoId } = req.body;
  if (VideoId) {
    await RecordedSession.updateMany(
      { bunnyVideoId: VideoId },
      { $set: { status: "ready" } }
    );
  }
  res.json({ ok: true });
});

// ── GET /api/recordings ───────────────────────────────────────────────────────
// Admin/instructor: all recordings, optionally filter by courseId or liveClassId.
// Learner: only recordings for enrolled courses.
export const getRecordings = asyncHandler(async (req, res) => {
  const { courseId, liveClassId, status } = req.query;
  const filter = {};

  if (courseId)    filter.course    = courseId;
  if (liveClassId) filter.liveClass = liveClassId;
  if (status)      filter.status    = status;

  if (req.user.role === "learner") {
    // Only return recordings for courses the learner is enrolled in
    const enrollments = await Enrollment.find({ learner: req.user._id }).select("course");
    const enrolledCourseIds = enrollments.map((e) => e.course.toString());

    if (courseId && !enrolledCourseIds.includes(courseId)) {
      return res.json([]); // not enrolled → empty
    }
    if (!courseId) {
      filter.course = { $in: enrolledCourseIds };
    }
    filter.status = "ready"; // learners only see ready recordings
  } else if (req.user.role === "instructor") {
    filter.instructor = req.user._id;
  }

  const recordings = await RecordedSession.find(filter)
    .populate("course",    "title thumbnail")
    .populate("liveClass", "title scheduledAt")
    .populate("instructor","name")
    .sort({ recordedAt: -1 });

  res.json(recordings);
});

// ── GET /api/recordings/:id ───────────────────────────────────────────────────
export const getRecordingById = asyncHandler(async (req, res) => {
  const recording = await RecordedSession.findById(req.params.id)
    .populate("course",    "title thumbnail")
    .populate("liveClass", "title scheduledAt")
    .populate("instructor","name");

  if (!recording) {
    res.status(404);
    throw new Error("Recording not found");
  }

  // Learner access check
  if (req.user.role === "learner") {
    const enrolled = await Enrollment.findOne({
      learner: req.user._id,
      course:  recording.course._id,
    });
    if (!enrolled) {
      res.status(403);
      throw new Error("You are not enrolled in this course");
    }
    if (recording.status !== "ready") {
      res.status(403);
      throw new Error("Recording is not available yet");
    }
  }

  // Return Bunny embed URL (iframe player)
  const embedUrl = recording.bunnyVideoId && BUNNY_LIBRARY_ID
    ? `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${recording.bunnyVideoId}?autoplay=false&loop=false&muted=false&responsive=true`
    : null;

  res.json({ ...recording.toObject(), embedUrl });
});

// ── DELETE /api/recordings/:id ────────────────────────────────────────────────
export const deleteRecording = asyncHandler(async (req, res) => {
  const recording = await RecordedSession.findById(req.params.id);
  if (!recording) {
    res.status(404);
    throw new Error("Recording not found");
  }
  if (
    recording.instructor.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorised");
  }

  // Delete from Bunny Stream
  if (recording.bunnyVideoId && BUNNY_API_KEY && BUNNY_LIBRARY_ID) {
    try {
      await bunnyRequest("DELETE", `/library/${BUNNY_LIBRARY_ID}/videos/${recording.bunnyVideoId}`);
    } catch (e) {
      console.warn("Bunny delete failed (continuing):", e.message);
    }
  }

  await recording.deleteOne();
  res.json({ message: "Recording deleted" });
});
