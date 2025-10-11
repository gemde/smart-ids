import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// ✅ Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "supersecretkey", {
    expiresIn: "7d",
  });
};

// ✅ Helper: Send OTP Email
const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Smart IDS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Smart IDS OTP Code",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
          <h2>Smart IDS Login Verification</h2>
          <p>Use this OTP to verify your login:</p>
          <h1 style="color:#007bff;">${otp}</h1>
          <p>This code expires in <b>5 minutes</b>.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ OTP email failed:", error.message);
    throw new Error("Could not send OTP email");
  }
};

// -------------------- REGISTER USER --------------------
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// -------------------- LOGIN USER --------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await pool.query(
      "UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?",
      [otp, otpExpiry, user.id]
    );

    // ✅ Send OTP email
    await sendOtpEmail(email, otp);

    res.status(200).json({
      message: "OTP sent to your email. Please verify.",
      email,
      role: user.role, // 👈 Useful for UI pre-render decisions
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// -------------------- VERIFY OTP --------------------
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];

    if (!user.otp || !user.otp_expiry) {
      return res.status(400).json({ message: "No OTP found. Please login again." });
    }

    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ message: "OTP expired. Please login again." });
    }

    if (otp !== user.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Clear OTP
    await pool.query("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?", [user.id]);

    // ✅ Generate token with role
    const token = generateToken(user.id, user.role);

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP Verification Error:", error.message);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// -------------------- RESEND OTP --------------------
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      "UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?",
      [otp, otpExpiry, user.id]
    );

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: "New OTP sent to email." });
  } catch (error) {
    console.error("Resend OTP Error:", error.message);
    res.status(500).json({ message: "Server error during OTP resend" });
  }
};
