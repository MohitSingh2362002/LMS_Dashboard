import path from "path";
import fs from "fs";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env"), override: false });

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import liveClassRoutes from "./routes/liveClassRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import batchRoutes from "./routes/batchRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import doubtRoutes from "./routes/doubtRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import recordingRoutes from "./routes/recordingRoutes.js";
import appConfigRoutes from "./routes/appConfigRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { activateDueLiveClasses } from "./utils/liveClassScheduler.js";

await connectDB();

const app = express();
const server = http.createServer(app);

console.log(".env====>", process.env.CLIENT_URL)

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.LIVE_CLASS_BASE_URL,        // livesession Vercel domain
  "https://lms-five-rho-10.vercel.app",   // livesession (explicit fallback)
  "http://localhost:5173",                // Dash dev
  "http://localhost:3000",               // livesession dev
  "https://localhost:3000",
  "http://localhost:3002",
  "https://localhost:3002",
  "http://localhost:8001"
].filter(Boolean).map(url => url.replace(/\/+$/, ""));

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

const io = new Server(server, { cors: corsOptions });

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/doubts", doubtRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/app-config", appConfigRoutes);

io.on("connection", (socket) => {
  socket.on("join-user", ({ userId }) => {
    if (userId) socket.join(`user:${userId}`);
  });

  socket.on("join-conversation", ({ conversationId }) => {
    if (conversationId) socket.join(`conversation:${conversationId}`);
  });

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit("room-participants", { roomId, count: size });
  });

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit("room-participants", { roomId, count: size });
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomId) => {
      if (roomId === socket.id) return;
      setTimeout(() => {
        const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit("room-participants", { roomId, count: size });
      }, 0);
    });
  });
});

setInterval(() => {
  activateDueLiveClasses(io).catch((error) => {
    console.error("Live class scheduler error:", error.message);
  });
}, 30000);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 7001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const s3Ready = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET;
  console.log(s3Ready
    ? `☁️  Upload storage: AWS S3 (${process.env.AWS_S3_BUCKET})`
    : "📁 Upload storage: local disk (set AWS_* env vars to enable S3)"
  );
});
