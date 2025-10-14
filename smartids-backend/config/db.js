import mysql from "mysql2/promise";
import dotenv from "dotenv";

// ✅ Load environment variables
dotenv.config();

// ✅ Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smartids",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Export pool
export default pool;
