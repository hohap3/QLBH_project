const { poolPromise } = require("../config/database");

const Order = {
  // 1. Lấy danh sách đơn hàng kèm theo phân trang bằng LIMIT và OFFSET
  getWithPagination: async (page = 1, limit = 10) => {
    try {
      const pool = await poolPromise;
      const offset = (page - 1) * limit;

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
          dh.makh,
          kh.mand,
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

  // 3. Cập nhật trạng thái đơn hàng (Dành cho Admin/Nhân viên duyệt đơn)
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

  // 4. Tìm thông tin cơ bản phục vụ check quyền hủy đơn
  getOrderByCode: async (madonhang) => {
    try {
      const pool = await poolPromise;
      const query = `
        SELECT dh.madonhang, kh.mand, dh.trangthai 
        FROM donhang dh
        LEFT JOIN khachhang kh ON dh.makh = kh.makh
        WHERE dh.madonhang = $1
      `;
      const result = await pool.query(query, [madonhang]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 5. Lấy danh sách sản phẩm phục vụ hoàn kho
  getOrderDetailsForCancel: async (madonhang) => {
    try {
      const pool = await poolPromise;
      const query = `SELECT masp, soluong FROM chitiet_donhang WHERE madonhang = $1`;
      const result = await pool.query(query, [madonhang]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 6. TRANSACTION: Hủy đơn + Hoàn kho an toàn
  processCancelAndRestoreStock: async (madonhang, productsList) => {
    const pool = await poolPromise;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateOrderQuery = `UPDATE donhang SET trangthai = 'Đã hủy' WHERE madonhang = $1`;
      await client.query(updateOrderQuery, [madonhang]);

      if (productsList && productsList.length > 0) {
        for (const item of productsList) {
          const restoreStockQuery = `UPDATE sanpham SET soluongton = soluongton + $1 WHERE masp = $2`;
          await client.query(restoreStockQuery, [item.soluong, item.masp]);
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = Order;
