import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import process from "process";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "smartids_secret";

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    // Optional: Fetch user from DB for up-to-date info
    const [rows] = await pool.query(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [payload.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = rows[0]; // attach user object
    next();
  } catch (err) {
    console.error("verifyToken error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
