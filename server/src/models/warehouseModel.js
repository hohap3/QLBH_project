// Giả định file config của bạn export { pool } từ thư viện 'pg'
const { pool } = require("../config/database");

class WarehouseModel {
  // 1. Lấy toàn bộ danh sách lịch sử giao dịch kho kèm thông tin sản phẩm
  static async getAllTransactions() {
    try {
      // Postgres không cần await poolPromise, gọi thẳng pool.query
      // Đổi tên bảng/cột sang chữ thường theo cơ chế của Postgres
      const query = `
        SELECT gdk.*, sp.tensp, sp.donvitinh 
        FROM giaodichkho gdk
        JOIN sanpham sp ON gdk.masp = sp.masp
        ORDER BY gdk.ngaygd DESC
      `;
      const result = await pool.query(query);
      return result.rows; // Postgres trả về mảng dữ liệu qua thuộc tính .rows
    } catch (error) {
      throw error;
    }
  }

  // 2. Lấy lịch sử giao dịch của riêng một sản phẩm cụ thể
  static async getTransactionsByProduct(maSP) {
    try {
      // Thay @maSP bằng $1
      const query = `
        SELECT gdk.*, sp.tensp 
        FROM giaodichkho gdk
        JOIN sanpham sp ON gdk.masp = sp.masp
        WHERE gdk.masp = $1
        ORDER BY gdk.ngaygd DESC
      `;
      const result = await pool.query(query, [maSP]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // 3. Xử lý tạo giao dịch kho bằng Transaction trong PostgreSQL
  static async createTransaction({ maGD, maSP, loaiGD, soLuong }) {
    // Để chạy Transaction an toàn trong Postgres, ta phải lấy ra 1 client duy nhất từ Pool
    const client = await pool.connect();

    try {
      // Bắt đầu Transaction
      await client.query("BEGIN");

      // Bước A: Lấy số lượng tồn hiện tại của sản phẩm (Dùng FOR UPDATE để khóa dòng, tránh xung đột đồng thời)
      const productQuery = `SELECT soluongton FROM sanpham WHERE masp = $1 FOR UPDATE`;
      const productRes = await client.query(productQuery, [maSP]);

      if (productRes.rows.length === 0) {
        throw new Error("Sản phẩm không tồn tại trong hệ thống!");
      }

      const tonTruoc = productRes.rows[0].soluongton || 0;
      let tonSau = tonTruoc;

      // Bước B: Tính toán lượng tồn mới dựa trên loaiGD (1: Nhập, 2: Xuất)
      if (loaiGD === 1) {
        tonSau = tonTruoc + soLuong;
      } else if (loaiGD === 2) {
        if (tonTruoc < soLuong) {
          throw new Error(
            `Kho hàng không đủ số lượng xuất! (Hiện tồn: ${tonTruoc})`,
          );
        }
        tonSau = tonTruoc - soLuong;
      } else {
        throw new Error("Loại giao dịch không hợp lệ (1: Nhập, 2: Xuất)!");
      }

      // Bước C: Ghi log vào bảng giaodichkho (Dùng NOW() thay cho GETDATE())
      const insertGDQuery = `
        INSERT INTO giaodichkho (magd, masp, loaigd, soluong, tontruoc, tonsau, ngaygd)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;
      await client.query(insertGDQuery, [
        maGD,
        maSP,
        loaiGD,
        soLuong,
        tonTruoc,
        tonSau,
      ]);

      // Bước D: Cập nhật lại cột soluongton trong bảng sanpham
      const updateStockQuery = `
        UPDATE sanpham 
        SET soluongton = $1 
        WHERE masp = $2
      `;
      await client.query(updateStockQuery, [tonSau, maSP]);

      // Hoàn tất mọi tác vụ thành công -> Chốt dữ liệu
      await client.query("COMMIT");

      return {
        maGD,
        maSP,
        loaiGD,
        soLuong,
        tonTruoc,
        tonSau,
        ngayGD: new Date(),
      };
    } catch (error) {
      // Có lỗi phát sinh -> Hoàn nguyên lại toàn bộ dữ liệu sạch sẽ
      await client.query("ROLLBACK");
      throw error;
    } finally {
      // QUAN TRỌNG: Phải luôn giải phóng giải phóng client trả về lại cho pool
      client.release();
    }
  }
}

module.exports = WarehouseModel;
