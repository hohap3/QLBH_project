const { sql, poolPromise } = require("../config/database");

const Customer = {
  // 1. Lấy tất cả khách hàng (Kèm trạng thái tài khoản người dùng)
  getAll: async () => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
            SELECT 
                kh.MaKH, kh.HoTen, kh.SDT, kh.Email, kh.DiaChi, kh.NgayTao, kh.DiemTichLuy,
                nd.TrangThai, -- Lấy từ bảng NGUOIDUNG để biết tài khoản có bị khóa không
                COUNT(dh.MaDonHang) AS TongDonHang, -- Tính dựa trên số hóa đơn của khách
                MAX(dh.NgayDat) AS DonGanNhat
            FROM KHACHHANG kh
            LEFT JOIN NGUOIDUNG nd ON kh.MaND = nd.MaND
            LEFT JOIN DONHANG dh ON kh.MaKH = dh.MaKH
            GROUP BY 
                kh.MaKH, kh.HoTen, kh.SDT, kh.Email, 
                kh.DiaChi, kh.NgayTao, kh.DiemTichLuy, nd.TrangThai
            ORDER BY kh.NgayTao DESC
        `);
    return result.recordset;
  },

  // 2. Lấy chi tiết 1 khách hàng
  getById: async (maKH) => {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("MaKH", sql.VarChar, maKH)
      .query("SELECT * FROM KHACHHANG WHERE MaKH = @MaKH");
    return result.recordset[0];
  },

  // 3. Lấy lịch sử hóa đơn mua hàng của khách hàng
  getOrderHistory: async (maKH) => {
    const pool = await poolPromise;
    const result = await pool.request().input("MaKH", sql.VarChar, maKH).query(`
                SELECT MaDonHang, NgayDat, TongTien, TrangThai 
                FROM DONHANG 
                WHERE MaKH = @MaKH 
                ORDER BY NgayDat DESC
            `);
    return result.recordset;
  },

  // 4. Thêm mới khách hàng
  create: async (data) => {
    const pool = await poolPromise;
    return await pool
      .request()
      .input("MaKH", sql.VarChar, data.MaKH)
      .input("HoTen", sql.NVarChar, data.HoTen)
      .input("SDT", sql.VarChar, data.SDT)
      .input("Email", sql.VarChar, data.Email || null)
      .input("DiaChi", sql.NVarChar, data.DiaChi || null)
      .input("DiemTichLuy", sql.Int, data.DiemTichLuy || 0)
      .input("MaND", sql.VarChar, data.MaND || null).query(`
                INSERT INTO KHACHHANG (MaKH, HoTen, SDT, Email, DiaChi, DiemTichLuy, MaND)
                VALUES (@MaKH, @HoTen, @SDT, @Email, @DiaChi, @DiemTichLuy, @MaND)
            `);
  },

  // 5. Cập nhật thông tin khách hàng & Điểm tích lũy
  update: async (maKH, data) => {
    const pool = await poolPromise;
    return await pool
      .request()
      .input("MaKH", sql.VarChar, maKH)
      .input("HoTen", sql.NVarChar, data.HoTen)
      .input("SDT", sql.VarChar, data.SDT)
      .input("Email", sql.VarChar, data.Email || null)
      .input("DiaChi", sql.NVarChar, data.DiaChi || null)
      .input("DiemTichLuy", sql.Int, data.DiemTichLuy || 0).query(`
                UPDATE KHACHHANG 
                SET HoTen = @HoTen, 
                    SDT = @SDT, 
                    Email = @Email, 
                    DiaChi = @DiaChi, 
                    DiemTichLuy = @DiemTichLuy
                WHERE MaKH = @MaKH
            `);
  },

  // 6. ✅ THAY THẾ XÓA BẰNG: Khóa / Mở khóa trạng thái tài khoản (Soft Delete)
  toggleStatus: async (maKH, trangThai) => {
    const pool = await poolPromise;
    // Cập nhật trường TrangThai trong bảng NGUOIDUNG thông qua liên kết khóa ngoại MaND
    return await pool
      .request()
      .input("MaKH", sql.VarChar, maKH)
      .input("TrangThai", sql.Bit, trangThai) // true (1): Hoạt động, false (0): Khóa
      .query(`
                UPDATE NGUOIDUNG 
                SET TrangThai = @TrangThai 
                WHERE MaND = (SELECT MaND FROM KHACHHANG WHERE MaKH = @MaKH)
            `);
  },
};

module.exports = Customer;
