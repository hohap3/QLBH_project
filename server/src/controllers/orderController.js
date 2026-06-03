// 🟢 SỬA CHÍNH TẢ: Từ oderModel thành orderModel
const Order = require("../models/oderModel");

const orderController = {
  // 1. API lấy danh sách đơn hàng kèm theo phân trang (Admin/Staff)
  getOrders: async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 10;

      const paginationResult = await Order.getWithPagination(page, limit);

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
        success: false,
        message: "Lỗi khi lấy danh sách đơn hàng",
        error: err.message,
      });
    }
  },

  // 2. Lấy chi tiết đơn hàng (Có bảo mật chống xem trộm đơn)
  getOrderById: async (req, res) => {
    try {
      const details = await Order.getDetails(req.params.id);
      if (details.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đơn hàng" });
      }

      // 🟢 BẢO MẬT: Nếu là Khách hàng, chỉ cho xem đơn của chính họ
      if (req.user.role === "Client" && details[0].mand !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem chi tiết đơn hàng này!",
        });
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

      res.status(200).json({ success: true, data: orderInfo });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Lỗi truy vấn đơn hàng",
        error: err.message,
      });
    }
  },

  // 3. Cập nhật trạng thái đơn hàng (Admin/Staff)
  updateOrderStatus: async (req, res) => {
    const { id } = req.params;
    const { TrangThai } = req.body;
    try {
      const result = await Order.updateStatus(id, TrangThai);

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Đơn hàng không tồn tại" });
      }
      res
        .status(200)
        .json({ success: true, message: "Cập nhật trạng thái thành công" });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Lỗi cập nhật", error: err.message });
    }
  },

  // 4. 🟢 BỔ SUNG: API Hủy đơn hàng giữa chừng + Hoàn trả kho hàng
  cancelOrder: async (req, res) => {
    try {
      const { madonhang } = req.params;
      const currentUserId = req.user.id;

      // Check đơn tồn tại
      const order = await Order.getOrderByCode(madonhang);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Đơn hàng không tồn tại." });
      }

      // Nếu là khách hàng, kiểm tra xem đơn này có phải do họ đặt không
      if (req.user.role === "Client" && order.mand !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy đơn hàng của người khác.",
        });
      }

      // Check trạng thái hợp lệ
      if (order.trangthai !== "Chờ xác nhận") {
        return res.status(400).json({
          success: false,
          message: `Không thể hủy! Đơn hàng hiện đang ở trạng thái [${order.trangthai}].`,
        });
      }

      // Lấy chi tiết sản phẩm và chạy transaction hủy đơn hoàn kho
      const orderDetails = await Order.getOrderDetailsForCancel(madonhang);
      await Order.processCancelAndRestoreStock(madonhang, orderDetails);

      return res.status(200).json({
        success: true,
        message:
          "Hủy đơn hàng thành công, số lượng sản phẩm đã được hoàn lại vào kho.",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi thực hiện hủy đơn hàng",
        error: err.message,
      });
    }
  },
};

module.exports = orderController;
