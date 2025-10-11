// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import os from "os";
import process from "process";

// ✅ Import database & routes
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
<<<<<<< HEAD
import otpRoutes from "./routes/otpRoutes.js";
import adminRoutes from "./routes/admin.js";
import fileRoutes from "./routes/fileRoutes.js";
import vaultRoutes from "./routes/vaultRoutes.js";

dotenv.config(); // Load environment variables
=======
import adminRoutes from "./routes/adminRoutes.js"; // ✅ Corrected filename
import process from "process";

dotenv.config();
>>>>>>> 646ec0e (Save current changes before pull)

const app = express();
const server = http.createServer(app);

<<<<<<< HEAD
// =======================
// 🌐 Utility: Get local network IP
// =======================
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}
const localIP = getLocalIp();

// =======================
// 🛡 Security & CORS
// =======================
const allowedOrigins = [
  "http://localhost:5173",
  `http://${localIP}:5173`, // LAN frontend access
];

app.use(helmet()); // Security headers

// CORS
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options(/.*/, cors()); // Handle preflight requests

// JSON parser (important for req.body)
=======
// ✅ Initialize Socket.IO for real-time dashboard updates
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ Core Middleware
>>>>>>> 646ec0e (Save current changes before pull)
app.use(express.json());

<<<<<<< HEAD
// Rate limiting (basic anti-DDOS)
=======
// ✅ Rate limiting for brute-force and abuse prevention
>>>>>>> 646ec0e (Save current changes before pull)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(limiter);

<<<<<<< HEAD
// =======================
// 💾 Attach Socket.IO to requests
// =======================
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

=======
// ✅ Attach socket.io to all requests (for broadcasting admin alerts, etc.)
>>>>>>> 646ec0e (Save current changes before pull)
app.use((req, res, next) => {
  req.io = io;
  next();
});

<<<<<<< HEAD
// =======================
// 🔌 Test MySQL connection at startup
// =======================
=======
// ✅ Database connection check
>>>>>>> 646ec0e (Save current changes before pull)
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to MySQL Database");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

<<<<<<< HEAD
// =======================
// 🗂 API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/vault", vaultRoutes); // Password vault routes

// =======================
// 🏠 Default test route
// =======================
=======
// ✅ Route definitions
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Default route
>>>>>>> 646ec0e (Save current changes before pull)
app.get("/", (req, res) => {
  res.send(
    "🚀 SmartIDS Backend is Running Securely and Accessible on the Network!"
  );
});

<<<<<<< HEAD
// =======================
// 🔌 Socket.IO connection
// =======================
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// =======================
// 🚀 Start server
// =======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running locally at: http://localhost:${PORT}`);
  console.log(`🌐 Accessible on network at:  http://${localIP}:${PORT}`);
});
=======
// ✅ Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("📡 Admin dashboard connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Admin dashboard disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
>>>>>>> 646ec0e (Save current changes before pull)
