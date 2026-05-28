// models/warehouseModel.js
const { sql, poolPromise } = require("../config/database");

class WarehouseModel {
  // 1. Lấy toàn bộ danh sách lịch sử giao dịch kho kèm thông tin sản phẩm
  static async getAllTransactions() {
    try {
      // SỬA TẠI ĐÂY: Phải await qua poolPromise trước khi thực hiện query
      const pool = await poolPromise;
      const query = `
                SELECT gdk.*, sp.TenSP, sp.DonViTinh 
                FROM GIAODICHKHO gdk
                JOIN SANPHAM sp ON gdk.MaSP = sp.MaSP
                ORDER BY gdk.NgayGD DESC
            `;
      const result = await pool.query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // 2. Lấy lịch sử giao dịch của riêng một sản phẩm cụ thể
  static async getTransactionsByProduct(maSP) {
    try {
      // SỬA TẠI ĐÂY: Lấy pool từ poolPromise và tạo request từ pool đó
      const pool = await poolPromise;
      const query = `
                SELECT gdk.*, sp.TenSP 
                FROM GIAODICHKHO gdk
                JOIN SANPHAM sp ON gdk.MaSP = sp.MaSP
                WHERE gdk.MaSP = @maSP
                ORDER BY gdk.NgayGD DESC
            `;
      const request = pool.request(); // Tạo request từ đối tượng pool đã kết nối
      request.input("maSP", sql.VarChar(20), maSP);
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  }

  // 3. Xử lý tạo giao dịch kho và cập nhật tự động SoLuongTon trong bảng SANPHAM
  static async createTransaction({ maGD, maSP, loaiGD, soLuong }) {
    const pool = await poolPromise; // SỬA TẠI ĐÂY: Đảm bảo pool đã sẵn sàng
    const transaction = new sql.Transaction(pool); // Truyền pool vào Transaction

    try {
      await transaction.begin();

      // Bước A: Lấy số lượng tồn hiện tại của sản phẩm
      const productQuery = `SELECT SoLuongTon FROM SANPHAM WHERE MaSP = @maSP`;
      const productReq = new sql.Request(transaction);
      productReq.input("maSP", sql.VarChar(20), maSP);
      const productRes = await productReq.query(productQuery);

      if (productRes.recordset.length === 0) {
        throw new Error("Sản phẩm không tồn tại trong hệ thống!");
      }

      const tonTruoc = productRes.recordset[0].SoLuongTon;
      let tonSau = tonTruoc;

      // Bước B: Tính toán lượng tồn mới dựa trên LoaiGD (1: Nhập, 2: Xuất)
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

      // Bước C: Ghi log vào bảng GIAODICHKHO
      const insertGDQuery = `
                INSERT INTO GIAODICHKHO (MaGD, MaSP, LoaiGD, SoLuong, TonTruoc, TonSau, NgayGD)
                VALUES (@maGD, @maSP, @loaiGD, @soLuong, @tonTruoc, @tonSau, GETDATE())
            `;
      const gdReq = new sql.Request(transaction);
      gdReq.input("maGD", sql.VarChar(20), maGD);
      gdReq.input("maSP", sql.VarChar(20), maSP);
      gdReq.input("loaiGD", sql.Int, loaiGD);
      gdReq.input("soLuong", sql.Int, soLuong);
      gdReq.input("tonTruoc", sql.Int, tonTruoc);
      gdReq.input("tonSau", sql.Int, tonSau);
      await gdReq.query(insertGDQuery);

      // Bước D: Cập nhật lại cột SoLuongTon trong bảng SANPHAM
      const updateStockQuery = `
                UPDATE SANPHAM 
                SET SoLuongTon = @tonSau 
                WHERE MaSP = @maSP
            `;
      const stockReq = new sql.Request(transaction);
      stockReq.input("tonSau", sql.Int, tonSau);
      stockReq.input("maSP", sql.VarChar(20), maSP);
      await stockReq.query(updateStockQuery);

      // Hoàn tất chuỗi xử lý an toàn
      await transaction.commit();
      return { maGD, maSP, loaiGD, soLuong, tonTruoc, tonSau };
    } catch (error) {
      // Có lỗi xảy ra -> Hủy bỏ mọi tác vụ đã thực thi trong phiên này
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = WarehouseModel;
