import crypto from "crypto";
import axios from "axios";
import asyncHandler from "express-async-handler";
import RecordedSession from "../models/RecordedSession.js";
import LiveClass from "../models/LiveClass.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Batch from "../models/Batch.js";

const BUNNY_API_KEY      = process.env.BUNNY_STREAM_API_KEY;
const BUNNY_LIBRARY_ID   = process.env.BUNNY_STREAM_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME; // e.g. vz-0b1ecaad-561.b-cdn.net
const BUNNY_API_BASE     = "https://video.bunnycdn.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function bunnyRequest(method, path, body = null) {
  try {
    const res = await axios({
      method,
      url: `${BUNNY_API_BASE}${path}`,
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { data: body } : {}),
    });
    return res.data;
  } catch (err) {
    const status  = err.response?.status;
    const bunnyMsg = err.response?.data?.Message || err.response?.data?.message || err.message;
    console.error(`[Bunny API] ${method} ${path} → ${status ?? 'network error'}: ${bunnyMsg}`);
    if (status === 401) {
      throw new Error(
        "Bunny Stream API key is invalid or does not have access to this library. " +
        "Check BUNNY_STREAM_API_KEY and BUNNY_STREAM_LIBRARY_ID in your .env file."
      );
    }
    throw new Error(`Bunny API error (${status ?? 'network'}): ${bunnyMsg}`);
  }
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
// Authenticated via recording JWT (req.recordingClaims set by protectRecording middleware).
// Creates a Bunny video entry + DB record, returns TUS upload credentials.
export const initRecording = asyncHandler(async (req, res) => {
  // Claims come from the recording JWT; body values are used only as fallbacks / extras.
  const claims     = req.recordingClaims; // { liveClassId, courseId, instructorId }
  const liveClassId = claims.liveClassId  || req.body.liveClassId || null;
  const courseId    = claims.courseId     || req.body.courseId    || null;
  const instructorId = claims.instructorId;
  const { title, duration, size } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("courseId is required");
  }

  // 1. Resolve a human-readable title from the live class record
  let videoTitle = title; // caller may pass a title
  if (!videoTitle && liveClassId) {
    const lc = await LiveClass.findById(liveClassId).select("title").lean();
    if (lc?.title) {
      const dateStr = new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      videoTitle = `${lc.title} — ${dateStr}`;
    }
  }
  videoTitle = videoTitle || `Session — ${new Date().toLocaleString("en-IN")}`;

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
    instructor:    instructorId,
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
// Authenticated via recording JWT (req.recordingClaims).
export const completeRecording = asyncHandler(async (req, res) => {
  const { recordedSessionId, duration, size } = req.body;
  const { instructorId } = req.recordingClaims;

  const recorded = await RecordedSession.findById(recordedSessionId);
  if (!recorded) {
    res.status(404);
    throw new Error("Recording not found");
  }
  if (recorded.instructor.toString() !== instructorId) {
    res.status(403);
    throw new Error("Not authorised");
  }

  recorded.status = "processing"; // Bunny will transcode
  if (duration) recorded.duration = duration;
  if (size)     recorded.size     = size;
  await recorded.save();

  res.json({ message: "Upload complete — video is being processed", recording: recorded });
});

// ── POST /api/recordings/webhook/ready ───────────────────────────────────────
// Bunny Stream webhook — fires when encoding finishes.
// Bunny POST body: { VideoLibraryId, VideoGuid, Status }
// Status codes: 0=Created,1=Uploaded,2=Processing,3=Transcoding,4=Finished,5=Error
export const markReady = asyncHandler(async (req, res) => {
  const { VideoGuid, Status } = req.body;
  console.log("[Bunny webhook] payload:", req.body);

  if (VideoGuid) {
    if (Status === 4) {
      // Finished — mark ready
      await RecordedSession.updateMany(
        { bunnyVideoId: VideoGuid },
        { $set: { status: "ready" } }
      );
      console.log(`[Bunny webhook] Marked ready: ${VideoGuid}`);
    } else if (Status === 5) {
      // Error
      await RecordedSession.updateMany(
        { bunnyVideoId: VideoGuid },
        { $set: { status: "failed" } }
      );
      console.log(`[Bunny webhook] Marked failed: ${VideoGuid}`);
    }
  }

  // Bunny expects a 200 response
  res.status(200).json({ ok: true });
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
      return res.json([]);
    }
    if (!courseId) {
      filter.course = { $in: enrolledCourseIds };
    }
    filter.status = "ready"; // learners only see ready recordings
  } else if (req.user.role === "instructor") {
    // Instructor sees: recordings they made + recordings for courses they teach
    const instructorCourseIds = await Course.find({ instructor: req.user._id }).distinct("_id");
    const orConditions = [
      { instructor: req.user._id },
      { course: { $in: instructorCourseIds } },
    ];
    if (courseId) {
      // Already filtered by courseId above — just ensure they can access this course
      filter.$or = orConditions;
    } else {
      filter.$or = orConditions;
    }
  }
  // Admin: no extra filter — sees everything

  const recordings = await RecordedSession.find(filter)
    .populate("course",    "title thumbnail")
    .populate("liveClass", "title scheduledAt")
    .populate("instructor","name")
    .sort({ recordedAt: -1 })
    .lean();

  // ── Attach batch info for each recording ───────────────────────────────────
  // A batch belongs to a course + has a mentor (instructor). We match on both.
  const courseIds = [...new Set(recordings.map((r) => r.course?._id?.toString()).filter(Boolean))];
  const batches   = await Batch.find({ course: { $in: courseIds } })
    .populate("mentor", "name")
    .lean();

  // Build map: courseId → batch[]
  const batchByCourse = {};
  for (const b of batches) {
    const cid = b.course.toString();
    if (!batchByCourse[cid]) batchByCourse[cid] = [];
    batchByCourse[cid].push({ _id: b._id, name: b.name, mentor: b.mentor });
  }

  const enriched = recordings.map((r) => ({
    ...r,
    batches: batchByCourse[r.course?._id?.toString()] || [],
  }));

  res.json(enriched);
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
