const nodemailer = require("nodemailer");
const dns = require("dns");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Bắt buộc là false đối với cổng 587 (STARTTLS)

  // 🟢 THAY ĐỔI CỐT LÕI: Tự định nghĩa hàm phân giải DNS
  // Ép Node.js chỉ lấy địa chỉ IPv4 (family: 4) khi tìm tên miền smtp.gmail.com
  lookup: (hostname, options, callback) => {
    return dns.lookup(hostname, { family: 4 }, callback);
  },

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },

  connectionTimeout: 15000, // 15 giây chờ kết nối
});

// Kiểm tra kết nối ngay khi khởi động Server
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ LỖI KẾT NỐI MAILER TẠI SERVER:", error.message);
  } else {
    console.log(
      "✅ HỆ THỐNG MAILER ĐÃ SẴN SÀNG GỬI OTP QUA CỔNG 587 (IPv4 FIXED)!",
    );
  }
});

module.exports = transporter;
