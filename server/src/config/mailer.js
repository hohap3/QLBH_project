const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Bắt buộc là false khi dùng cổng 587 (STARTTLS)

  // 🟢 ÉP SỬ DỤNG IPv4: Đặt trực tiếp thuộc tính này ở đây
  // để Nodemailer tự động bỏ qua bản ghi IPv6 khi phân giải DNS smtp.gmail.com
  family: 4,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // Cấu hình bảo mật TLS bổ trợ cho cổng 587
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },

  connectionTimeout: 10000, // 10 giây chờ kết nối
});

// Kiểm tra kết nối khi khởi động server
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ LỖI KẾT NỐI MAILER TẠI SERVER:", error.message);
  } else {
    console.log("✅ HỆ THỐNG MAILER ĐÃ SẴN SÀNG GỬI OTP QUA CỔNG 587!");
  }
});

module.exports = transporter;
