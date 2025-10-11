import mysql from "mysql2/promise";
import dotenv from "dotenv";

// ✅ Load environment variables
const env = dotenv.config().parsed;

// ✅ Fallbacks in case .env variables are missing
const DB_CONFIG = {
  host: env?.DB_HOST || "localhost",
  user: env?.DB_USER || "root",
  password: env?.DB_PASS || "",
  database: env?.DB_NAME || "smartids",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// ✅ Create connection pool
const pool = mysql.createPool(DB_CONFIG);

export default pool;
