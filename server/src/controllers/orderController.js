// Khớp đúng chính tả file model: orderModel
const Order = require("../models/oderModel");

const orderController = {
  // 🟢 CẬP NHẬT: API lấy danh sách đơn hàng kèm theo phân trang (10 đơn/trang)
  getOrders: async (req, res) => {
    try {
      // Đọc số trang từ URL (Ví dụ: /api/orders?page=2). Mặc định là trang 1 nếu trống.
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 10; // Cấu hình cứng hiển thị đúng 10 đơn hàng mỗi trang

      const paginationResult = await Order.getWithPagination(page, limit);

      // Phản hồi kết quả chuẩn hóa về cho Client
      res.status(200).json({
        success: true,
        currentPage: page,
        limitPerPage: limit,
        totalRecords: paginationResult.totalRecords,
        totalPages: paginationResult.totalPages,
        data: paginationResult.orders,
      });
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

      const orderInfo = {
        MaDonHang: details[0].madonhang,
        NgayDat: details[0].ngaydat,
        TrangThai: details[0].trangthai,
        TongTien: details[0].tongtien,
        GhiChu: details[0].ghichu,

        KhachHang: {
          HoTen: details[0].hotenkhachhang,
          SDT: details[0].sdtkhachhang,
          Email: details[0].emailkhachhang,
          DiaChi: details[0].diachikhachhang,
          TenDangNhap: details[0].tendangnhap,
        },

        Items: details.map((item) => ({
          MaSP: item.masp,
          SoLuong: item.soluong,
          GiaBan: item.giaban,
          GiamGia: item.giamgia,
        })),
      };

      res.status(200).json(orderInfo);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi truy vấn đơn hàng", error: err.message });
    }
  },

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (req, res) => {
    const { id } = req.params;
    const { TrangThai } = req.body;
    try {
      const result = await Order.updateStatus(id, TrangThai);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Đơn hàng không tồn tại" });
      }
      res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (err) {
      res.status(500).json({ message: "Lỗi cập nhật", error: err.message });
    }
  },
};

module.exports = orderController;
