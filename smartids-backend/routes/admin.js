// routes/admin.js
import express from "express";
import {
  getAlerts,
  getRules,
  getSystemHealth,
  getTrafficLogs,
  getUsers,
} from "../controllers/adminController.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔒 Protect all admin endpoints
router.use(protect);
router.use(adminProtect);

// ✅ IDS Data routes
router.get("/alerts", getAlerts);
router.get("/rules", getRules);
router.get("/system-health", getSystemHealth);
router.get("/traffic-logs", getTrafficLogs);
router.get("/users", getUsers);

export default router;
