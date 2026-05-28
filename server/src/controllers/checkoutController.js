// src/controllers/checkoutController.js
const checkoutModel = require("../models/checkoutModel");

const createCheckoutOrder = async (req, res) => {
  // 🟢 THAY ĐỔI: Thêm MaNguoiDung vào bóc tách dữ liệu đầu vào từ Body
  const {
    MaNguoiDung,
    NguoiNhan,
    SDTNguoiNhan,
    DiaChi,
    PhuongThucThanhToan,
    ChiTiet,
  } = req.body;

  // 1. Kiểm tra dữ liệu đầu vào chống rỗng thông tin khách hàng
  if (!NguoiNhan || !SDTNguoiNhan || !DiaChi || !PhuongThucThanhToan) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp đầy đủ thông tin giao hàng!",
    });
  }

  // 2. 🟢 THAY ĐỔI: Chặn nếu không biết ai là người đặt đơn này (đảm bảo gán được MaKH)
  if (!MaNguoiDung) {
    return res.status(401).json({
      success: false,
      message:
        "Không tìm thấy thông tin tài khoản đặt hàng. Vui lòng đăng nhập lại!",
    });
  }

  // 3. Kiểm tra giỏ hàng rỗng
  if (!ChiTiet || ChiTiet.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Giỏ hàng trống, không thể tạo đơn hàng!",
    });
  }

  try {
    // Gửi toàn bộ dữ liệu (đã chắc chắn có MaNguoiDung) sang checkoutModel xử lý transaction
    const result = await checkoutModel.saveCheckoutTransaction(req.body);

    return res.status(200).json({
      success: true,
      message: "Đơn hàng tạo thành công trên hệ thống HP STORE!",
      maDonHang: result.maDonHang,
    });
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại checkoutController:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ hệ thống, quá trình đặt hàng thất bại.",
      error: error.message,
    });
  }
};

module.exports = {
  createCheckoutOrder,
};
