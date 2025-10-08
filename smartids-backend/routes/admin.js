import express from "express";
import pool from "../config/db.js";

const router = express.Router();

// ✅ Get all users with lockout info
router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, username, email, role, locked_until FROM users");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get recent login attempts (latest 50)
router.get("/login-attempts", async (req, res) => {
  try {
    const [attempts] = await pool.query(
      "SELECT * FROM login_attempts ORDER BY created_at DESC LIMIT 50"
    );
    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get suspicious login attempts (failed > 3 in last 1 hour)
router.get("/suspicious", async (req, res) => {
  try {
    const [suspicious] = await pool.query(
      `SELECT email, COUNT(*) as failed_attempts
       FROM login_attempts
       WHERE success = 0 AND created_at >= NOW() - INTERVAL 1 HOUR
       GROUP BY email
       HAVING failed_attempts >= 3`
    );
    res.json(suspicious);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
