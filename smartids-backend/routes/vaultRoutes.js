import express from "express";
import CryptoJS from "crypto-js";
import pool from "../config/db.js"; // your MySQL pool

const router = express.Router();

// -------------------------------
// Table structure suggestion (MySQL):
// CREATE TABLE password_vault (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   service VARCHAR(255) NOT NULL,
//   data TEXT NOT NULL,
//   key VARCHAR(255) NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
// -------------------------------

// Save encrypted password
router.post("/save", async (req, res) => {
  try {
    const { user_id, service, password } = req.body;
    if (!user_id || !service || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Generate a random AES key
    const key = CryptoJS.lib.WordArray.random(16).toString();
    const ciphertext = CryptoJS.AES.encrypt(password, key).toString();

    // Store in DB


    const [result] = await pool.query(
  "INSERT INTO password_vault (user_id, service, data, aes_key) VALUES (?, ?, ?, ?)",
  [user_id, service, ciphertext, key]
);


    res.json({
      message: "Password saved successfully!",
      id: result.insertId,
      key, // display this once to user
    });
  } catch (err) {
    console.error("Error saving password:", err);
    res.status(500).json({ message: "Server error saving password" });
  }
});

// Decrypt password
router.post("/decrypt", async (req, res) => {
  try {
    const { id, key } = req.body;
    if (!id || !key) {
      return res.status(400).json({ message: "Missing password ID or key" });
    }

    // Retrieve stored ciphertext
    const [rows] = await pool.query("SELECT data FROM password_vault WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Password not found" });

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(rows[0].data, key).toString(CryptoJS.enc.Utf8);
    if (!decrypted) return res.status(400).json({ message: "Invalid key or data" });

    res.json({ decrypted });
  } catch (err) {
    console.error("Decryption error:", err);
    res.status(500).json({ message: "Server error during decryption" });
  }
});

// Fetch all passwords for a user (optional)
router.get("/list/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, service, data FROM password_vault WHERE user_id = ? ORDER BY created_at DESC",
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching passwords:", err);
    res.status(500).json({ message: "Server error fetching passwords" });
  }
});

export default router;
