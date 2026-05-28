require("dotenv").config();
const app = require("./app"); // App đã chứa cors, json và routes
const { poolPromise } = require("../src/config/database");

// Kết nối Database trước, khởi động Server sau
poolPromise
  .then(() => {
    console.log("---");
    // Sửa chữ SQL Server thành PostgreSQL (Supabase) cho đúng thực tế
    console.log("✅ Database: PostgreSQL (Supabase) đã sẵn sàng.");

    // Ưu tiên lấy PORT từ biến môi trường của Render, nếu không có thì dùng 3000
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại cổng: ${PORT}`);
      console.log("---");
    });
  })
  .catch((err) => {
    console.error("❌ Database: Không thể kết nối lên Supabase!");
    console.error("Chi tiết lỗi:", err.message);
    // Ngắt tiến trình nếu không kết nối được DB để tránh lỗi phát sinh
    process.exit(1);
  });
