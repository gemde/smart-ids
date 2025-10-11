import express from "express";
import { 
  registerUser, 
  loginUser, 
  verifyOtp, 
  resendOtp 
} from "../controllers/authController.js";  // ✅ FIXED

const router = express.Router();

/**
 * 🔹 Register Route
 * Creates a new user with role='user'.
 */
router.post("/register", registerUser);

/**
 * 🔹 Login Route with OTP and Brute-Force Protection
 * Performs password check, handles lockouts, generates OTP, and sends email.
 */
router.post("/login", loginUser);

/**
 * 🔹 Verify OTP Route
 * Checks OTP, validates expiry, and issues the final JWT token.
 * This is the 2nd step of 2FA.
 */
router.post("/verify-otp", verifyOtp);

/**
 * 🔹 Resend OTP Route
 * Generates a new OTP and resets the timer if the user requests it.
 */
router.post("/resend-otp", resendOtp);

export default router;
