// src/controllers/orderController.js
const Order = require("../models/orderModel"); // Khớp lại chính tả tên file mẫu (orderModel)

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

      // 🟢 FIX QUAN TRỌNG: Đọc dữ liệu từ 'details' bằng các key chữ thường (Postgres)
      // giữ nguyên định dạng cấu trúc JSON chữ hoa-thường ở ngoài để không làm gãy Front-end
      const orderInfo = {
        MaDonHang: details[0].madonhang,
        NgayDat: details[0].ngaydat,
        TrangThai: details[0].trangthai,
        TongTien: details[0].tongtien,
        GhiChu: details[0].ghichu,

        // Nhóm thông tin khách hàng & tài khoản liên kết
        KhachHang: {
          HoTen: details[0].hotenkhachhang,
          SDT: details[0].sdtkhachhang,
          Email: details[0].emailkhachhang,
          DiaChi: details[0].diachikhachhang,
          TenDangNhap: details[0].tendangnhap,
        },

        // Danh sách các mặt hàng nằm trong đơn này
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

      // 🟢 FIX POSTGRES: Thay thế rowsAffected[0] bằng rowCount
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
