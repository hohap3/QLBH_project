require("dotenv").config();
const app = require("./app"); // App đã chứa cors, json và routes
const express = require("express");
const { poolPromise } = require("../src/config/database");
const path = require("path");

// Kết nối Database trước, khởi động Server sau
poolPromise
  .then(() => {
    console.log("---");
    // Đã cập nhật thông tin hiển thị chính xác cho Neon.tech
    console.log("✅ Database: PostgreSQL (Neon.tech) đã sẵn sàng.");

    // Ưu tiên lấy PORT từ biến môi trường của Render, nếu không có thì dùng 3000
    app.use(
      "/uploads",
      express.static(path.join(__dirname, "src/public/uploads")),
    );
    console.log("📂 Thư mục static '/uploads' đã được cấu hình.");
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại cổng: ${PORT}`);
      console.log("---");
    });
  })
  .catch((err) => {
    console.error("❌ Database: Không thể kết nối lên Neon.tech!");
    console.error("Chi tiết lỗi:", err.message);
    // Ngắt tiến trình nếu không kết nối được DB để tránh lỗi phát sinh
    process.exit(1);
  });
