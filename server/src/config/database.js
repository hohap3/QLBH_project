const { Pool } = require("pg");
require("dotenv").config();

// Đảm bảo lấy đúng biến process.env.DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000,
});

const poolPromise = pool
  .connect()
  .then((client) => {
    console.log("✅ Đã kết nối thành công tới PostgreSQL (Supabase)!");
    client.release();
    return pool;
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối PostgreSQL (Supabase):", err);
    process.exit(1);
  });

module.exports = {
  pool,
  poolPromise,
};
