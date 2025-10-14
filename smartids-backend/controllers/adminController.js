import pool from "../config/db.js";

/**
 * @desc Fetch all users
 */
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, role, locked_until, created_at FROM users ORDER BY id DESC"
    );
    res.json({ success: true, users: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Server error fetching users" });
  }
};

/**
 * @desc Fetch overview statistics
 */
export const getOverview = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query(
      "SELECT COUNT(*) AS totalUsers FROM users"
    );

    const [[{ totalLoginAttempts }]] = await pool.query(
      "SELECT COUNT(*) AS totalLoginAttempts FROM login_attempts"
    );

    const [[{ totalSuspicious }]] = await pool.query(`
      SELECT COUNT(*) AS totalSuspicious
      FROM (
        SELECT u.id
        FROM users u
        LEFT JOIN login_attempts l ON l.user_id = u.id AND l.success = 0
        GROUP BY u.id
        HAVING COUNT(l.id) >= 3 OR u.locked_until IS NOT NULL
      ) AS subquery
    `);

    const [[{ totalAlerts }]] = await pool.query(
      "SELECT COUNT(*) AS totalAlerts FROM alerts"
    );

    res.json({ success: true, totalUsers, totalLoginAttempts, totalSuspicious, totalAlerts });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin overview data" });
  }
};

/**
 * @desc Fetch recent login attempts
 */
export const getLoginAttempts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, user_id, success, ip_address, created_at FROM login_attempts ORDER BY created_at DESC LIMIT 100"
    );
    res.json({ success: true, loginAttempts: rows });
  } catch (error) {
    console.error("Error fetching login attempts:", error);
    res.status(500).json({ success: false, message: "Server error fetching login attempts" });
  }
};

/**
 * @desc Fetch suspicious accounts
 */
export const getSuspiciousUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.email, u.locked_until, COUNT(l.id) AS failed_attempts
      FROM users u
      LEFT JOIN login_attempts l ON l.user_id = u.id AND l.success = 0
      GROUP BY u.id
      HAVING failed_attempts >= 3 OR u.locked_until IS NOT NULL
    `);
    res.json({ success: true, suspiciousUsers: rows });
  } catch (error) {
    console.error("Error fetching suspicious users:", error);
    res.status(500).json({ success: false, message: "Server error fetching suspicious users" });
  }
};

/**
 * @desc Fetch all alerts
 */
export const getAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, alert_type, severity, source_ip, destination_ip, timestamp FROM alerts ORDER BY timestamp DESC"
    );
    res.json({ success: true, alerts: rows });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ success: false, message: "Server error fetching alerts" });
  }
};

/**
 * @desc Block or unblock a user
 */
export const setUserBlock = async (req, res) => {
  try {
    const { userId, minutes } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    const lockedUntil = minutes ? new Date(Date.now() + minutes * 60 * 1000) : null;
    await pool.query("UPDATE users SET locked_until = ? WHERE id = ?", [lockedUntil, userId]);

    res.json({ success: true, message: minutes ? `User blocked for ${minutes} minutes.` : "User unblocked." });
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).json({ success: false, message: "Server error updating user block status" });
  }
};

/**
 * @desc Delete a user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user." });
  }
};
