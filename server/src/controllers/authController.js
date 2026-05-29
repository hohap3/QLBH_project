const AuthModel = require("../models/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 1. Xử lý Đăng ký thành viên
exports.register = async (req, res) => {
  try {
    const { fullname, username, email, phone, password, address } = req.body;

    if (!fullname || !username || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ thông tin!" });
    }

    const duplicates = await AuthModel.checkDuplicate(username, email);
    if (duplicates && duplicates.length > 0) {
      const isUserTaken = duplicates.some((u) => u.tendangnhap === username);
      if (isUserTaken) {
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
      }
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const shortID = Date.now().toString().slice(-7);
    const randomID = Math.floor(Math.random() * 100);

    const newUser = {
      maND: `ND${shortID}${randomID}`,
      maKH: `KH${shortID}${randomID}`,
      username: username,
      passwordHash: hashedPassword,
      fullname: fullname,
      email: email,
      phone: phone,
      diaChi: address || null,
      maVaiTro: "Client", // 🟢 ĐH ĐÃ SỬA: Thay vì trả về true/false, gán chuỗi chuẩn đồng bộ với Model
    };

    await AuthModel.createND(newUser);

    return res.status(201).json({
      message: "Đăng ký thành viên thành công!",
      data: { username: newUser.username },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    // 🟢 CẢI TIẾN: Trả error.message về client để hiển thị chi tiết nguyên nhân gây lỗi 500 (ví dụ: thiếu cột, sai kiểu dữ liệu...)
    return res.status(500).json({
      message: "Lỗi hệ thống khi đăng ký!",
      error: error.message,
    });
  }
};

// 2. Xử lý Đăng nhập tài khoản
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    const user = await AuthModel.findByIdentifier(identifier);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tài khoản hoặc email không tồn tại!" });
    }

    if (user.trangthai === false || user.trangthai === 0) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!",
      });
    }

    const isMatch = await bcrypt.compare(password, user.matkhauhash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác!" });
    }

    const token = jwt.sign(
      {
        maND: user.mand,
        username: user.tendangnhap,
        role: user.mavaitro,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        maND: user.mand,
        username: user.tendangnhap,
        fullname: user.hoten,
        role: user.mavaitro,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    if (error.status === 403) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: "Lỗi server nội bộ!" });
  }
};

// 3. Thẩm định quyền hạn thời gian thực
exports.verifyRole = async (req, res) => {
  try {
    const { maND } = req.user;

    const user = await AuthModel.findByMaND(maND);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tài khoản không tồn tại trên hệ thống!" });
    }

    if (user.trangthai === false || user.trangthai === 0) {
      return res
        .status(403)
        .json({ message: "Tài khoản của bạn đã bị khóa bất ngờ!" });
    }

    return res.status(200).json({
      role: user.mavaitro,
      username: user.tendangnhap,
      fullname: user.hoten,
    });
  } catch (error) {
    console.error("VERIFY ROLE ERROR:", error);
    return res
      .status(500)
      .json({ message: "Lỗi kiểm tra quyền hạn hệ thống!" });
  }
};
