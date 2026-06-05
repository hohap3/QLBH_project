const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "hohap3@gmail.com", // Email hệ thống HP STORE
    pass: "aaoh kqxa kilr uspg", // Mật khẩu ứng dụng Google (16 ký tự)
  },
});

module.exports = transporter;
