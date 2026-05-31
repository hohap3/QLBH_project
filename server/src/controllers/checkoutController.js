const checkoutModel = require("../models/checkoutModel");

const createCheckoutOrder = async (req, res) => {
  try {
    // 🟢 CHUẨN HÓA: Bóc tách tường minh 100% tất cả các trường từ Frontend gửi lên
    const {
      MaNguoiDung,
      NguoiNhan,
      SDTNguoiNhan,
      DiaChi,
      PhuongThucThanhToan,
      PointsToDeduct,
      TongGiamGia,
      GhiChu,
      ChiTiet,
    } = req.body;

    // 1. Kiểm tra dữ liệu đầu vào chống rỗng thông tin giao nhận
    if (!NguoiNhan || !SDTNguoiNhan || !DiaChi || !PhuongThucThanhToan) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin giao hàng!",
      });
    }

    // 2. Kiểm tra thông tin tài khoản (Chặn nếu hệ thống bắt buộc đăng nhập mới được mua)
    if (!MaNguoiDung) {
      return res.status(401).json({
        success: false,
        message:
          "Không tìm thấy thông tin tài khoản đặt hàng. Vui lòng đăng nhập lại!",
      });
    }

    // 3. Kiểm tra giỏ hàng rỗng
    if (!ChiTiet || !Array.isArray(ChiTiet) || ChiTiet.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Giỏ hàng trống hoặc không đúng định dạng, không thể tạo đơn hàng!",
      });
    }

    // 🟢 TỐI ƯU PAYLOAD: Đóng gói dữ liệu sạch, ép kiểu an toàn tránh lỗi lệch kiểu dữ liệu trong DB
    const cleanPayload = {
      MaNguoiDung: parseInt(MaNguoiDung) || MaNguoiDung, // Ép kiểu số nếu MaNguoiDung là ID số
      NguoiNhan: NguoiNhan.trim(),
      SDTNguoiNhan: SDTNguoiNhan.trim(),
      DiaChi: DiaChi.trim(),
      PhuongThucThanhToan: PhuongThucThanhToan,
      GhiChu: GhiChu ? GhiChu.trim() : null,
      PointsToDeduct: parseInt(PointsToDeduct) || 0, // Đảm bảo luôn là số nguyên, tránh rác hoặc số thập phân
      TongGiamGia: parseFloat(TongGiamGia) || 0, // Đảm bảo là số thực/decimal phù hợp DB
      ChiTiet: ChiTiet.map((item) => ({
        MaSP: item.MaSP || item.masp,
        SoLuong: parseInt(item.SoLuong) || 0,
        GiaBan: parseFloat(item.GiaBan) || 0,
        GiamGia: parseFloat(item.GiamGia) || 0, // Tránh số lẻ thập phân chưa làm tròn khi chia phần trăm
      })),
    };

    // Gửi payload sạch đã qua chuẩn hóa sang Model xử lý SQL Transaction
    const result = await checkoutModel.saveCheckoutTransaction(cleanPayload);

    return res.status(200).json({
      success: true,
      message: "Đơn hàng tạo thành công trên hệ thống HP STORE!",
      maDonHang: result.maDonHang || result.MaDonHang,
    });
  } catch (error) {
    // Lưu ý: Toàn bộ lỗi từ Model (Lỗi kết nối Postgres, sai tên cột, sai Trigger...) sẽ rơi vào đây
    console.error("🔥 Lỗi nghiêm trọng tại checkoutController:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ hệ thống, quá trình đặt hàng thất bại.",
      error: error.message, // Trả ra message lỗi cụ thể của Postgres giúp bạn debug cực nhanh
    });
  }
};

module.exports = {
  createCheckoutOrder,
};
