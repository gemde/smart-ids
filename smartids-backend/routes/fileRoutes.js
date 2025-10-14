// routes/fileRoutes.js
import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import pool from "../config/db.js";
import { protect } from "../middleware/authMiddleware.js";
import { v4 as uuidv4 } from "uuid";
import process from "process";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const router = express.Router();

// =============================
// Setup & Helpers
// =============================

// Upload directory
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

// multer: memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// AES helpers
const generateFileKey = () => crypto.randomBytes(32); // AES-256
const generateIV = () => crypto.randomBytes(16); // 128-bit

const encryptBuffer_AES_HMAC = (buffer, key, iv) => {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const hmac = crypto.createHmac("sha256", key).update(Buffer.concat([iv, ciphertext])).digest();
  return { ciphertext, hmac };
};

const wrapKey = (masterKey, fileKey) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(fileKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
};

const unwrapKey = (masterKey, keyBlob) => {
  const iv = keyBlob.slice(0, 12);
  const tag = keyBlob.slice(12, 28);
  const enc = keyBlob.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
};

// =============================
// ROUTES
// =============================

// Upload & encrypt file
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const userId = req.user.id;
    const originalName = req.file.originalname;
    const buffer = req.file.buffer;

    const masterKeyHex = process.env.MASTER_KEY;
    if (!masterKeyHex || masterKeyHex.length < 64) {
      return res.status(500).json({ success: false, message: "MASTER_KEY missing or invalid" });
    }
    const masterKey = Buffer.from(masterKeyHex, "hex");

    const fileKey = generateFileKey();
    const iv = generateIV();
    const { ciphertext, hmac } = encryptBuffer_AES_HMAC(buffer, fileKey, iv);
    const wrappedKey = wrapKey(masterKey, fileKey);

    const storageFilename = `${Date.now()}-${uuidv4()}-${originalName.replace(/\s+/g, "_")}`;
    const storagePath = path.join(UPLOAD_DIR, storageFilename);
    await writeFile(storagePath, ciphertext);

    await pool.query(
      `INSERT INTO files (owner_id, filename_original, storage_path, key_enc, iv, hmac, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL)`,
      [userId, originalName, storageFilename, wrappedKey.toString("hex"), iv.toString("hex"), hmac.toString("hex")]
    );

    res.json({ success: true, message: "File uploaded & encrypted successfully" });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ success: false, message: "Upload failed", error: err.message });
  }
});

// List user's files
router.get("/my", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      "SELECT id, filename_original, created_at, expires_at FROM files WHERE owner_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json({ success: true, files: rows });
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create share link
router.post("/share", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileId, expiresInMinutes = 60, maxDownloads = 1 } = req.body;

    const [rows] = await pool.query("SELECT * FROM files WHERE id = ? AND owner_id = ?", [fileId, userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: "File not found" });

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    const token = uuidv4();

    await pool.query(
      "INSERT INTO shares (file_id, token, expires_at, max_downloads, downloads) VALUES (?, ?, ?, ?, 0)",
      [fileId, token, expiresAt, maxDownloads]
    );

    const shareUrl = `${req.protocol}://${req.get("host")}/api/files/share/${token}`;
    res.json({ success: true, message: "Share link created", url: shareUrl, expiresAt });
  } catch (err) {
    console.error("Share link error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// List user's share links
router.get("/shares", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT s.id, s.token, s.expires_at, s.max_downloads, s.downloads, f.filename_original
       FROM shares s
       JOIN files f ON s.file_id = f.id
       WHERE f.owner_id = ?`,
      [userId]
    );
    res.json({ success: true, shares: rows });
  } catch (err) {
    console.error("Fetch shares error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Download via share link
router.get("/share/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const [shares] = await pool.query("SELECT * FROM shares WHERE token = ?", [token]);
    if (!shares.length) return res.status(404).json({ success: false, message: "Invalid link" });

    const share = shares[0];
    if (new Date() > new Date(share.expires_at))
      return res.status(410).json({ success: false, message: "Link expired" });
    if (share.downloads >= share.max_downloads)
      return res.status(410).json({ success: false, message: "Download limit reached" });

    const [files] = await pool.query("SELECT * FROM files WHERE id = ?", [share.file_id]);
    if (!files.length) return res.status(404).json({ success: false, message: "File not found" });

    const file = files[0];
    const masterKeyHex = process.env.MASTER_KEY;
    const masterKey = Buffer.from(masterKeyHex, "hex");

    const keyEnc = Buffer.from(file.key_enc, "hex");
    const iv = Buffer.from(file.iv, "hex");
    const hmacStored = Buffer.from(file.hmac, "hex");

    const fileKey = unwrapKey(masterKey, keyEnc);
    const storagePath = path.join(UPLOAD_DIR, file.storage_path);
    if (!fs.existsSync(storagePath)) return res.status(404).json({ success: false, message: "File missing" });

    const ciphertext = fs.readFileSync(storagePath);
    const hmacComputed = crypto.createHmac("sha256", fileKey).update(Buffer.concat([iv, ciphertext])).digest();

    if (!crypto.timingSafeEqual(hmacComputed, hmacStored))
      return res.status(500).json({ success: false, message: "File integrity check failed" });

    const decipher = crypto.createDecipheriv("aes-256-cbc", fileKey, iv);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    await pool.query("UPDATE shares SET downloads = downloads + 1 WHERE id = ?", [share.id]);

    res.setHeader("Content-Disposition", `attachment; filename="${file.filename_original}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(plaintext);
  } catch (err) {
    console.error("Share download error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
