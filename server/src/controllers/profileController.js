const ProfileModel = require("../models/profileModel");
const bcrypt = require("bcrypt");

class ProfileController {
  // Lấy thông tin tài khoản
  static async getProfile(req, res) {
    try {
      const { maND } = req.params;
      const profile = await ProfileModel.getProfileByMaND(maND);

      if (!profile) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy người dùng!" });
      }

      // Trả về dữ liệu (Lúc này các thuộc tính đều là chữ thường theo chuẩn Postgres)
      res.status(200).json(profile);
    } catch (err) {
      console.error("GET PROFILE ERROR:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thông tin hồ sơ!",
        error: err.message,
      });
    }
  }

  // Cập nhật thông tin tài khoản
  static async updateProfile(req, res) {
    try {
      const { maND } = req.params;
      // Nhận dữ liệu từ req.body (giữ nguyên quy tắc camelCase/PascalCase từ Frontend gửi lên nếu có)
      const { HoTen, SDT, Email, DiaChi } = req.body;

      if (!HoTen || !SDT) {
        return res.status(400).json({
          success: false,
          message: "Họ tên và Số điện thoại là bắt buộc!",
        });
      }

      // Đổi sang key tương ứng với cấu trúc biến dùng trong Model
      await ProfileModel.updateProfile(maND, {
        hoten: HoTen,
        sdt: SDT,
        email: Email,
        diachi: DiaChi,
      });

      res
        .status(200)
        .json({ success: true, message: "Cập nhật thông tin thành công!" });
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi cập nhật hồ sơ!",
        error: err.message,
      });
    }
  }

  // Thay đổi mật khẩu
  static async changePassword(req, res) {
    try {
      const { maND } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập đủ mật khẩu cũ và mới!",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới phải từ 6 ký tự trở lên!",
        });
      }

      const user = await ProfileModel.getPasswordHash(maND);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Người dùng không tồn tại!" });
      }

      // ĐÃ SỬA: Đọc đúng trường chữ thường 'matkhauhash' trả về từ Postgres
      const isMatch = await bcrypt.compare(currentPassword, user.matkhauhash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác!",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      await ProfileModel.updatePassword(maND, newPasswordHash);

      res
        .status(200)
        .json({ success: true, message: "Thay đổi mật khẩu thành công!" });
    } catch (err) {
      console.error("CHANGE PASSWORD ERROR:", err);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi đổi mật khẩu!",
        error: err.message,
      });
    }
  }
}

module.exports = ProfileController;
