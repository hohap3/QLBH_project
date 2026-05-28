const { Pool } = require("pg");
require("dotenv").config();

// Cấu hình kết nối bằng đường dẫn DATABASE_URL của Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Bắt buộc phải có để kết nối an toàn lên Cloud Supabase
  },
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000,
});

// Giữ nguyên tên poolPromise để file server.js không bị lỗi khi import
const poolPromise = pool
  .connect()
  .then((client) => {
    console.log("✅ Đã kết nối thành công tới PostgreSQL (Supabase)!");
    client.release(); // Giải phóng client ngay sau khi test kết nối thành công
    return pool; // Trả về pool để thực hiện các truy vấn sau này
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối PostgreSQL (Supabase):", err);
    process.exit(1);
  });

module.exports = {
  pool, // Xuất thêm pool để dùng trực tiếp trong controllers
  poolPromise, // Giữ nguyên để phục vụ file server.js
};
