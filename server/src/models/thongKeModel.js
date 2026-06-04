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

      // Tính toán mốc thời gian động trực tiếp bằng PostgreSQL Engine
      const query = `
        WITH mốc_thời_gian AS (
          SELECT 
            DATE_TRUNC('month', CURRENT_DATE) AS dau_thang_nay,
            DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second' AS cuoi_thang_nay,
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AS dau_thang_truoc,
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 second' AS cuoi_thang_truoc
        )
        SELECT 
          -- 1. Thống kê Doanh Thu (Loại trừ đơn hàng 'Đã hủy')
          COALESCE(SUM(dh.tongtien) FILTER (WHERE dh.ngaydat BETWEEN t.dau_thang_nay AND t.cuoi_thang_nay AND dh.trangthai != 'Đã hủy'), 0)::float AS doanhthu_nay,
          COALESCE(SUM(dh.tongtien) FILTER (WHERE dh.ngaydat BETWEEN t.dau_thang_truoc AND t.cuoi_thang_truoc AND dh.trangthai != 'Đã hủy'), 0)::float AS doanhthu_truoc,

          -- 2. Thống kê Số Đơn Hàng
          COUNT(dh.madonhang) FILTER (WHERE dh.ngaydat BETWEEN t.dau_thang_nay AND t.cuoi_thang_nay)::int AS donhang_nay,
          COUNT(dh.madonhang) FILTER (WHERE dh.ngaydat BETWEEN t.dau_thang_truoc AND t.cuoi_thang_truoc)::int AS donhang_truoc,

          -- 3. Thống kê Khách Hàng (Subquery cô lập để tránh trùng lặp bản ghi chéo)
          (SELECT COUNT(makh)::int FROM khachhang WHERE ngaytao BETWEEN t.dau_thang_nay AND t.cuoi_thang_nay) AS khachhang_nay,
          (SELECT COUNT(makh)::int FROM khachhang WHERE ngaytao BETWEEN t.dau_thang_truoc AND t.cuoi_thang_truoc) AS khachhang_truoc
        FROM mốc_thời_gian t
        LEFT JOIN donhang dh ON true
        GROUP BY t.dau_thang_nay, t.cuoi_thang_nay, t.dau_thang_truoc, t.cuoi_thang_truoc;
      `;

      const result = await pool.query(query);

      // Fallback object nếu cơ sở dữ liệu trống hoàn toàn
      const row = result.rows[0] || {
        doanhthu_nay: 0,
        doanhthu_truoc: 0,
        donhang_nay: 0,
        donhang_truoc: 0,
        khachhang_nay: 0,
        khachhang_truoc: 0,
      };

      // Hàm nội bộ xử lý tỷ lệ phần trăm an toàn (Tránh lỗi toán học chia cho số 0)
      const tinhPhanTram = (nay, truoc) => {
        if (!truoc || truoc === 0) return nay > 0 ? 100 : 0;
        return parseFloat((((nay - truoc) / truoc) * 100).toFixed(1));
      };

      return {
        DoanhThu: {
          ThangNay: row.doanhthu_nay,
          ThangTruoc: row.doanhthu_truoc,
          PhanTram: tinhPhanTram(row.doanhthu_nay, row.doanhthu_truoc),
        },
        TongDonHang: {
          ThangNay: row.donhang_nay,
          ThangTruoc: row.donhang_truoc,
          PhanTram: tinhPhanTram(row.donhang_nay, row.donhang_truoc),
        },
        TongKhachHang: {
          ThangNay: row.khachhang_nay,
          ThangTruoc: row.khachhang_truoc,
          PhanTram: tinhPhanTram(row.khachhang_nay, row.khachhang_truoc),
        },
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
