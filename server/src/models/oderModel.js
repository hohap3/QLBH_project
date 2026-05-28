const { sql, poolPromise } = require("../config/database");

const Order = {
  // Lấy danh sách đơn hàng hiển thị ra bảng (giống design)
  getAll: async () => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
                SELECT 
                    dh.MaDonHang,
                    kh.HoTen AS TenKhachHang,
                    kh.Email AS EmailKhachHang,
                    dh.NgayDat,
                    dh.TongTien,
                    dh.TrangThai,
                    (SELECT COUNT(*) FROM CHITIET_DONHANG ct WHERE ct.MaDonHang = dh.MaDonHang) AS SoLuongSanPham
                FROM DONHANG dh
                LEFT JOIN KHACHHANG kh ON dh.MaKH = kh.MaKH
                ORDER BY dh.NgayDat DESC
            `);
    return result.recordset;
  },

  // Lấy chi tiết một đơn hàng bao gồm các mặt hàng đã mua
  getDetails: async (maDonHang) => {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("MaDonHang", sql.VarChar, maDonHang).query(`
                SELECT 
                    dh.MaDonHang,
                    dh.NgayDat,
                    dh.TrangThai,
                    dh.TongTien,
                    dh.GhiChu,
                    -- Thông tin khách hàng mua hàng
                    kh.HoTen AS HoTenKhachHang, 
                    kh.SDT AS SDTKhachHang, 
                    kh.Email AS EmailKhachHang, 
                    kh.DiaChi AS DiaChiKhachHang,
                    -- Thông tin tài khoản người dùng liên kết với khách hàng này
                    nd.TenDangNhap AS TenDangNhap,
                    -- Thông tin chi tiết sản phẩm trong đơn hàng
                    ct.MaSP, 
                    ct.SoLuong, 
                    ct.GiaBan, 
                    ct.GiamGia
                FROM DONHANG dh
                LEFT JOIN KHACHHANG kh ON dh.MaKH = kh.MaKH
                LEFT JOIN NGUOIDUNG nd ON kh.MaND = nd.MaND -- Lấy thông tin tài khoản qua MaND
                LEFT JOIN CHITIET_DONHANG ct ON dh.MaDonHang = ct.MaDonHang
                WHERE dh.MaDonHang = @MaDonHang
            `);
    return result.recordset;
  },

  // Cập nhật trạng thái đơn hàng (Đã giao, Đang xử lý, v.v.)
  updateStatus: async (maDonHang, trangThai) => {
    const pool = await poolPromise;
    return await pool
      .request()
      .input("MaDonHang", sql.VarChar, maDonHang)
      .input("TrangThai", sql.NVarChar, trangThai).query(`
                UPDATE DONHANG 
                SET TrangThai = @TrangThai 
                WHERE MaDonHang = @MaDonHang
            `);
  },
};

module.exports = Order;
