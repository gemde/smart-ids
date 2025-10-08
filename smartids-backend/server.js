import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import adminRoutes from "./routes/admin.js"; 
import process from "process";// For dashboard APIs

dotenv.config(); // Load env variables

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO setup for real-time updates
export const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Attach io to request object for emitting events inside routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Test DB connection
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to MySQL Database");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// Routes
app.use("/api/auth", authRoutes); // Login/Register routes
app.use("/api/auth", otpRoutes);  // OTP routes
app.use("/api/admin", adminRoutes); // Admin dashboard routes

// Default route
app.get("/", (req, res) => {
  res.send("🚀 SmartIDS Backend is Running Securely...");
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("Admin dashboard connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Admin dashboard disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
