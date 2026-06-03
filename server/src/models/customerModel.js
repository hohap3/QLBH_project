const { poolPromise } = require("../config/database");

const Customer = {
  // 1. 🟢 CẬP NHẬT: Lấy danh sách tất cả khách hàng có hỗ trợ phân trang
  getAll: async (page = 1, limit = 10) => {
    try {
      const pool = await poolPromise;
      const offset = (page - 1) * limit;

      // Truy vấn 1: Lấy đúng 10 khách hàng của trang hiện tại kèm thông tin đơn hàng
      const dataQuery = `
        SELECT 
          kh.makh, kh.hoten, kh.sdt, kh.email, kh.diachi, kh.ngaytao, kh.diemtichluy,
          nd.trangthai, 
          COUNT(dh.madonhang)::INT AS tongdonhang, 
          MAX(dh.ngaydat) AS dongannhat
        FROM khachhang kh
        LEFT JOIN nguoidung nd ON kh.mand = nd.mand
        LEFT JOIN donhang dh ON kh.makh = dh.makh
        GROUP BY 
          kh.makh, kh.hoten, kh.sdt, kh.email, 
          kh.diachi, kh.ngaytao, kh.diemtichluy, nd.trangthai
        ORDER BY kh.ngaytao DESC
        LIMIT $1 OFFSET $2
      `;
      const dataResult = await pool.query(dataQuery, [limit, offset]);

      // Truy vấn 2: Tính tổng số lượng khách hàng đang có trong hệ thống
      const countQuery = "SELECT COUNT(*) FROM khachhang";
      const countResult = await pool.query(countQuery);
      const totalRecords = parseInt(countResult.rows[0].count, 10);

      return {
        customers: dataResult.rows,
        totalRecords: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      };
    } catch (error) {
      throw error;
    }
  },

  // 2. Lấy chi tiết 1 khách hàng (Giữ nguyên)
  getById: async (maKH) => {
    try {
      const pool = await poolPromise;
      const query = "SELECT * FROM khachhang WHERE makh = $1";
      const result = await pool.query(query, [maKH]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 3. Lấy lịch sử hóa đơn mua hàng của khách hàng (Giữ nguyên)
  getOrderHistory: async (maKH) => {
    try {
      const pool = await poolPromise;
      const query = `
        SELECT madonhang, ngaydat, tongtien, trangthai 
        FROM donhang 
        WHERE makh = $1 
        ORDER BY ngaydat DESC
      `;
      const result = await pool.query(query, [maKH]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 4. Thêm mới khách hàng (Giữ nguyên)
  create: async (data) => {
    try {
      const pool = await poolPromise;
      const query = `
        INSERT INTO khachhang (makh, hoten, sdt, email, diachi, diemtichluy, mand)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      const values = [
        data.MaKH,
        data.HoTen,
        data.SDT,
        data.Email || null,
        data.DiaChi || null,
        data.DiemTichLuy || 0,
        data.MaND || null,
      ];
      return await pool.query(query, values);
    } catch (error) {
      throw error;
    }
  },

  // 5. Cập nhật thông tin khách hàng & Điểm tích lũy (Giữ nguyên)
  update: async (maKH, data) => {
    try {
      const pool = await poolPromise;
      const query = `
        UPDATE khachhang 
        SET hoten = $1, 
            sdt = $2, 
            email = $3, 
            diachi = $4, 
            diemtichluy = $5
        WHERE makh = $6
      `;
      const values = [
        data.HoTen,
        data.SDT,
        data.Email || null,
        data.DiaChi || null,
        data.DiemTichLuy || 0,
        maKH,
      ];
      return await pool.query(query, values);
    } catch (error) {
      throw error;
    }
  },

  // 6. Khóa / Mở khóa trạng thái tài khoản (Giữ nguyên)
  toggleStatus: async (maKH, trangThai) => {
    try {
      const pool = await poolPromise;
      const query = `
        UPDATE nguoidung 
        SET trangthai = $1 
        WHERE mand = (SELECT mand FROM khachhang WHERE makh = $2)
      `;
      return await pool.query(query, [trangThai ? true : false, maKH]);
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Customer;
