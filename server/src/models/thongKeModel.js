// src/models/thongKeModel.js
const { poolPromise } = require("../config/database");

const ThongKeModel = {
  // Lấy số lượng sản phẩm phân bổ theo từng danh mục
  getSanPhamTheoDanhMuc: async () => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT 
                    d.tendanhmuc AS label, 
                    COUNT(s.masp)::int AS value
                FROM danhmuc d
                LEFT JOIN sanpham s ON d.madanhmuc = s.madanhmuc
                GROUP BY d.madanhmuc, d.tendanhmuc
            `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Số liệu 3 thẻ tổng quan
  getQuickStats: async () => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT 
                    COALESCE((SELECT SUM(tongtien) FROM donhang WHERE trangthai != 'Đã hủy'), 0)::float as doanhthu,
                    (SELECT COUNT(madonhang) FROM donhang)::int as tongdonhang,
                    (SELECT COUNT(makh) FROM khachhang)::int as tongkhachhang
            `;
      const result = await pool.query(query);
      const row = result.rows[0];

      return {
        DoanhThu: row.doanhthu,
        TongDonHang: row.tongdonhang,
        TongKhachHang: row.tongkhachhang,
      };
    } catch (error) {
      throw error;
    }
  },

  // Top 5 sản phẩm bán chạy nhất
  getTopSellingProducts: async () => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT 
                    s.tensp AS label, 
                    SUM(ct.soluong)::int AS totalqty,
                    SUM(ct.soluong * ct.giaban)::float AS totalrevenue
                FROM chitiet_donhang ct
                JOIN sanpham s ON ct.masp = s.masp
                GROUP BY s.masp, s.tensp
                ORDER BY totalrevenue DESC
                LIMIT 5
            `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê số đơn hàng theo tháng
  getOrdersByMonth: async () => {
    try {
      const pool = await poolPromise;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const query = `
                SELECT 
                    EXTRACT(MONTH FROM ngaydat)::int AS month, 
                    COUNT(madonhang)::int AS ordercount
                FROM donhang
                WHERE EXTRACT(YEAR FROM ngaydat) = $1 AND EXTRACT(MONTH FROM ngaydat) <= $2 AND trangthai != 'Đã hủy'
                GROUP BY EXTRACT(MONTH FROM ngaydat)
                ORDER BY month ASC
            `;

      const result = await pool.query(query, [currentYear, currentMonth]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Thống kê doanh thu theo tháng từ hóa đơn
  getRevenueByMonth: async () => {
    try {
      const pool = await poolPromise;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const query = `
                SELECT 
                    EXTRACT(MONTH FROM ngayxuat)::int AS month, 
                    SUM(tongtien)::float AS totalrevenue
                FROM hoadon
                WHERE EXTRACT(YEAR FROM ngayxuat) = $1 AND EXTRACT(MONTH FROM ngayxuat) <= $2
                GROUP BY EXTRACT(MONTH FROM ngayxuat)
                ORDER BY month ASC
            `;

      const result = await pool.query(query, [currentYear, currentMonth]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ThongKeModel;
