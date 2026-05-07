import fs from "fs";
import path from "path";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

/* ── Sanitize filename ───────────────────────────────────────────── */
const sanitizeFilename = (originalname) => {
  const ext  = path.extname(originalname).toLowerCase();
  const base = path.basename(originalname, ext)
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";
  return `${Date.now()}-${base}${ext}`;
};

/* ── Local disk fallback ─────────────────────────────────────────── */
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, sanitizeFilename(file.originalname)),
});

/* ── Lazy S3 client — created on first request so dotenv has run ─── */
let _s3 = null;
const getS3 = () => {
  if (_s3) return _s3;
  const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
  } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) return null;
  _s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId:     AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
  return _s3;
};

const isS3Configured = () =>
  !!(process.env.AWS_ACCESS_KEY_ID &&
     process.env.AWS_SECRET_ACCESS_KEY &&
     process.env.AWS_REGION &&
     process.env.AWS_S3_BUCKET);

/* ── S3 storage engine (created lazily per upload) ───────────────── */
const makeS3Storage = (folder) =>
  multerS3({
    s3:     getS3(),
    bucket: process.env.AWS_S3_BUCKET,
    key:    (req, file, cb) => cb(null, `${folder}/${sanitizeFilename(file.originalname)}`),
    contentType: multerS3.AUTO_CONTENT_TYPE,
  });

/* ── Normalise storedPath on req.file / req.files ────────────────── */
const normalise = (req, res, next) => {
  const toPath = (f) => {
    f.storedPath = isS3Configured()
      ? f.location                        // multer-s3 sets this to the public S3 URL
      : `/uploads/${f.filename}`;
  };
  if (req.file) toPath(req.file);
  if (req.files) {
    (Array.isArray(req.files) ? req.files : Object.values(req.files).flat())
      .forEach(toPath);
  }
  next();
};

/* ── Wrapper — gives .single() / .array() / .fields() ───────────── */
const wrapMulter = (instance) => ({
  single: (field) => (req, res, next) =>
    instance.single(field)(req, res, (err) => err ? next(err) : normalise(req, res, next)),

  array: (field, max) => (req, res, next) =>
    instance.array(field, max)(req, res, (err) => err ? next(err) : normalise(req, res, next)),

  fields: (fields) => (req, res, next) =>
    instance.fields(fields)(req, res, (err) => err ? next(err) : normalise(req, res, next)),
});

/* ── Factory — storage chosen lazily at request time ────────────── */
const createUpload = (predicate, errorMessage, folder = "uploads") =>
  wrapMulter({
    single: (field) => (req, res, next) => {
      const storage = isS3Configured() ? makeS3Storage(folder) : diskStorage;
      multer({ storage, fileFilter: (req, file, cb) =>
        predicate(file) ? cb(null, true) : cb(new Error(errorMessage))
      }).single(field)(req, res, next);
    },
    array: (field, max) => (req, res, next) => {
      const storage = isS3Configured() ? makeS3Storage(folder) : diskStorage;
      multer({ storage, fileFilter: (req, file, cb) =>
        predicate(file) ? cb(null, true) : cb(new Error(errorMessage))
      }).array(field, max)(req, res, next);
    },
    fields: (fields) => (req, res, next) => {
      const storage = isS3Configured() ? makeS3Storage(folder) : diskStorage;
      multer({ storage, fileFilter: (req, file, cb) =>
        predicate(file) ? cb(null, true) : cb(new Error(errorMessage))
      }).fields(fields)(req, res, next);
    },
  });

/* ── File-type predicates ────────────────────────────────────────── */
const isImage        = (f) => f.mimetype.startsWith("image/");
const isAudio        = (f) => f.mimetype.startsWith("audio/");
const isImageOrAudio = (f) => isImage(f) || isAudio(f);
const isPdf          = (f) =>
  f.mimetype === "application/pdf" ||
  path.extname(f.originalname).toLowerCase() === ".pdf";

/* ── Named exports (same API — no route changes needed) ─────────── */
export const upload           = createUpload(isImage,        "Only image uploads are allowed",         "images");
export const uploadAudio      = createUpload(isAudio,        "Only audio uploads are allowed",          "audio");
export const uploadDoubtFiles = createUpload(isImageOrAudio, "Only image or audio uploads are allowed", "doubts");
export const uploadPdfFiles   = createUpload(isPdf,          "Only PDF uploads are allowed",            "pdfs");

export { uploadDir };
