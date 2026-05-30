const { sql, poolPromise } = require("../config/database");

const ThongKeModel = {
  // Lấy số lượng sản phẩm phân bổ theo từng danh mục
  getSanPhamTheoDanhMuc: async () => {
    try {
      const pool = await poolPromise;
      const request = pool.request ? pool.request() : new sql.Request(pool);
      // PostgreSQL phân biệt chữ hoa thường, khuyến khích viết thường tên bảng/trường
      const query = `
                SELECT 
                    d.tendanhmuc AS label, 
                    COUNT(s.masp) AS value
                FROM danhmuc d
                LEFT JOIN sanpham s ON d.madanhmuc = s.madanhmuc
                GROUP BY d.madanhmuc, d.tendanhmuc
            `;
      const result = await request.query(query);
      return result.recordset || result.rows || result;
    } catch (error) {
      throw error;
    }
  },

  getQuickStats: async () => {
    try {
      const pool = await poolPromise;
      const request = pool.request ? pool.request() : new sql.Request(pool);

      // 🟢 FIX CHÍNH: Thay ISNULL bằng COALESCE của PostgreSQL
      const query = `
                SELECT 
                    COALESCE((SELECT SUM(tongtien) FROM donhang WHERE trangthai != 'Đã hủy'), 0) as doanhthu,
                    (SELECT COUNT(madonhang) FROM donhang) as tongdonhang,
                    (SELECT COUNT(makh) FROM khachhang) as tongkhachhang
            `;
      const result = await request.query(query);
      const rows = result.recordset
        ? result.recordset[0]
        : result.rows
          ? result.rows[0]
          : result[0];

      // Map ngược lại thuộc tính chữ hoa để Controller không bị lỗi đọc undefined
      return {
        DoanhThu: rows.doanhthu,
        TongDonHang: rows.tongdonhang,
        TongKhachHang: rows.tongkhachhang,
      };
    } catch (error) {
      throw error;
    }
  },

  getTopSellingProducts: async () => {
    try {
      const pool = await poolPromise;
      const request = pool.request ? pool.request() : new sql.Request(pool);

      // 🟢 FIX CHÍNH: Sử dụng LIMIT 5 cuối câu thay vì TOP 5 ở đầu câu lệnh
      const query = `
                SELECT 
                    s.tensp AS label, 
                    SUM(ct.soluong) AS totalqty,
                    SUM(ct.soluong * ct.giaban) AS totalrevenue
                FROM chitiet_donhang ct
                JOIN sanpham s ON ct.masp = s.masp
                GROUP BY s.masp, s.tensp
                ORDER BY totalrevenue DESC
                LIMIT 5
            `;
      const result = await request.query(query);
      return result.recordset || result.rows || result;
    } catch (error) {
      throw error;
    }
  },

  getOrdersByMonth: async () => {
    try {
      const pool = await poolPromise;
      const request = pool.request ? pool.request() : new sql.Request(pool);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 🟢 FIX CHÍNH: Dùng EXTRACT(MONTH FROM ...) thay cho MONTH() và YEAR()
      const query = `
                SELECT 
                    EXTRACT(MONTH FROM ngaydat) AS month, 
                    COUNT(madonhang) AS ordercount
                FROM donhang
                WHERE EXTRACT(YEAR FROM ngaydat) = $1 AND EXTRACT(MONTH FROM ngaydat) <= $2 AND trangthai != 'Đã hủy'
                GROUP BY EXTRACT(MONTH FROM ngaydat)
                ORDER BY month ASC
            `;

      // Phụ thuộc vào Driver kết nối PG của bạn, truyền tham số dạng mảng hoặc đối tượng
      const result = pool.query
        ? await pool.query(query, [currentYear, currentMonth])
        : await request
            .input("Year", sql.Int, currentYear)
            .input("Month", sql.Int, currentMonth)
            .query(query);

      return result.recordset || result.rows || result;
    } catch (error) {
      throw error;
    }
  },

  getRevenueByMonth: async () => {
    try {
      const pool = await poolPromise;
      const request = pool.request ? pool.request() : new sql.Request(pool);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // 🟢 FIX CHÍNH: Dùng EXTRACT(MONTH FROM ...) chuẩn Postgres
      const query = `
                SELECT 
                    EXTRACT(MONTH FROM ngayxuat) AS month, 
                    SUM(tongtien) AS totalrevenue
                FROM hoadon
                WHERE EXTRACT(YEAR FROM ngayxuat) = $1 AND EXTRACT(MONTH FROM ngayxuat) <= $2
                GROUP BY EXTRACT(MONTH FROM ngayxuat)
                ORDER BY month ASC
            `;

      const result = pool.query
        ? await pool.query(query, [currentYear, currentMonth])
        : await request
            .input("Year", sql.Int, currentYear)
            .input("Month", sql.Int, currentMonth)
            .query(query);

      return result.recordset || result.rows || result;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ThongKeModel;
