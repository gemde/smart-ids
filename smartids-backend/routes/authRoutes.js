import express from "express";
import { 
  registerUser, 
  loginUser, 
  verifyOtp, 
  resendOtp 
} from "../controllers/authController.js";

const router = express.Router();

// =============================
// 🔹 AUTH ROUTES
// =============================

// ✅ Register a new user (role='user')
router.post("/register", registerUser);

// ✅ Login (Step 1: password verification + generate OTP)
router.post("/login", loginUser);

// ✅ Verify OTP (Step 2: final JWT issued)
router.post("/otp", verifyOtp);

// ✅ Resend OTP if expired or lost
router.post("/resend-otp", resendOtp);

export default router;
