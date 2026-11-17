const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Khởi tạo Nodemailer Transporter (Dùng khi chạy Local với Gmail App Password hoặc SMTP riêng)
const createSmtpTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ""), // Tự động bỏ khoảng trắng trong App Password 16 ký tự
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return null;
};

const mailer = {
  sendMail: async (mailOptions) => {
    try {
      const fromName = "HP STORE SYSTEM";
      const fromEmail =
        (process.env.EMAIL_USER && process.env.EMAIL_USER.trim()) ||
        "no-reply@hpstore.com";

      // =========================================================================
      // 🟢 CÁCH 1 (KHUYÊN DÙNG TRÊN RENDER FREE): Gửi Gmail thật qua Google Apps Script (HTTPS 443)
      // Render Free chặn cổng SMTP (25, 465, 587), nhưng cho phép gọi HTTPS 443.
      // Chỉ cần cấu hình biến GOOGLE_SCRIPT_URL trên Render / .env
      // =========================================================================
      if (process.env.GOOGLE_SCRIPT_URL) {
        const response = await fetch(process.env.GOOGLE_SCRIPT_URL.trim(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            fromName: fromName,
          }),
          redirect: "follow",
        });

        const resultText = await response.text();
        let result;
        try {
          result = JSON.parse(resultText);
        } catch {
          result = { success: response.ok };
        }

        if (!response.ok || result.success === false) {
          throw new Error(
            result.error || `Google Apps Script trả về lỗi HTTP ${response.status}`,
          );
        }

        console.log(
          `👉 [Google Apps Script] Đã gửi OTP thành công tới Gmail: ${mailOptions.to}`,
        );
        return result;
      }

      // =========================================================================
      // 🟢 CÁCH 2 (DÙNG TRÊN RENDER FREE): Gửi Gmail thật qua Brevo HTTP API (HTTPS 443)
      // Không cần mua tên miền riêng, chỉ cần xác thực Gmail gửi đi trên Brevo.com
      // Cần cấu hình BREVO_API_KEY và EMAIL_USER trên Render / .env
      // =========================================================================
      if (process.env.BREVO_API_KEY) {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY.trim(),
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            data.message || `Brevo API lỗi HTTP ${response.status}`,
          );
        }

        console.log(
          `👉 [Brevo HTTP API] Đã gửi OTP thành công tới email: ${mailOptions.to}`,
        );
        return data;
      }

      // =========================================================================
      // 🟢 CÁCH 3 (CHẠY LOCALHOST): Gửi qua Gmail SMTP bằng EMAIL_USER & EMAIL_PASS
      // Lưu ý: Render Free chặn cổng SMTP 465/587 nên cách này chỉ chạy ở Localhost
      // hoặc Render gói trả phí.
      // =========================================================================
      const smtpTransporter = createSmtpTransporter();
      if (smtpTransporter) {
        const info = await smtpTransporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: mailOptions.to,
          subject: mailOptions.subject,
          html: mailOptions.html,
        });
        console.log(
          `👉 [Gmail SMTP] Đã gửi OTP thành công tới email: ${mailOptions.to}`,
        );
        return info;
      }

      // Nếu chưa cấu hình bất kỳ biến môi trường gửi mail nào -> Báo lỗi rõ ràng
      throw new Error(
        "Chưa cấu hình dịch vụ gửi Email! Vui lòng thêm GOOGLE_SCRIPT_URL (hoặc BREVO_API_KEY / EMAIL_USER + EMAIL_PASS) vào Environment trên Render và file .env",
      );
    } catch (error) {
      console.error("❌ Lỗi gửi mail:", error.message);
      throw error;
    }
  },
};

module.exports = mailer;
