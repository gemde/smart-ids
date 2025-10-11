// middleware/auth.js
import jwt from "jsonwebtoken";
import process from "process";

export const verifyToken = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const secret = process.env.JWT_SECRET || "smartids_secret";
    const payload = jwt.verify(token, secret);
    req.user = payload; // { id, email?, role? }
    next();
  } 

  catch (err) {
  console.error("Error:", err.message); // ✅ now 'err' is used
  res.status(500).json({ message: "Server error" });
}

};
