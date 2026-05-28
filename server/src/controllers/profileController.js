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

      res.status(200).json(profile);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi lấy hồ sơ!" });
    }
  }

  // Cập nhật thông tin tài khoản
  static async updateProfile(req, res) {
    try {
      const { maND } = req.params;
      const { HoTen, SDT, Email, DiaChi } = req.body;

      if (!HoTen || !SDT) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Họ tên và Số điện thoại là bắt buộc!",
          });
      }

      await ProfileModel.updateProfile(maND, { HoTen, SDT, Email, DiaChi });
      res
        .status(200)
        .json({ success: true, message: "Cập nhật thông tin thành công!" });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi cập nhật hồ sơ!" });
    }
  }

  // Thay đổi mật khẩu
  static async changePassword(req, res) {
    try {
      const { maND } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Vui lòng nhập đủ mật khẩu cũ và mới!",
          });
      }

      // TỐI ƯU: Chặn mật khẩu quá ngắn ngay tại Backend để nâng cao bảo mật
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({
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

      const isMatch = await bcrypt.compare(currentPassword, user.MatKhauHash);
      if (!isMatch) {
        return res
          .status(400)
          .json({
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
      console.error(err);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi đổi mật khẩu!" });
    }
  }
}

module.exports = ProfileController;
