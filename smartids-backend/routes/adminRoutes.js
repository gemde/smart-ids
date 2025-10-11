import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../config/db.js"; // Make sure this path matches your database config

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
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

// =============================
// Middleware: Admin Only Access
// =============================
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied. Admins only." });
  next();
};

// =============================
// ROUTES
// =============================

// ✅ GET all users (for admin dashboard)
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role, created_at FROM users"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// ✅ CREATE new admin
router.post("/create-admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    // Check if email already exists
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0)
      return res.status(400).json({ message: "Email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "Admin created successfully." });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Server error while creating admin." });
  }
});

// ✅ UPDATE user or admin role
router.put("/update-role/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) return res.status(400).json({ message: "Role is required." });

    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ message: "User role updated successfully." });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Failed to update role." });
  }
});

// ✅ DELETE a user or admin
router.delete("/delete/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

// ✅ ADMIN SUMMARY STATS
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const [users] = await db.query("SELECT COUNT(*) AS totalUsers FROM users");
    const [admins] = await db.query("SELECT COUNT(*) AS totalAdmins FROM users WHERE role = 'admin'");
    const [datasets] = await db.query("SELECT COUNT(*) AS totalDatasets FROM datasets");
    const [contests] = await db.query("SELECT COUNT(*) AS totalContests FROM contests");

    res.json({
      totalUsers: users[0].totalUsers,
      totalAdmins: admins[0].totalAdmins,
      totalDatasets: datasets[0]?.totalDatasets || 0,
      totalContests: contests[0]?.totalContests || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats." });
  }
});

export default router;
