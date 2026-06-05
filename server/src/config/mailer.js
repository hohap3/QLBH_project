const nodemailer = require("nodemailer");

// Sử dụng cấu hình SMTP Sandbox tiêu chuẩn của Mailtrap
const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "2e6383f826ee5d",
    pass: "ec230fa76ba898",
  },
});

const mailer = {
  sendMail: async (mailOptions) => {
    try {
      const info = await transporter.sendMail({
        from: '"HP STORE SYSTEM" <no-reply@hpstore.com>', // Tên người gửi hiển thị ảo
        to: mailOptions.to, // 🟢 TỰ ĐỘNG LẤY EMAIL TRONG DB (từ authController truyền sang)
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      console.log(`👉 Đã gửi OTP thành công tới email: ${mailOptions.to}`);
      return info;
    } catch (error) {
      console.error("❌ Lỗi gửi mail qua Mailtrap SMTP:", error.message);
      throw error;
    }
  },
};

module.exports = mailer;
