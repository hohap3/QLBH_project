// src/controllers/orderHistoryController.js
const OrderHistoryModel = require("../models/orderHistoryModel");

const orderHistoryController = {
  getOurOrderHistory: async (req, res) => {
    try {
      // SỬA TẠI ĐÂY: Thử lấy MaND (chữ hoa), maND (chữ thường) hoặc id để tránh bị undefined do lệch pha với Token payload
      const maND = req.user?.MaND || req.user?.maND || req.user?.id;

      // Thêm log debug trực quan để bạn nhìn thấy Object Token gửi lên chứa những gì
      console.log("=== HP STORE AUTH DEBUG ===");
      console.log("Object req.user nhận được từ Middleware:", req.user);
      console.log("Mã người dùng (maND) sau khi trích xuất:", maND);
      console.log("===========================");

      if (!maND) {
        return res.status(400).json({
          success: false,
          message:
            "Không tìm thấy mã định danh người dùng (MaND) trong dữ liệu xác thực.",
        });
      }

      // Gọi Model lấy danh sách đơn hàng
      const orders = await OrderHistoryModel.getHistoryByUserId(maND);

      // Kiểm tra nếu danh sách đơn hàng trống (tránh lỗi khi map mảng undefined)
      if (!orders || orders.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      // Đồng bộ và gộp mảng sản phẩm chi tiết bằng Promise.all
      const fullHistory = await Promise.all(
        orders.map(async (order) => {
          const items = await OrderHistoryModel.getItemsByOrderId(
            order.MaDonHang,
          );
          return {
            ...order,
            SảnPhẩm: items,
          };
        }),
      );

      return res.status(200).json({
        success: true,
        data: fullHistory,
      });
    } catch (error) {
      console.error("Lỗi lấy lịch sử đơn hàng tại Controller:", error);
      return res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra tại máy chủ khi tải lịch sử đơn hàng.",
      });
    }
  },
};

module.exports = orderHistoryController;
