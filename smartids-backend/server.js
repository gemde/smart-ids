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

// Import database & routes
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import vaultRoutes from "./routes/vaultRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";

// =======================
// Load environment variables
// =======================
dotenv.config();

// =======================
// Initialize app & server
// =======================
const app = express();
const server = http.createServer(app);

// =======================
// Utility: Get local network IP
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
// 🛡 Security & Middleware
// =======================
const allowedOrigins = [
  "http://localhost:5173",
  `http://${localIP}:5173`, // LAN frontend access
];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options(/.*/, cors()); // Handle preflight
app.use(express.json());

// ✅ Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use(limiter);

// =======================
// 💾 Attach Socket.IO
// =======================
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

// Make socket available in all routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =======================
// 🔌 Test MySQL connection
// =======================
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Connected to MySQL Database");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

// =======================
// 🗂 API Routes
// =======================
app.use("/api/auth", authRoutes);
app.use("/api/auth", otpRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/vault", vaultRoutes);

// =======================
// 🏠 Default test route
// =======================
app.get("/", (req, res) => {
  res.send(
    "🚀 SmartIDS Backend is Running Securely and Accessible on the Network!"
  );
});

// =======================
// 🔌 Socket.IO connections
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
  console.log(`🌐 Accessible on network at: http://${localIP}:${PORT}`);
});
