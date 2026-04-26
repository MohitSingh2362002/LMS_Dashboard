import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

const defaultPricing = { type: "free", amount: 0, currency: "USD" };
const defaultAdvancedSettings = { accessDuration: 365, certificateEnabled: false };
const defaultLiveTest = () => ({
  enabled: false,
  title: "",
  instructions: "",
  link: "",
  startsAt: null,
  endsAt: null
});

const parseMaybeJson = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") return JSON.parse(value);
  return value;
};

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const stripHtml = (value = "") => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const sanitizeNotes = (notes = [], fallback = []) => {
  if (!Array.isArray(notes)) return fallback;

  return notes.reduce((items, note, index) => {
    const title = note?.title?.trim();
    const content = note?.content || "";
    const hasVisibleContent = Boolean(stripHtml(content));

    if (!title && !hasVisibleContent) return items;

    items.push({
      title: title || `Note ${index + 1}`,
      content,
      createdAt: parseDate(note?.createdAt) || new Date()
    });

    return items;
  }, []);
};

const sanitizeNoteFiles = (noteFiles = [], fallback = []) => {
  if (!Array.isArray(noteFiles)) return fallback;

  return noteFiles.reduce((items, noteFile) => {
    const name = noteFile?.name?.trim();
    const filePath = noteFile?.path?.trim();

    if (!name || !filePath) return items;

    items.push({
      name,
      path: filePath,
      size: Number(noteFile?.size) || 0,
      uploadedAt: parseDate(noteFile?.uploadedAt) || new Date()
    });

    return items;
  }, []);
};

const mapUploadedNoteFiles = (files = []) =>
  files.map((file) => ({
    name: file.originalname,
    path: `/uploads/${file.filename}`,
    size: file.size || 0,
    uploadedAt: new Date()
  }));

const sanitizeLiveTest = (liveTest = {}, fallback = defaultLiveTest()) => {
  const merged = { ...defaultLiveTest(), ...fallback, ...(liveTest || {}) };

  return {
    enabled: Boolean(merged.enabled),
    title: merged.title?.trim() || "",
    instructions: merged.instructions || "",
    link: merged.link?.trim() || "",
    startsAt: parseDate(merged.startsAt),
    endsAt: parseDate(merged.endsAt)
  };
};

const resolveInstructorDisplayName = async ({
  instructorId,
  providedDisplayName,
  existingCourse
}) => {
  const trimmedDisplayName = providedDisplayName?.trim?.() || "";
  const previousInstructorId = existingCourse?.instructor ? String(existingCourse.instructor) : "";
  const nextInstructorId = instructorId ? String(instructorId) : "";
  const instructorChanged = Boolean(nextInstructorId) && nextInstructorId !== previousInstructorId;
  const previousDisplayName = existingCourse?.instructorDisplayName?.trim?.() || "";

  if (!nextInstructorId) return trimmedDisplayName;

  const shouldSyncToInstructorName =
    !trimmedDisplayName ||
    (instructorChanged && trimmedDisplayName === previousDisplayName);

  if (!shouldSyncToInstructorName) return trimmedDisplayName;

  const instructor = await User.findById(nextInstructorId).select("name");
  return instructor?.name || trimmedDisplayName;
};

const buildCoursePayload = async (req, existingCourse = null) => {
  const current = existingCourse?.toObject?.() || existingCourse || {};
  const instructor = req.body.instructor ?? current.instructor ?? null;
  const instructorDisplayName = await resolveInstructorDisplayName({
    instructorId: instructor,
    providedDisplayName: req.body.instructorDisplayName ?? current.instructorDisplayName ?? "",
    existingCourse: current
  });

  return {
    title: req.body.title ?? current.title,
    tags: parseMaybeJson(req.body.tags, current.tags || []),
    instructorDisplayName,
    instructor,
    description: req.body.description ?? current.description ?? "",
    tagline: req.body.tagline ?? current.tagline ?? "",
    pricing: parseMaybeJson(req.body.pricing, current.pricing || defaultPricing),
    pages: parseMaybeJson(req.body.pages, current.pages || []),
    notes: sanitizeNotes(parseMaybeJson(req.body.notes, current.notes || []), current.notes || []),
    liveTest: sanitizeLiveTest(
      parseMaybeJson(req.body.liveTest, current.liveTest || defaultLiveTest()),
      current.liveTest || defaultLiveTest()
    ),
    advancedSettings: parseMaybeJson(
      req.body.advancedSettings,
      current.advancedSettings || defaultAdvancedSettings
    ),
    status: req.body.status ?? current.status ?? "draft",
    ...(req.file ? { thumbnail: `/uploads/${req.file.filename}` } : {})
  };
};

const canManageCourseResources = (user, course) => {
  if (user.role === "admin") return true;
  return user.role === "instructor" && String(course.instructor) === String(user._id);
};

export const getCourses = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === "instructor") {
    filter.instructor = req.user._id;
  } else if (req.user.role === "learner") {
    filter.status = "published";
  }

  const courses = await Course.find(filter)
    .populate("instructor", "name email avatar")
    .sort({ updatedAt: -1 });

  const courseIds = courses.map((course) => course._id);
  const [enrollments, reviews] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", count: { $sum: 1 } } }
    ]),
    Review.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: "$course", averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ])
  ]);

  const enrollmentMap = Object.fromEntries(
    enrollments.map((item) => [String(item._id), item.count])
  );
  const reviewMap = Object.fromEntries(
    reviews.map((item) => [
      String(item._id),
      { averageRating: Number(item.averageRating.toFixed(1)), reviewCount: item.count }
    ])
  );

  res.json(
    courses.map((course) => ({
      ...course.toObject(),
      enrollmentCount: enrollmentMap[String(course._id)] || 0,
      reviewStats: reviewMap[String(course._id)] || { averageRating: 0, reviewCount: 0 }
    }))
  );
});

export const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("instructor", "name email avatar");

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  res.json(course);
});

export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(await buildCoursePayload(req));
  const populated = await Course.findById(course._id).populate("instructor", "name email avatar");
  res.status(201).json(populated);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  Object.assign(course, await buildCoursePayload(req, course));
  const updated = await course.save();
  const populated = await Course.findById(updated._id).populate("instructor", "name email avatar");
  res.json(populated);
});

export const updateCourseResources = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  if (!canManageCourseResources(req.user, course)) {
    res.status(403);
    throw new Error("Forbidden");
  }

  const liveTest = sanitizeLiveTest(req.body.liveTest, course.liveTest || defaultLiveTest());

  if (liveTest.enabled) {
    if (!liveTest.title) {
      res.status(400);
      throw new Error("Live test title is required");
    }

    if (!liveTest.link) {
      res.status(400);
      throw new Error("Live test link is required");
    }

    if (liveTest.startsAt && liveTest.endsAt && liveTest.endsAt < liveTest.startsAt) {
      res.status(400);
      throw new Error("Live test end time must be after the start time");
    }
  }

  course.notes = sanitizeNotes(req.body.notes, course.notes || []);
  course.noteFiles = [
    ...sanitizeNoteFiles(
      parseMaybeJson(req.body.existingNoteFiles, course.noteFiles || []),
      course.noteFiles || []
    ),
    ...mapUploadedNoteFiles(req.files || [])
  ];
  course.liveTest = liveTest;

  const updated = await course.save();
  const populated = await Course.findById(updated._id).populate("instructor", "name email avatar");
  res.json(populated);
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  await course.deleteOne();
  res.json({ message: "Course deleted" });
});

export const duplicateCourse = asyncHandler(async (req, res) => {
  const source = await Course.findById(req.params.id);

  if (!source) {
    res.status(404);
    throw new Error("Course not found");
  }

  const clone = await Course.create({
    ...source.toObject(),
    _id: undefined,
    title: `${source.title} (Copy)`,
    status: "draft",
    createdAt: undefined,
    updatedAt: undefined
  });

  res.status(201).json(clone);
});
