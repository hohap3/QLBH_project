const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Bỏ qua xác thực chứng chỉ tự ký trên Cloud
  },
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000,
});

// Tạo promise để kiểm tra kết nối khi khởi động app
const poolPromise = pool
  .connect()
  .then((client) => {
    console.log("✅ Đã kết nối thành công tới PostgreSQL (Neon.tech)!");
    client.release(); // Trả client về pool ngay sau khi test thành công
    return pool;
  })
  .catch((err) => {
    console.error("❌ Lỗi khởi tạo kết nối tới Neon.tech:", err.message);
    throw err; // Ném lỗi ra ngoài để server.js xử lý tập trung
  });

module.exports = {
  pool,
  poolPromise,
};
