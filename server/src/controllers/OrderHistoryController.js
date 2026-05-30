const OrderHistoryModel = require("../models/orderHistoryModel");

const orderHistoryController = {
  getOurOrderHistory: async (req, res) => {
    try {
      // Lấy mã người dùng từ Middleware verifyToken truyền vào (Ưu tiên mand chữ thường)
      const maND = req.user?.mand || req.user?.maND || req.user?.id;

      console.log("=== HP STORE AUTH DEBUG ===");
      console.log("Object req.user nhận được từ Middleware:", req.user);
      console.log("Mã người dùng (maND) sau khi trích xuất:", maND);
      console.log("===========================");

      if (!maND) {
        return res.status(400).json({
          success: false,
          message:
            "Không tìm thấy mã định danh người dùng (mand) trong dữ liệu xác thực.",
        });
      }

      // Gọi Model lấy danh sách đơn hàng
      const orders = await OrderHistoryModel.getHistoryByUserId(maND);

      if (!orders || orders.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      // Gộp mảng sản phẩm chi tiết bằng Promise.all
      const fullHistory = await Promise.all(
        orders.map(async (order) => {
          // 🟢 ĐÃ SỬA: Truyền 'order.madonhang' (chữ thường) thay vì order.MaDonHang
          const items = await OrderHistoryModel.getItemsByOrderId(
            order.madonhang,
          );
          return {
            ...order,
            sanpham: items, // Đổi key sang chữ thường đồng bộ cho Frontend dễ quản lý
          };
        }),
      );

      return res.status(200).json({
        success: true,
        data: fullHistory,
      });
    } catch (error) {
      console.error("Lỗi lấy lịch sử đơn hàng tại Controller:", error);
      // 🟢 CẢI TIẾN: Trả lỗi chi tiết để debug nhanh nếu cấu trúc bảng lỡ bị lệch
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra tại máy chủ khi tải lịch sử đơn hàng.",
        error: error.message,
      });
    }
  },
};

module.exports = orderHistoryController;
