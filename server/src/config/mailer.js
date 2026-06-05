const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  // 🟢 THAY ĐỔI GỐC: Sử dụng IP tĩnh IPv4 trực tiếp của smtp.gmail.com
  // Thay vì ghi "smtp.gmail.com", ta dùng IP để Node.js không thể phân giải ra IPv6 bậy bạ nữa
  host: "74.125.200.108",
  port: 465,
  secure: true, // Bắt buộc sử dụng SSL/TLS cho cổng 465

  // Ép cấu hình TLS chấp nhận chứng chỉ từ IP (vì ta đang gọi bằng IP thay vì tên miền)
  tls: {
    rejectUnauthorized: false,
  },

  // Cấu hình kéo dài thời gian phản hồi chặn drop mạng trên Render
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  dnsTimeout: 20000,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Thêm hàm kiểm tra kết nối ngay khi khởi động Server để bạn dễ theo dõi log
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ LỖI KẾT NỐI MAILER TẠI SERVER:", error.message);
  } else {
    console.log("✅ HỆ THỐNG MAILER ĐÃ SẴN SÀNG GỬI OTP!");
  }
});

module.exports = transporter;
