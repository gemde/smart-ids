import express from "express";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import process from "process";

const router = express.Router();

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  try {
    const emailNormalized = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = ?",
      [emailNormalized]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    if (!user.otp || !user.otp_expiry) return res.status(400).json({ message: "OTP not generated or expired" });

    const now = new Date();
    const expiry = new Date(user.otp_expiry);

    if (user.otp.toString() !== otp.toString()) return res.status(400).json({ message: "Invalid OTP" });
    if (now > expiry) return res.status(400).json({ message: "OTP has expired" });

    await pool.query("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const emailNormalized = email.trim().toLowerCase();
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = ?",
      [emailNormalized]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 60 * 1000);

    await pool.query("UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?", [otp, otpExpiry, user.id]);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"SmartIDS" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your SmartIDS Login OTP",
      html: `<h3>SmartIDS Login Verification</h3><p>Your OTP code is: <b>${otp}</b></p><p>Expires in 1 minute.</p>`,
    });

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
