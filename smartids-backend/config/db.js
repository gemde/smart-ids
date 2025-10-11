import mysql from "mysql2/promise";
import dotenv from "dotenv";
<<<<<<< HEAD

// ✅ Load environment variables
const env = dotenv.config().parsed;

// ✅ Fallbacks in case .env variables are missing
const DB_CONFIG = {
  host: env?.DB_HOST || "localhost",
  user: env?.DB_USER || "root",
  password: env?.DB_PASS || "",
  database: env?.DB_NAME || "smartids",
=======

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // ✅ corrected variable name
  database: process.env.DB_NAME || "smartids",
>>>>>>> 646ec0e (Save current changes before pull)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// ✅ Create connection pool
const pool = mysql.createPool(DB_CONFIG);

export default pool;
