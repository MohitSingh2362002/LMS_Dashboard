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
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { activateDueLiveClasses } from "./utils/liveClassScheduler.js";

await connectDB();

const app = express();
const server = http.createServer(app);

console.log(".env====>", process.env.CLIENT_URL)

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173"   // keep for local dev
].filter(Boolean).map(url => url.replace(/\/+$/, "")); // remove trailing slashes

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
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

io.on("connection", (socket) => {
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
});
