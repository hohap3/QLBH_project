// src/controllers/thongKeController.js
const ThongKeModel = require("../models/thongKeModel");

const ThongKeController = {
  getStatsCategory: async (req, res) => {
    try {
      const data = await ThongKeModel.getSanPhamTheoDanhMuc();
      res.status(200).json({
        success: true,
        data: data,
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê danh mục:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy dữ liệu biểu đồ danh mục",
      });
    }
  },

  getDashboardOverview: async (req, res) => {
    try {
      const stats = await ThongKeModel.getQuickStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("CHI TIẾT LỖI OVERVIEW:", error.message);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy số liệu tổng quan",
      });
    }
  },

  getTopProducts: async (req, res) => {
    try {
      const data = await ThongKeModel.getTopSellingProducts();

      // Định dạng lại key chữ hoa/thường để Front-end render thống nhất
      const formattedData = data.map((item) => ({
        label: item.label,
        totalQty: item.totalqty,
        totalRevenue: item.totalrevenue,
      }));

      res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
      console.error("Lỗi lấy top sản phẩm:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi hệ thống khi lấy top sản phẩm" });
    }
  },

  getMonthlyStats: async (req, res) => {
    try {
      const dbData = await ThongKeModel.getOrdersByMonth();
      const currentMonth = new Date().getMonth() + 1;

      // Chuẩn hóa dữ liệu từ tháng 1 đến tháng hiện tại
      const formattedData = Array.from({ length: currentMonth }, (_, index) => {
        const monthNum = index + 1;
        // 🟢 Ép kiểu dữ liệu về Number để so sánh chính xác tuyệt đối
        const matched = dbData.find((item) => Number(item.month) === monthNum);
        return {
          label: `T${monthNum}`,
          value: matched ? parseInt(matched.ordercount) : 0, // 🟢
        };
      });

      res.status(200).json({ success: true, data: formattedData });
    } catch (error) {
      console.error("Lỗi lấy thống kê đơn hàng theo tháng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thống kê đơn hàng theo tháng",
      });
    }
  },

  getMonthlyRevenue: async (req, res) => {
    try {
      const dbData = await ThongKeModel.getRevenueByMonth();
      const currentMonth = new Date().getMonth() + 1;

      // Chuẩn hóa dữ liệu từ tháng 1 đến tháng hiện tại
      const formattedData = Array.from({ length: currentMonth }, (_, index) => {
        const monthNum = index + 1;
        // 🟢 Ép kiểu dữ liệu về Number để so sánh chính xác tuyệt đối
        const matched = dbData.find((item) => Number(item.month) === monthNum);
        return {
          label: `T${monthNum}`,
          value: matched ? parseFloat(matched.totalrevenue) : 0, // 🟢 FIX: Đổi từ item.totalrevenue thành matched.totalrevenue
        };
      });

      res.status(200).json({
        success: true,
        data: formattedData,
      });
    } catch (error) {
      console.error("Lỗi lấy thống kê doanh thu theo tháng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy thống kê doanh thu theo tháng",
      });
    }
  },
};

module.exports = ThongKeController;
