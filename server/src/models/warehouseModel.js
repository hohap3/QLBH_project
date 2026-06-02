const { pool } = require("../config/database");

class WarehouseModel {
  // 1. Lấy toàn bộ danh sách lịch sử giao dịch kho kèm thông tin sản phẩm
  static async getAllTransactions() {
    try {
      const query = `
        SELECT gdk.*, sp.tensp, sp.donvitinh 
        FROM giaodichkho gdk
        JOIN sanpham sp ON gdk.masp = sp.masp
        ORDER BY gdk.ngaygd DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // 2. Lấy lịch sử giao dịch của riêng một sản phẩm cụ thể
  static async getTransactionsByProduct(maSP) {
    try {
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
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Bước A: Khóa dòng dữ liệu để lấy tồn tại thời điểm hiện tại thực tế
      const productQuery = `SELECT soluongton FROM sanpham WHERE masp = $1 FOR UPDATE`;
      const productRes = await client.query(productQuery, [maSP]);

      if (productRes.rows.length === 0) {
        throw new Error("Sản phẩm không tồn tại trong hệ thống!");
      }

      const tonTruoc = productRes.rows[0].soluongton || 0;
      let tonSau = tonTruoc;

      // Bước B: Kiểm tra tính toán biến động kho
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

      // Bước C: Ghi lịch sử biến động kho
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

      // Bước D: Đồng bộ cập nhật lại số lượng tồn mới cho bảng sản phẩm
      const updateStockQuery = `
        UPDATE sanpham 
        SET soluongton = $1 
        WHERE masp = $2
      `;
      await client.query(updateStockQuery, [tonSau, maSP]);

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
      await client.query("ROLLBACK");
      throw error; // Trả lỗi ra ngoài để Controller xử lý thông báo bằng SweetAlert2
    } finally {
      client.release(); // Trả lại client vào pool quản lý
    }
  }
}

module.exports = WarehouseModel;
