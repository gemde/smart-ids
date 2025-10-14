// routes/otpRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
} from "../controllers/otpController.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
router.post("/register", registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Initiate login and send OTP
 */
router.post("/login", loginUser);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and issue JWT
 */
router.post("/verify-otp", verifyOtp);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email
 */
router.post("/resend-otp", resendOtp);

export default router;
