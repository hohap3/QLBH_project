const { pool } = require("../config/database");

class WarehouseModel {
  // 1. 🟢 CẬP NHẬT: Lấy danh sách lịch sử giao dịch kho có hỗ trợ phân trang
  static async getAllTransactions(page = 1, limit = 10, loaiGD = null) {
    try {
      const offset = (page - 1) * limit;

      // Sử dụng 'let' cho các biến có khả năng bị gán lại giá trị chuỗi
      let whereClause = "";
      const params = [limit, offset]; // Mảng dùng const vẫn .push() bình thường

      if (loaiGD !== null && loaiGD !== undefined && loaiGD !== "") {
        whereClause = "WHERE gdk.loaigd = $3";
        params.push(parseInt(loaiGD, 10));
      }

      const dataQuery = `
        SELECT gdk.*, sp.tensp, sp.donvitinh 
        FROM giaodichkho gdk
        JOIN sanpham sp ON gdk.masp = sp.masp
        ${whereClause}
        ORDER BY gdk.ngaygd DESC
        LIMIT $1 OFFSET $2
      `;
      const dataResult = await pool.query(dataQuery, params);

      // 🟢 ĐỔI THÀNH 'let' ở đây để không bị lỗi "Assignment to constant variable"
      let countQuery = "SELECT COUNT(*) FROM giaodichkho gdk";
      const countParams = [];

      if (whereClause) {
        countQuery += ` ${whereClause}`;
        countParams.push(parseInt(loaiGD, 10));
        // Gán lại giá trị chuỗi mượt mà không lo bị lỗi
        countQuery = countQuery.replace("$3", "$1");
      }

      const countResult = await pool.query(countQuery, countParams);
      const totalRecords = parseInt(countResult.rows[0].count, 10);

      return {
        transactions: dataResult.rows,
        totalRecords: totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  // 2. Lấy lịch sử giao dịch của riêng một sản phẩm cụ thể (Giữ nguyên)
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

  // 3. Xử lý tạo giao dịch kho bằng Transaction trong PostgreSQL (Giữ nguyên)
  static async createTransaction({ maGD, maSP, loaiGD, soLuong }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const productQuery = `SELECT soluongton FROM sanpham WHERE masp = $1 FOR UPDATE`;
      const productRes = await client.query(productQuery, [maSP]);

      if (productRes.rows.length === 0) {
        throw new Error("Sản phẩm không tồn tại trong hệ thống!");
      }

      const tonTruoc = productRes.rows[0].soluongton || 0;
      let tonSau = tonTruoc;

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
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = WarehouseModel;
