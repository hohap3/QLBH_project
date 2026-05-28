const Order = require("../models/oderModel");

const orderController = {
  // Lấy toàn bộ đơn hàng
  getOrders: async (req, res) => {
    try {
      const data = await Order.getAll();
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({
        message: "Lỗi khi lấy danh sách đơn hàng",
        error: err.message,
      });
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderById: async (req, res) => {
    try {
      const details = await Order.getDetails(req.params.id);
      if (details.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      // Format dữ liệu lồng phần thông tin Khách hàng - Tài khoản và Danh sách sản phẩm mua
      const orderInfo = {
        MaDonHang: details[0].MaDonHang,
        NgayDat: details[0].NgayDat,
        TrangThai: details[0].TrangThai,
        TongTien: details[0].TongTien,
        GhiChu: details[0].GhiChu,

        // Nhóm thông tin khách hàng & tài khoản liên kết
        KhachHang: {
          HoTen: details[0].HoTenKhachHang,
          SDT: details[0].SDTKhachHang,
          Email: details[0].EmailKhachHang,
          DiaChi: details[0].DiaChiKhachHang,
          TenDangNhap: details[0].TenDangNhap, // Tên đăng nhập từ NGUOIDUNG
        },

        // Danh sách các mặt hàng nằm trong đơn này
        Items: details.map((item) => ({
          MaSP: item.MaSP,
          SoLuong: item.SoLuong,
          GiaBan: item.GiaBan,
          GiamGia: item.GiamGia,
        })),
      };

      res.status(200).json(orderInfo);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi truy vấn đơn hàng", error: err.message });
    }
  },

  // Cập nhật trạng thái (ví dụ: Chuyển từ Đang xử lý -> Đã giao)
  updateOrderStatus: async (req, res) => {
    const { id } = req.params;
    const { TrangThai } = req.body;
    try {
      const result = await Order.updateStatus(id, TrangThai);
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi cập nhật", error: err.message });
    }
  },
};

module.exports = orderController;
