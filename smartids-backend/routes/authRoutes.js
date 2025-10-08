import express from "express";
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { registerUser } from "../controllers/authController.js"; // Keep register from controller

const router = express.Router();

/**
 * 🔹 Register Route
 * Uses controller for clean separation
 */
router.post("/register", registerUser);

/**
 * 🔹 Login Route with OTP + login attempts tracking
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";

  try {
    // 1️⃣ Check if user exists
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      // Log unsuccessful attempt
      await pool.query(
        "INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)",
        [email, ip, 0]
      );
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // 2️⃣ Check if user is locked out
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(403).json({ message: `Account locked until ${user.locked_until}` });
    }

    // 3️⃣ Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // Log unsuccessful attempt
      await pool.query(
        "INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)",
        [email, ip, 0]
      );

      // Count failed attempts in last 15 minutes
      const [attempts] = await pool.query(
        "SELECT COUNT(*) AS failCount FROM login_attempts WHERE email = ? AND success = 0 AND created_at > (NOW() - INTERVAL 15 MINUTE)",
        [email]
      );

      if (attempts[0].failCount >= 4) {
        // Lock account for 15 minutes
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await pool.query("UPDATE users SET locked_until = ? WHERE email = ?", [lockedUntil, email]);
        return res.status(403).json({ message: "Account locked due to multiple failed attempts. Try again later." });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Generate 6-digit OTP + 1-minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 60 * 1000); // expires in 1 minute

    // 5️⃣ Store OTP in DB and clear locked_until
    await pool.query(
      "UPDATE users SET otp = ?, otp_expiry = ?, locked_until = NULL WHERE email = ?",
      [otp, otpExpiry, email]
    );

    // 6️⃣ Log successful login attempt
    await pool.query(
      "INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)",
      [email, ip, 1]
    );

    // 7️⃣ Send OTP via Gmail (App Password required)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ronalkipro18@gmail.com",
        pass: "dwdb hprw nhbe qhhf", // 🔒 use Gmail App Password
      },
    });

    const mailOptions = {
      from: '"SmartIDS" <ronalkipro18@gmail.com>',
      to: email,
      subject: "Your SmartIDS Login OTP",
      html: `
        <h3>SmartIDS Login Verification</h3>
        <p>Your OTP code is: <b>${otp}</b></p>
        <p>This code expires in <b>1 minute</b>.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
