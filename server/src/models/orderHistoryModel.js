const { pool } = require("../config/database");

const OrderHistoryModel = {
  // 1. Lấy danh sách đơn hàng của người dùng
  getHistoryByUserId: async (maND) => {
    try {
      // ĐÃ SỬA: Chuyển sang cú pháp Postgres ($1), tên bảng/cột viết thường hoàn toàn
      const query = `
        SELECT 
          dh.madonhang,
          dh.ngaydat,
          dh.trangthai,
          dh.tongtien,
          dh.ghichu
        FROM donhang dh
        WHERE dh.manguoidung = $1
        ORDER BY dh.ngaydat DESC
      `;

      const result = await pool.query(query, [maND]);
      return result.rows; // Trả về mảng rows của Postgres
    } catch (error) {
      console.error("Lỗi Model getHistoryByUserId:", error);
      throw error;
    }
  },

  // 2. Lấy chi tiết các sản phẩm trong đơn hàng
  getItemsByOrderId: async (maDonHang) => {
    try {
      // ĐÃ SỬA: JOIN bảng dùng chữ thường, tính toán ThanhTien bằng thuộc tính chữ thường
      const query = `
        SELECT 
          ct.masp,
          sp.tensp,
          sp.hinhanh,
          ct.soluong,
          ct.giaban,
          ct.giamgia,
          (ct.soluong * ct.giaban - ct.giamgia) AS thanhtien
        FROM chitiet_donhang ct
        JOIN sanpham sp ON ct.masp = sp.masp
        WHERE ct.madonhang = $1
      `;

      const result = await pool.query(query, [maDonHang]);
      return result.rows;
    } catch (error) {
      console.error("Lỗi Model getItemsByOrderId:", error);
      throw error;
    }
  },
};

module.exports = OrderHistoryModel;
