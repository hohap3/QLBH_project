const { Pool } = require("pg");
require("dotenv").config();

// Cấu hình hoàn hảo cho cả Supabase và Neon.tech
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Giúp bỏ qua lỗi check chứng chỉ tự ký của Cloud AWS/Neon
  },
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000,
});

const poolPromise = pool
  .connect()
  .then((client) => {
    // Sửa chữ hiển thị ở đây cho đúng thực tế Neon.tech
    console.log("✅ Đã kết nối thành công tới PostgreSQL (Neon.tech)!");
    client.release();
    return pool;
  })
  .catch((err) => {
    // Sửa chữ hiển thị ở đây
    console.error("❌ Lỗi kết nối PostgreSQL (Neon.tech):", err);
    process.exit(1);
  });

module.exports = {
  pool,
  poolPromise,
};
