// routes/adminRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import process from "process";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// =============================
// Middleware: Verify Token
// =============================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "Access denied. No token provided." });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// =============================
// Middleware: Admin Only
// =============================
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied. Admins only." });
  next();
};

// =============================
// ✅ Get All Users
// =============================
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role, locked_until, created_at FROM users"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// =============================
// ✅ Get Recent Login Attempts
// =============================
router.get("/login-attempts", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [attempts] = await db.query(
      `SELECT id, email, ip_address, success, created_at AS timestamp 
       FROM login_attempts 
       ORDER BY created_at DESC 
       LIMIT 20`
    );

    // Normalize results to match frontend keys
    const formatted = attempts.map(a => ({
      id: a.id,
      email: a.email,
      ip_address: a.ip_address,
      success: a.success === 1,
      timestamp: a.timestamp,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching login attempts:", error);
    res.status(500).json({ message: "Failed to fetch login attempts." });
  }
});

// =============================
// ✅ Get Suspicious Accounts
// =============================
router.get("/suspicious", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT email, COUNT(*) AS failed_attempts
      FROM login_attempts
      WHERE success = 0
      GROUP BY email
      HAVING failed_attempts >= 3
      ORDER BY failed_attempts DESC
      LIMIT 10
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching suspicious accounts:", error);
    res.status(500).json({ message: "Failed to fetch suspicious accounts." });
  }
});

// =============================
// ✅ Admin Summary Stats
// =============================
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [admins] = await db.query(
      "SELECT COUNT(*) AS totalAdmins FROM users WHERE role = 'admin'"
    );
    const [attempts] = await db.query(
      "SELECT COUNT(*) AS totalAttempts FROM login_attempts"
    );

    res.json({
      totalUsers: users[0].totalUsers,
      totalAdmins: admins[0].totalAdmins,
      totalAttempts: attempts[0].totalAttempts,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats." });
  }
});

export default router;
