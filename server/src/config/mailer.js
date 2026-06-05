const { Resend } = require("resend");

// Khởi tạo đối tượng Resend sử dụng API Key cấu hình bảo mật trên Render
const resend = new Resend(process.env.RESEND_API_KEY);

// Giả lập hàm sendMail giống nodemailer cũ để bạn không phải sửa logic ở Controller
const transporter = {
  sendMail: async (mailOptions) => {
    try {
      const data = await resend.emails.send({
        // Vì tài khoản Resend miễn phí chưa cấu hình Domain riêng,
        // bạn BẮT BUỘC phải để người gửi là "onboarding@resend.dev"
        from: "HP STORE <onboarding@resend.dev>",
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      return data;
    } catch (error) {
      throw error;
    }
  },
};

console.log(
  "✅ HỆ THỐNG RESEND HTTP API ĐÃ SẴN SÀNG (BYPASS FIREWALL RENDER)!",
);

module.exports = transporter;
