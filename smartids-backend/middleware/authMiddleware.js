import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import process from "process";

/**
 * @desc Middleware to protect routes: verifies JWT and attaches user to req.
 */
export const protect = async (req, res, next) => {
    let token;
    const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey_dev_fallback";

    // 1. Check if token exists in headers (Bearer <token>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            // Extract the token
            token = req.headers.authorization.split(" ")[1];
            
            // 2. Verify token using the secret from .env
            const decoded = jwt.verify(token, JWT_SECRET);

            // 3. Fetch user data (excluding password/OTP) and attach to request
            // We use the ID from the JWT payload
            const [rows] = await pool.query(
                "SELECT id, username, email, role FROM users WHERE id = ?",
                [decoded.id]
            );

            if (rows.length === 0) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            // Attach user data to the request object
            req.user = rows[0]; 
            next();

        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            // This catches expired tokens, invalid signatures, etc.
            return res.status(401).json({ message: "Not authorized, token failed or expired" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
    }
};

/**
 * @desc Middleware to enforce Administrator role access.
 */
export const adminProtect = (req, res, next) => {
    // This runs AFTER the 'protect' middleware, so req.user is guaranteed to exist.
    // Check if the attached user has the role of 'admin'
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        // Forbidden access if user is authenticated but not an admin
        res.status(403).json({ message: "Forbidden: Access restricted to administrators." });
    }
};
