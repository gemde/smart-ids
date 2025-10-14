import express from "express";
import {
  getAllUsers,
  deleteUser,
  blockUser,
  getLoginAttempts,
  getSuspiciousAccounts,
  getAdminStats,
} from "../controllers/adminController.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Protect all admin endpoints
router.use(protect);
router.use(adminProtect);

// ✅ Admin Dashboard Routes

// Get all registered users
router.get("/users", getAllUsers);

// Delete a user by ID
router.delete("/users/:id", deleteUser);

// Block a user for a certain period (in minutes)
router.put("/users/block/:id", blockUser);

// Get login attempts (for IDS monitoring)
router.get("/login-attempts", getLoginAttempts);

// Get suspicious accounts
router.get("/suspicious", getSuspiciousAccounts);

// Admin summary stats (optional)
router.get("/stats", getAdminStats);

export default router;
