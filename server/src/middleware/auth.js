const jwt = require("jsonwebtoken");

// 1. Middleware xác thực Token (Kiểm tra xem đã đăng nhập chưa)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Không tìm thấy Token. Vui lòng đăng nhập!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lưu thông tin user đã giải mã (maND, username, role) vào request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT Verify Error:", error.message);
    return res
      .status(403)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// 2. Middleware kiểm tra quyền Manager/Admin (Giữ nguyên của bạn)
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Manager") {
    return res.status(403).json({
      message: "Truy cập bị từ chối. Yêu cầu quyền Quản trị viên (Manager)!",
    });
  }
  next();
};

// 3. Middleware MỚI: Kiểm tra quyền Nhân viên (Employee)
const isEmployee = (req, res, next) => {
  if (!req.user || req.user.role !== "Employee") {
    return res.status(403).json({
      message: "Truy cập bị từ chối. Yêu cầu quyền Nhân viên (Employee)!",
    });
  }
  next();
};

// 4. Middleware CẢI TIẾN: Phân quyền linh hoạt theo mảng (Khuyên dùng)
// Giúp bạn kiểm tra nhanh nếu một API cho phép cả Manager và Employee cùng vào
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thực hiện hành động này!" });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isEmployee,
  authorizeRoles,
};
