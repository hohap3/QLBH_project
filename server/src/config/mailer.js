const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  connectionOptions: {
    family: 4,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  dnsTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng ứng dụng Google
  },
});

module.exports = transporter;
