const { sql, poolPromise } = require("../config/database");

const Supplier = {
  // Lấy tất cả nhà cung cấp
  getAll: async () => {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM NHACUNGCAP ORDER BY NgayTao DESC");
    return result.recordset;
  },

  // Lấy chi tiết 1 nhà cung cấp
  getById: async (maNCC) => {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("MaNCC", sql.VarChar, maNCC)
      .query("SELECT * FROM NHACUNGCAP WHERE MaNCC = @MaNCC");
    return result.recordset[0];
  },

  // Thêm mới nhà cung cấp
  create: async (data) => {
    const pool = await poolPromise;
    return await pool
      .request()
      .input("MaNCC", sql.VarChar, data.MaNCC)
      .input("TenNCC", sql.NVarChar, data.TenNCC)
      .input("SDT", sql.VarChar, data.SDT)
      .input("Email", sql.VarChar, data.Email)
      .input("DiaChi", sql.NVarChar, data.DiaChi)
      .input(
        "TrangThai",
        sql.Bit,
        data.TrangThai !== undefined ? data.TrangThai : 1,
      ).query(`
                INSERT INTO NHACUNGCAP (MaNCC, TenNCC, SDT, Email, DiaChi, TrangThai)
                VALUES (@MaNCC, @TenNCC, @SDT, @Email, @DiaChi, @TrangThai)
            `);
  },

  // Cập nhật nhà cung cấp
  update: async (maNCC, data) => {
    const pool = await poolPromise;
    return await pool
      .request()
      .input("MaNCC", sql.VarChar, maNCC)
      .input("TenNCC", sql.NVarChar, data.TenNCC)
      .input("SDT", sql.VarChar, data.SDT || null) // Cho phép null nếu trống
      .input("Email", sql.VarChar, data.Email || null)
      .input("DiaChi", sql.NVarChar, data.DiaChi || null)
      // Chuyển đổi về 1 hoặc 0 cho kiểu BIT
      .input("TrangThai", sql.Bit, data.TrangThai ? 1 : 0).query(`
            UPDATE NHACUNGCAP 
            SET TenNCC = @TenNCC, SDT = @SDT, Email = @Email, DiaChi = @DiaChi, TrangThai = @TrangThai
            WHERE MaNCC = @MaNCC
        `);
  },

  // Xóa nhà cung cấp
  delete: async (maNCC) => {
    const pool = await poolPromise;
    return await pool
      .request()
      .input("MaNCC", sql.VarChar, maNCC)
      .query("DELETE FROM NHACUNGCAP WHERE MaNCC = @MaNCC");
  },
};

module.exports = Supplier;
