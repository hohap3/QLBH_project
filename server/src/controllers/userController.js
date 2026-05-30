const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

const userController = {
  // [GET] Lấy thông tin tài khoản cá nhân
  getProfile: async (req, res) => {
    try {
      const maND = req.query.id;

      if (!maND) {
        return res.status(400).json({ message: "Thiếu ID người dùng" });
      }

      const user = await userModel.getUserById(maND);

      if (!user) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy người dùng trong hệ thống" });
      }

      // Trả về Object chứa chữ thường (mand, tendangnhap, hoten...) theo cơ chế Postgres
      res.status(200).json(user);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy profile", error: error.message });
    }
  },

  // [POST/PUT] Cập nhật thông tin tài khoản
  updateProfile: async (req, res) => {
    try {
      console.log("Dữ liệu nhận từ Frontend:", req.body);
      const { MaND, HoTen, Email, SDT } = req.body;

      if (!MaND) {
        return res
          .status(400)
          .json({ message: "Không tìm thấy MaND trong yêu cầu" });
      }

      // Kiểm tra trùng lặp
      const duplicate = await userModel.checkDuplicate(MaND, Email, SDT);
      console.log("Kết quả kiểm tra trùng:", duplicate);

      // 🟢 ĐỒNG BỘ: Đọc kết quả dạng chữ thường từ Postgres (emailcount và sdtcount)
      if (duplicate && duplicate.emailcount > 0) {
        return res
          .status(400)
          .json({ message: "Email đã tồn tại ở tài khoản khác" });
      }
      if (duplicate && duplicate.sdtcount > 0) {
        return res
          .status(400)
          .json({ message: "Số điện thoại đã tồn tại ở tài khoản khác" });
      }

      // Tiến hành cập nhật dữ liệu
      await userModel.updateUser(MaND, { HoTen, Email, SDT });
      res
        .status(200)
        .json({ success: true, message: "Cập nhật thông tin thành công!" });
    } catch (error) {
      console.error("Lỗi Controller (updateProfile):", error);
      res.status(500).json({ message: "Lỗi Server khi cập nhật thông tin!" });
    }
  },

  // [POST] Đổi mật khẩu tài khoản
  changePassword: async (req, res) => {
    try {
      const { MaND, OldPassword, NewPassword } = req.body;

      if (!MaND || !OldPassword || !NewPassword) {
        return res
          .status(400)
          .json({ message: "Vui lòng nhập đầy đủ thông tin yêu cầu!" });
      }

      // 1. Lấy mật khẩu băm hiện tại từ DB
      const currentHash = await userModel.getPassword(MaND);
      if (!currentHash) {
        return res.status(404).json({ message: "Người dùng không tồn tại!" });
      }

      // 2. Kiểm tra đối chiếu mật khẩu cũ
      const isMatch = await bcrypt.compare(OldPassword, currentHash);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Mật khẩu cũ không chính xác!" });
      }

      // 3. Tiến hành mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(NewPassword, salt);

      // 4. Lưu cập nhật vào DB
      await userModel.updatePassword(MaND, newHash);

      res
        .status(200)
        .json({ success: true, message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      console.error("Lỗi Controller (changePassword):", error);
      res.status(500).json({ message: "Lỗi server khi đổi mật khẩu!" });
    }
  },
};

module.exports = userController;
