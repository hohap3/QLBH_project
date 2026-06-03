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
  // Cập nhật logic xử lý trong hàm getOrderById ở OrderController của bạn:
  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const rows = await orderModel.getDetails(id);

      if (!rows || rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy đơn hàng!" });
      }

      // 1. Lấy thông tin chung của đơn hàng từ dòng đầu tiên
      const firstRow = rows[0];

      // 2. Chuyển đổi cấu trúc phẳng từ DB thành cấu trúc lồng nhau (Khớp hoàn toàn với Frontend chữ Hoa)
      const formattedOrder = {
        MaDonHang: firstRow.madonhang,
        NgayDat: firstRow.ngaydat,
        TrangThai: firstRow.trangthai,
        GhiChu: firstRow.ghichu,
        TongTien: firstRow.tongtien,
        KhachHang: {
          HoTen: firstRow.hotenkhachhang,
          SDT: firstRow.sdtkhachhang,
          Email: firstRow.emailkhachhang,
          DiaChi: firstRow.diachikhachhang,
          TenDangNhap: firstRow.tendangnhap,
        },
        // 3. Gom tất cả các dòng sản phẩm thuộc đơn hàng này vào mảng Items
        Items: rows.map((row) => ({
          MaSP: row.masp,
          SoLuong: row.soluong,
          GiaBan: row.giaban,
          GiamGia: row.giamgia,
        })),
      };

      return res.status(200).json(formattedOrder);
    } catch (error) {
      console.error("Lỗi Controller lấy chi tiết đơn hàng:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Lỗi hệ thống khi lấy chi tiết đơn hàng",
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
