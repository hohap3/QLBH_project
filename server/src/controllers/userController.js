const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");

const userController = {
  getProfile: async (req, res) => {
    try {
      // Lấy id truyền từ Frontend (ví dụ: /api/user/profile?id=ND001)
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

      res.status(200).json(user);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi server khi lấy profile", error: error.message });
    }
  },

  // Cập nhật thông tin
  updateProfile: async (req, res) => {
    try {
      console.log("Dữ liệu nhận từ Frontend:", req.body); // Xem MaND có tới không
      const { MaND, HoTen, Email, SDT } = req.body;

      if (!MaND)
        return res
          .status(400)
          .json({ message: "Không tìm thấy MaND trong yêu cầu" });

      const duplicate = await userModel.checkDuplicate(MaND, Email, SDT);
      console.log("Kết quả kiểm tra trùng:", duplicate);

      if (duplicate.EmailCount > 0)
        return res.status(400).json({ message: "Email đã tồn tại" });
      if (duplicate.SDTCount > 0)
        return res.status(400).json({ message: "SDT đã tồn tại" });

      await userModel.updateUser(MaND, { HoTen, Email, SDT });
      res.status(200).json({ message: "Cập nhật thành công" });
    } catch (error) {
      console.error("Lỗi Controller:", error);
      res.status(500).json({ message: "Lỗi Server" });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { MaND, OldPassword, NewPassword } = req.body;

      if (!MaND || !OldPassword || !NewPassword) {
        return res
          .status(400)
          .json({ message: "Vui lòng nhập đầy đủ thông tin" });
      }

      // 1. Lấy mật khẩu hiện tại từ DB
      const currentHash = await userModel.getPassword(MaND);
      if (!currentHash) {
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      // 2. Kiểm tra mật khẩu cũ có khớp không
      const isMatch = await bcrypt.compare(OldPassword, currentHash);
      if (!isMatch) {
        return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
      }

      // 3. Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(NewPassword, salt);

      // 4. Cập nhật vào DB
      await userModel.updatePassword(MaND, newHash);

      res.status(200).json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Lỗi server khi đổi mật khẩu" });
    }
  },
};

module.exports = userController;
