const { poolPromise } = require("../config/database");

const Order = {
  // 🟢 CẬP NHẬT: Hỗ trợ phân trang bằng LIMIT và OFFSET
  getWithPagination: async (page = 1, limit = 10) => {
    try {
      const pool = await poolPromise;

      // Tính toán vị trí bắt đầu lấy dữ liệu
      const offset = (page - 1) * limit;

      // Truy vấn 1: Lấy danh sách 10 đơn hàng của trang hiện tại kèm thông tin khách hàng
      const dataQuery = `
        SELECT 
          dh.madonhang,
          kh.hoten AS tenkhachhang,
          kh.email AS emailkhachhang,
          dh.ngaydat,
          dh.tongtien,
          dh.trangthai,
          (SELECT COUNT(*)::INT FROM chitiet_donhang ct WHERE ct.madonhang = dh.madonhang) AS soluongsanpham
        FROM donhang dh
        LEFT JOIN khachhang kh ON dh.makh = kh.makh
        ORDER BY dh.ngaydat DESC
        LIMIT $1 OFFSET $2
      `;
      const dataResult = await pool.query(dataQuery, [limit, offset]);

      // Truy vấn 2: Đếm tổng số đơn hàng hiện có để tính toán phân trang ở Front-end
      const countQuery = "SELECT COUNT(*) FROM donhang";
      const countResult = await pool.query(countQuery);
      const totalRecords = parseInt(countResult.rows[0].count, 10);

      return {
        orders: dataResult.rows,
        totalRecords: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      };
    } catch (error) {
      throw error;
    }
  },

  // 2. Lấy chi tiết một đơn hàng bao gồm các mặt hàng đã mua
  getDetails: async (maDonHang) => {
    try {
      const pool = await poolPromise;
      const query = `
        SELECT 
          dh.madonhang,
          dh.ngaydat,
          dh.trangthai,
          dh.tongtien,
          dh.ghichu,
          kh.hoten AS hotenkhachhang, 
          kh.sdt AS sdtkhachhang, 
          kh.email AS emailkhachhang, 
          kh.diachi AS diachikhachhang,
          nd.tendangnhap AS tendangnhap,
          ct.masp, 
          ct.soluong, 
          ct.giaban, 
          ct.giamgia
        FROM donhang dh
        LEFT JOIN khachhang kh ON dh.makh = kh.makh
        LEFT JOIN nguoidung nd ON kh.mand = nd.mand 
        LEFT JOIN chitiet_donhang ct ON dh.madonhang = ct.madonhang
        WHERE dh.madonhang = $1
      `;
      const result = await pool.query(query, [maDonHang]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 3. Cập nhật trạng thái đơn hàng
  updateStatus: async (maDonHang, trangThai) => {
    try {
      const pool = await poolPromise;
      const query = `
        UPDATE donhang 
        SET trangthai = $1 
        WHERE madonhang = $2
      `;
      return await pool.query(query, [trangThai, maDonHang]);
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Order;
