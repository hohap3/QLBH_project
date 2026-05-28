const AuthModel = require("../models/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      const isUserTaken = duplicates.some((u) => u.TenDangNhap === username);
      if (isUserTaken)
        return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
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
      diaChi: address || null, // Đồng bộ cho phép nhận giá trị null theo nghiệp vụ cấu trúc bảng
      maVaiTro: username === "admin" ? "Manager" : "Client",
    };

    await AuthModel.createND(newUser);

    return res.status(201).json({
      message: "Đăng ký thành viên thành công!",
      data: { username: newUser.username },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      message: "Lỗi hệ thống khi đăng ký!",
      error: error.message,
    });
  }
};

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
      return res.status(401).json({ message: "Tài khoản không tồn tại!" });
    }

    // Kiểm tra trạng thái tài khoản trực tiếp
    if (user.TrangThai === false || user.TrangThai === 0) {
      return res.status(403).json({
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!",
      });
    }

    const isMatch = await bcrypt.compare(password, user.MatKhauHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác!" });
    }

    const token = jwt.sign(
      {
        maND: user.MaND,
        username: user.TenDangNhap,
        role: user.MaVaiTro,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      message: "Đăng nhập thành công!",
      token,
      user: {
        maND: user.MaND,
        username: user.TenDangNhap,
        fullname: user.HoTen,
        role: user.MaVaiTro,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Lỗi server nội bộ!" });
  }
};

// XỬ LÝ XÁC THỰC THỜI GIAN THỰC TỪ TRÌNH DUYỆT ───
exports.verifyRole = async (req, res) => {
  try {
    // req.user được lấy ra từ middleware giải mã token thành công trước đó
    const { maND } = req.user;

    // Truy vấn dữ liệu tươi mới nhất từ Database để chống gian lận
    const user = await AuthModel.findByMaND(maND);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Tài khoản không tồn tại trên hệ thống!" });
    }

    // Trường hợp Admin khóa tài khoản khi User đang lướt Web
    if (user.TrangThai === false || user.TrangThai === 0) {
      return res
        .status(403)
        .json({ message: "Tài khoản của bạn đã bị khóa bất ngờ!" });
    }

    // Trả về vai trò tuyệt đối an toàn lấy từ SQL Server
    return res.status(200).json({
      role: user.MaVaiTro,
      username: user.TenDangNhap,
      fullname: user.HoTen,
    });
  } catch (error) {
    console.error("VERIFY ROLE ERROR:", error);
    return res
      .status(500)
      .json({ message: "Lỗi kiểm tra quyền hạn hệ thống!" });
  }
};
