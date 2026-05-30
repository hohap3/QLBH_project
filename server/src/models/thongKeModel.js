const { sql, poolPromise } = require("../config/database");

const ThongKeModel = {
  // Lấy số lượng sản phẩm phân bổ theo từng danh mục
  getSanPhamTheoDanhMuc: async () => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT 
                    D.TenDanhMuc AS label, 
                    COUNT(S.MaSP) AS value
                FROM DANHMUC D
                LEFT JOIN SANPHAM S ON D.MaDanhMuc = S.MaDanhMuc
                GROUP BY D.MaDanhMuc, D.TenDanhMuc
            `;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  },

  getQuickStats: async () => {
    try {
      const pool = await poolPromise;
      // 🟢 FIX LOGIC: Doanh thu thực tế nên lấy tổng tiền từ HOADON thay vì tất cả DONHANG
      const query = `
               SELECT 
                  COALESCE((SELECT SUM(D.TongTien) FROM HOADON H JOIN DONHANG D ON H.MaDonHang = D.MaDonHang), 0) as DoanhThu,
                  (SELECT COUNT(MaDonHang) FROM DONHANG) as TongDonHang,
                  (SELECT COUNT(MaKH) FROM KHACHHANG) as TongKhachHang
            `;
      const result = await pool.request().query(query);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  },

  getTopSellingProducts: async () => {
    try {
      const pool = await poolPromise;
      const query = `
               SELECT TOP 5 
                    S.TenSP AS label, 
                    SUM(CT.SoLuong) AS totalQty,
                    SUM(CT.SoLuong * CT.GiaBan) AS totalRevenue
                FROM CHITIET_DONHANG CT
                JOIN SANPHAM S ON CT.MaSP = S.MaSP
                GROUP BY S.MaSP, S.TenSP
                ORDER BY totalRevenue DESC
            `;
      const result = await pool.request().query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  },

  getOrdersByMonth: async () => {
    try {
      const pool = await poolPromise;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const query = `
                SELECT 
                    MONTH(NgayDat) AS month, 
                    COUNT(MaDonHang) AS orderCount
                FROM DONHANG
                WHERE YEAR(NgayDat) = @Year AND MONTH(NgayDat) <= @Month AND TrangThai != N'Đã hủy'
                GROUP BY MONTH(NgayDat)
                ORDER BY MONTH(NgayDat) ASC
            `;

      const result = await pool
        .request()
        .input("Year", sql.Int, currentYear)
        .input("Month", sql.Int, currentMonth)
        .query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  },

  getRevenueByMonth: async () => {
    try {
      const pool = await poolPromise;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const query = `
                SELECT 
                    MONTH(NgayXuat) AS month, 
                    SUM(TongTien) AS totalRevenue
                FROM HOADON
                WHERE YEAR(NgayXuat) = @Year AND MONTH(NgayXuat) <= @Month
                GROUP BY MONTH(NgayXuat)
                ORDER BY MONTH(NgayXuat) ASC
            `;

      const result = await pool
        .request()
        .input("Year", sql.Int, currentYear)
        .input("Month", sql.Int, currentMonth)
        .query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ThongKeModel;
