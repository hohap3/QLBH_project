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
      // 🟢 IN RA LỖI CHI TIẾT TẠI ĐÂY ĐỂ BIẾT SAI CỘT HAY SAI BẢNG NÀO:
      console.error("CHI TIẾT LỖI OVERVIEW:", error.message);

      res.status(500).json({
        success: false,
        message: error.message, // Trả trực tiếp message lỗi về Postman/Trình duyệt để check nhanh
      });
    }
  },

  getTopProducts: async (req, res) => {
    try {
      const data = await ThongKeModel.getTopSellingProducts();
      res.status(200).json({ success: true, data: data });
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

      // 🟢 TỐI ƯU/FIX ĐỒNG BỘ: Chuẩn hóa mảng từ Tháng 1 -> hiện tại (Điền số 0 nếu tháng đó trống đơn)
      const formattedData = Array.from({ length: currentMonth }, (_, index) => {
        const monthNum = index + 1;
        const matched = dbData.find((item) => item.month === monthNum);
        return {
          label: `T${monthNum}`,
          value: matched ? parseInt(matched.orderCount) : 0,
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

      // Chuẩn hóa mảng từ Tháng 1 đến tháng hiện tại, nếu tháng nào trống doanh thu tự điền số 0
      const formattedData = Array.from({ length: currentMonth }, (_, index) => {
        const monthNum = index + 1;
        const matched = dbData.find((item) => item.month === monthNum);
        return {
          label: `T${monthNum}`,
          value: matched ? parseFloat(matched.totalRevenue) : 0,
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
