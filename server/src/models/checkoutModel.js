// src/models/checkoutModel.js
const { pool } = require("../config/database");

class CheckoutModel {
  static async saveCheckoutTransaction(checkoutData) {
    // 1. Rút một kết nối đơn lẻ (client) từ Pool ra để chạy Transaction độc lập
    const client = await pool.connect();

    try {
      // 2. BẮT ĐẦU TRANSACTION TRÊN POSTGRESQL
      await client.query("BEGIN");

      // 🟢 BƯỚC BỔ SUNG: Tìm MaKH từ MaNguoiDung trước khi chèn đơn hàng
      let maKhachHang = null;
      if (checkoutData.MaNguoiDung) {
        const findCustomerQuery = `SELECT "makh" FROM "khachhang" WHERE "mand" = $1`;
        const customerResult = await client.query(findCustomerQuery, [
          checkoutData.MaNguoiDung,
        ]);

        // Lưu ý: Postgres tự động viết thường tên cột nếu không bọc nháy kép, bạn check lại đúng tên cột trong DB nhé
        if (customerResult.rows && customerResult.rows.length > 0) {
          maKhachHang =
            customerResult.rows[0].makh || customerResult.rows[0].MaKH;
        }
      }

      // 3. SINH MÃ ĐƠN HÀNG TỰ ĐỘNG
      const maDonHang = "DH" + Date.now().toString().slice(-8);

      // Tính toán tổng tiền thực tế từ giỏ hàng
      const tongTien = checkoutData.ChiTiet.reduce(
        (sum, item) => sum + item.GiaBan * item.SoLuong,
        0,
      );

      // 4. CHÈN VÀO TABLE: DONHANG (Sử dụng tham số dạng $1, $2, $3 của pg)
      const insertOrderQuery = `
        INSERT INTO "donhang" ("madonhang", "makh", "manguoidung", "ngaydat", "trangthai", "tongtien", "ghichu")
        VALUES ($1, $2, $3, NOW(), $4, $5, $6)
      `;
      const orderValues = [
        maDonHang,
        maKhachHang,
        checkoutData.MaNguoiDung,
        "Chờ xác nhận",
        tongTien,
        checkoutData.GhiChu,
      ];
      await client.query(insertOrderQuery, orderValues);

      // 5. CHÈN VÀO TABLE: CHITIET_DONHANG & TRỪ KHO SANPHAM
      const insertDetailQuery = `
        INSERT INTO "chitiet_donhang" ("madonhang", "masp", "soluong", "giaban", "giamgia")
        VALUES ($1, $2, $3, $4, 0)
      `;
      const updateStockQuery = `
        UPDATE "sanpham" 
        SET "soluongton" = "soluongton" - $1 
        WHERE "masp" = $2
      `;

      for (const item of checkoutData.ChiTiet) {
        // Chèn chi tiết đơn hàng
        await client.query(insertDetailQuery, [
          maDonHang,
          item.MaSP,
          item.SoLuong,
          item.GiaBan,
        ]);

        // Cập nhật số lượng tồn kho sản phẩm
        await client.query(updateStockQuery, [item.SoLuong, item.MaSP]);
      }

      // 6. CHÈN VÀO TABLE: PHIEUGIAOHANG
      const maGiaoHang = "GH" + Date.now().toString().slice(-8);
      const insertDeliveryQuery = `
        INSERT INTO "phieugiaohang" ("magiaohang", "madonhang", "diachi", "ngaygiao", "trangthai", "nguoinhan", "sdtnguoinhan")
        VALUES ($1, $2, $3, NOW(), $4, $5, $6)
      `;
      const deliveryValues = [
        maGiaoHang,
        maDonHang,
        checkoutData.DiaChi,
        "Chưa Giao",
        checkoutData.NguoiNhan,
        checkoutData.SDTNguoiNhan,
      ];
      await client.query(insertDeliveryQuery, deliveryValues);

      // 7. CHÈN VÀO TABLE: THANHTOAN
      const maThanhToan = "TT" + Date.now().toString().slice(-8);
      const trangThaiTT =
        checkoutData.PhuongThucThanhToan === "COD"
          ? "Chưa Thanh Toán"
          : "Chờ Xác Nhận";

      const insertPaymentQuery = `
        INSERT INTO "thanhtoan" ("mathanhtoan", "madonhang", "ngaythanhtoan", "sotien", "phuongthuc", "magiaodich", "trangthai")
        VALUES ($1, $2, NOW(), $3, $4, NULL, $5)
      `;
      const paymentValues = [
        maThanhToan,
        maDonHang,
        tongTien,
        checkoutData.PhuongThucThanhToan,
        trangThaiTT,
      ];
      await client.query(insertPaymentQuery, paymentValues);

      // 🟢 XÁC NHẬN LƯU TẤT CẢ DỮ LIỆU VÀO POSTGRESQL NẾU KHÔNG CÓ LỖI
      await client.query("COMMIT");

      return { maDonHang: maDonHang };
    } catch (error) {
      // 🔴 HOÀN TÁC TOÀN BỘ NẾU XẢY RA LỖI GIỮA CHỪNG (Chống rác database)
      await client.query("ROLLBACK");
      throw error;
    } finally {
      // 🟢 GIẢI PHÓNG KẾT NỐI: Trả client lại cho pool quản lý
      client.release();
    }
  }
}

module.exports = CheckoutModel;
