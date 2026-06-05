const nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");

// Khởi tạo transport sử dụng Token API bảo mật từ Environment Render
const transporter = nodemailer.createTransport(
  MailtrapTransport({
    token: process.env.MAILTRAP_API_TOKEN, // 🟢 Đặt tên biến này trên Render Dashboard
  }),
);

// Bọc lại cấu trúc gửi mail để tương thích 100% với hàm gọi cũ của bạn
const mailer = {
  sendMail: async (mailOptions) => {
    try {
      const info = await transporter.sendMail({
        // ⚠️ BẮT BUỘC: Đối với tài khoản thử nghiệm Mailtrap API,
        // địa chỉ gửi đi bắt buộc phải là "mailtrap@demomailtrap.com" hoặc "hello@demomailtrap.co"
        from: {
          address: "hello@demomailtrap.co",
          name: "HP STORE SYSTEM",
        },
        to: [mailOptions.to], // Đổi từ chuỗi đơn sang mảng theo yêu cầu của Mailtrap API
        subject: mailOptions.subject,
        html: mailOptions.html, // Sử dụng HTML để mã OTP hiển thị đẹp mắt
      });

      console.log("👉 ĐÃ GỬI OTP THÀNH CÔNG QUA MAILTRAP API!");
      return info;
    } catch (error) {
      console.error("❌ LỖI GỬI MAILTRAP API:", error.message);
      throw error;
    }
  },
};

// Kiểm tra trạng thái khi khởi động server
console.log("✅ HỆ THỐNG MAILTRAP API TRANSPORT ĐÃ SẴN SÀNG TRÊN RENDER!");

module.exports = mailer;
