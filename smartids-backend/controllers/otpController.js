import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import process from "process";
// import { recordFailure, clearAttempts } from "../middleware/securityMiddleware.js"; // Brute-force functions assumed available

const env = dotenv.config().parsed;
const JWT_SECRET = env?.JWT_SECRET || process.env.JWT_SECRET || "supersecretkey_dev_fallback";

// --- Helper Functions (Re-defining for completeness) ---

/**
 * Generates a 6-digit OTP.
 */
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); 
};

/**
 * Sends the OTP email using Nodemailer.
 */
const sendOtpEmail = async (email, otpCode) => {
    // ⚠️ IMPORTANT: Use environment variables for production credentials
    const EMAIL_USER = process.env.EMAIL_USER || "ronalkipro18@gmail.com";
    const EMAIL_PASS = process.env.EMAIL_PASS || "dwdb hprw nhbe qhhf"; // Use App Password

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        // Allows self-signed certificates for development/testing environments, 
        // should be removed or set carefully in production
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: `"SmartIDS" <${EMAIL_USER}>`,
        to: email,
        subject: "Your SmartIDS Login OTP",
        html: `
            <h3>SmartIDS Login Verification</h3>
            <p>Your OTP code is: <b>${otpCode}</b></p>
            <p>This code expires in <b>1 minute</b>.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};

// --- Controller Functions ---

// ✅ 1. REGISTER USER
export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const role = "user"; // Enforce default role to "user" for public registration

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
    }

    try {
        const emailNormalized = email.trim().toLowerCase();
        const [existingUser] = await pool.query("SELECT * FROM users WHERE LOWER(TRIM(email)) = ?", [emailNormalized]);

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
            [username, emailNormalized, hashedPassword, role]
        );

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Database error" });
    }
};


// ✅ 2. LOGIN USER (OTP Trigger & Brute-Force Logic)
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    // NOTE: In a real environment, you should use Express middleware to get the IP securely
    const ipAddress = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";

    if (!email || !password)
        return res.status(400).json({ message: "Email and password required" });

    try {
        const emailNormalized = email.trim().toLowerCase();
        const [users] = await pool.query("SELECT * FROM users WHERE LOWER(TRIM(email)) = ?", [emailNormalized]);
        
        // 1️⃣ User Check and Lockout Check
        if (users.length === 0) {
            // Log unsuccessful attempt (user not found)
            // recordFailure(emailNormalized, ipAddress); // Uncomment if using security middleware
            await pool.query("INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)", [email, ipAddress, 0]);
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = users[0];

        if (user.locked_until && new Date() < new Date(user.locked_until)) {
            return res.status(403).json({ message: `Account locked until ${new Date(user.locked_until).toLocaleString()}` });
        }

        // 2️⃣ Password Validation
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            // Log unsuccessful attempt (wrong password)
            // recordFailure(emailNormalized, ipAddress); // Uncomment if using security middleware
            await pool.query("INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)", [email, ipAddress, 0]);

            // Simple brute-force lockout logic (will be replaced by full middleware if imported)
            const [attempts] = await pool.query(
                "SELECT COUNT(*) AS failCount FROM login_attempts WHERE email = ? AND success = 0 AND created_at > (NOW() - INTERVAL 15 MINUTE)",
                [email]
            );

            if (attempts[0].failCount >= 4) {
                const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
                await pool.query("UPDATE users SET locked_until = ? WHERE email = ?", [lockedUntil, email]);
                return res.status(403).json({ message: "Account locked due to multiple failed attempts. Try again later." });
            }

            return res.status(401).json({ message: "Invalid credentials." });
        }

        // 3️⃣ Successful Login - Trigger 2FA
        // clearAttempts(emailNormalized, ipAddress); // Uncomment if using security middleware
        await pool.query("INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)", [email, ipAddress, 1]);


        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 60 * 1000); // expires in 1 minute

        await pool.query(
            "UPDATE users SET otp = ?, otp_expiry = ?, locked_until = NULL WHERE email = ?",
            [otp, otpExpiry, emailNormalized]
        );

        await sendOtpEmail(emailNormalized, otp);

        res.status(200).json({ message: "OTP sent successfully. Please check your email." });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error during login." });
    }
};


// ✅ 3. VERIFY OTP (Final Login Step)
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    try {
        const emailNormalized = email.trim().toLowerCase();
        const [rows] = await pool.query(
            "SELECT id, username, email, role, otp, otp_expiry FROM users WHERE LOWER(TRIM(email)) = ?",
            [emailNormalized]
        );

        if (!rows.length) return res.status(404).json({ message: "User not found" });

        const user = rows[0];
        const now = new Date();
        const expiry = new Date(user.otp_expiry);

        if (user.otp.toString() !== otp.toString()) return res.status(400).json({ message: "Invalid OTP" });
        if (now > expiry) return res.status(400).json({ message: "OTP has expired" });

        // OTP successful: Clear OTP fields
        await pool.query("UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ?", [user.id]);

        // Generate final JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role }, // Only ID and Role needed for token payload
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.status(200).json({
            message: "OTP verified successfully",
            token,
            // SECURITY: Only return necessary user info
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ message: "Server error during OTP verification." });
    }
};


// ✅ 4. RESEND OTP
export const resendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const emailNormalized = email.trim().toLowerCase();
        const [rows] = await pool.query(
            "SELECT id, email, locked_until FROM users WHERE LOWER(TRIM(email)) = ?",
            [emailNormalized]
        );
        
        if (!rows.length) return res.status(404).json({ message: "User not found" });

        const user = rows[0];

        // Ensure user isn't locked out before resending
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
            return res.status(403).json({ message: `Account locked until ${new Date(user.locked_until).toLocaleString()}` });
        }

        const otp = generateOtp();
        const otpExpiry = new Date(Date.now() + 60 * 1000);

        await pool.query("UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?", [otp, otpExpiry, user.id]);

        await sendOtpEmail(emailNormalized, otp);

        res.status(200).json({ message: "New OTP sent successfully" });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        res.status(500).json({ message: "Server error during OTP resend." });
    }
};
