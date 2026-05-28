const { poolPromise, sql } = require("../config/database");

const OrderHistoryModel = {
  getHistoryByUserId: async (maND) => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT 
                    dh.MaDonHang,
                    dh.NgayDat,
                    dh.TrangThai,
                    dh.TongTien,
                    dh.GhiChu
                FROM DONHANG dh
                WHERE dh.MaNguoiDung = @maND
                ORDER BY dh.NgayDat DESC
            `;

      const result = await pool
        .request()
        .input("maND", sql.VarChar(20), maND)
        .query(query);

      return result.recordset;
    } catch (error) {
      console.error("Lỗi Model getHistoryByUserId:", error);
      throw error;
    }
  },

  getItemsByOrderId: async (maDonHang) => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT 
                    ct.MaSP,
                    sp.TenSP,
                    sp.HinhAnh,
                    ct.SoLuong,
                    ct.GiaBan,
                    ct.GiamGia,
                    (ct.SoLuong * ct.GiaBan - ct.GiamGia) AS ThanhTien
                FROM CHITIET_DONHANG ct
                JOIN SANPHAM sp ON ct.MaSP = sp.MaSP
                WHERE ct.MaDonHang = @maDonHang
            `;

      const result = await pool
        .request()
        .input("maDonHang", sql.VarChar(20), maDonHang)
        .query(query);

      return result.recordset;
    } catch (error) {
      console.error("Lỗi Model getItemsByOrderId:", error);
      throw error;
    }
  },
};

module.exports = OrderHistoryModel;
