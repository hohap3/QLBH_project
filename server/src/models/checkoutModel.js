// src/models/checkoutModel.js
const { sql, poolPromise } = require("../config/database");

class CheckoutModel {
  static async saveCheckoutTransaction(checkoutData) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // 🟢 BƯỚC BỔ SUNG: Tìm MaKH từ MaNguoiDung trước khi chèn đơn hàng
      let maKhachHang = null;
      if (checkoutData.MaNguoiDung) {
        const findCustomerReq = new sql.Request(transaction);
        const customerResult = await findCustomerReq
          .input("MaND", sql.VarChar(20), checkoutData.MaNguoiDung)
          .query(`SELECT MaKH FROM KHACHHANG WHERE MaND = @MaND`);

        // Nếu tìm thấy tài khoản này đã có thông tin Khách Hàng, gán vào biến
        if (customerResult.recordset.length > 0) {
          maKhachHang = customerResult.recordset[0].MaKH;
        }
      }

      // 1. SINH MÃ ĐƠN HÀNG TỰ ĐỘNG
      const maDonHang = "DH" + Date.now().toString().slice(-8);

      // Tính toán tổng tiền thực tế
      const tongTien = checkoutData.ChiTiet.reduce(
        (sum, item) => sum + item.GiaBan * item.SoLuong,
        0,
      );

      // 2. CHÈN VÀO TABLE: DONHANG (Đã sửa truyền biến maKhachHang thay vì null)
      const orderReq = new sql.Request(transaction);
      await orderReq
        .input("MaDonHang", sql.VarChar(20), maDonHang)
        .input("MaKH", sql.VarChar(20), maKhachHang) // 🟢 Thay đổi tại đây
        .input("MaNguoiDung", sql.VarChar(20), checkoutData.MaNguoiDung)
        .input("TrangThai", sql.NVarChar(50), "Chờ xác nhận")
        .input("TongTien", sql.Decimal(18, 2), tongTien)
        .input("GhiChu", sql.NVarChar(255), checkoutData.GhiChu).query(`
                    INSERT INTO DONHANG (MaDonHang, MaKH, MaNguoiDung, NgayDat, TrangThai, TongTien, GhiChu)
                    VALUES (@MaDonHang, @MaKH, @MaNguoiDung, GETDATE(), @TrangThai, @TongTien, @GhiChu)
                `);

      // 3. CHÈN VÀO TABLE: CHITIET_DONHANG & TRỪ KHO SANPHAM
      for (const item of checkoutData.ChiTiet) {
        const insertDetailReq = new sql.Request(transaction);

        await insertDetailReq
          .input("MaDonHang", sql.VarChar(20), maDonHang)
          .input("MaSP", sql.VarChar(20), item.MaSP)
          .input("SoLuong", sql.Int, item.SoLuong)
          .input("GiaBan", sql.Decimal(18, 2), item.GiaBan).query(`
                        INSERT INTO CHITIET_DONHANG (MaDonHang, MaSP, SoLuong, GiaBan, GiamGia)
                        VALUES (@MaDonHang, @MaSP, @SoLuong, @GiaBan, 0)
                    `);

        const updateStockReq = new sql.Request(transaction);
        await updateStockReq
          .input("MaSP", sql.VarChar(20), item.MaSP)
          .input("SoLuong", sql.Int, item.SoLuong).query(`
                        UPDATE SANPHAM 
                        SET SoLuongTon = SoLuongTon - @SoLuong 
                        WHERE MaSP = @MaSP
                    `);
      }

      // 4. CHÈN VÀO TABLE: PHIEUGIAOHANG
      const maGiaoHang = "GH" + Date.now().toString().slice(-8);
      const deliveryReq = new sql.Request(transaction);

      await deliveryReq
        .input("MaGiaoHang", sql.VarChar(20), maGiaoHang)
        .input("MaDonHang", sql.VarChar(20), maDonHang)
        .input("DiaChi", sql.NVarChar(255), checkoutData.DiaChi)
        .input("TrangThaiGH", sql.NVarChar(30), "Chưa Giao")
        .input("NguoiNhan", sql.NVarChar(100), checkoutData.NguoiNhan)
        .input("SDTNguoiNhan", sql.VarChar(15), checkoutData.SDTNguoiNhan)
        .query(`
                    INSERT INTO PHIEUGIAOHANG (MaGiaoHang, MaDonHang, DiaChi, NgayGiao, TrangThai, NguoiNhan, SDTNguoiNhan)
                    VALUES (@MaGiaoHang, @MaDonHang, @DiaChi, GETDATE(), @TrangThaiGH, @NguoiNhan, @SDTNguoiNhan)
                `);

      // 5. CHÈN VÀO TABLE: THANHTOAN
      const maThanhToan = "TT" + Date.now().toString().slice(-8);
      const paymentReq = new sql.Request(transaction);
      const trangThaiTT =
        checkoutData.PhuongThucThanhToan === "COD"
          ? "Chưa Thanh Toán"
          : "Chờ Xác Nhận";

      await paymentReq
        .input("MaThanhToan", sql.VarChar(20), maThanhToan)
        .input("MaDonHang", sql.VarChar(20), maDonHang)
        .input("SoTien", sql.Decimal(18, 2), tongTien)
        .input("PhuongThuc", sql.NVarChar(30), checkoutData.PhuongThucThanhToan)
        .input("MaGiaoDich", sql.VarChar(50), null)
        .input("TrangThaiTT", sql.NVarChar(30), trangThaiTT).query(`
                    INSERT INTO THANHTOAN (MaThanhToan, MaDonHang, NgayThanhToan, SoTien, PhuongThuc, MaGiaoDich, TrangThai)
                    VALUES (@MaThanhToan, @MaDonHang, GETDATE(), @SoTien, @PhuongThuc, @MaGiaoDich, @TrangThaiTT)
                `);

      await transaction.commit();
      return { success: true, maDonHang };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = CheckoutModel;
