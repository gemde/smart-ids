// controllers/adminController.js
import pool from "../config/db.js";

/**
 * @desc Fetch all alerts
 */
export const getAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, alert_type, severity, timestamp FROM alerts ORDER BY timestamp DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ message: "Server error fetching alerts" });
  }
};

/**
 * @desc Fetch all rules
 */
export const getRules = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, rule_name, description, created_at FROM rules ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching rules:", error);
    res.status(500).json({ message: "Server error fetching rules" });
  }
};

/**
 * @desc Fetch all system health logs
 */
export const getSystemHealth = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, status, cpu_usage, memory_usage, timestamp FROM system_health ORDER BY timestamp DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching system health logs:", error);
    res.status(500).json({ message: "Server error fetching system health logs" });
  }
};

/**
 * @desc Fetch all traffic logs
 */
export const getTrafficLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, source_ip, destination_ip, action, timestamp FROM traffic_logs ORDER BY timestamp DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching traffic logs:", error);
    res.status(500).json({ message: "Server error fetching traffic logs" });
  }
};

/**
 * @desc Fetch all users
 */
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, role FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};
