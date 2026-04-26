import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const createUpload = (predicate, errorMessage) =>
  multer({
    storage,
    fileFilter: (req, file, cb) => {
      if (predicate(file)) {
        cb(null, true);
        return;
      }

      cb(new Error(errorMessage));
    }
  });

const isImage = (file) => file.mimetype.startsWith("image/");
const isPdf = (file) =>
  file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf";

export const upload = createUpload(isImage, "Only image uploads are allowed");
export const uploadPdfFiles = createUpload(isPdf, "Only PDF uploads are allowed");
export { uploadDir };
