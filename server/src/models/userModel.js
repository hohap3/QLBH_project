const { sql, poolPromise } = require("../config/database");

const userModel = {
  // Lấy thông tin chi tiết người dùng bằng MaND
  getUserById: async (maND) => {
    try {
      const pool = await poolPromise; // Chờ kết nối thành công
      const result = await pool
        .request()
        .input("MaND", sql.VarChar, maND)
        .query(
          "SELECT MaND, TenDangNhap, HoTen, Email, SDT, MaVaiTro FROM NGUOIDUNG WHERE MaND = @MaND",
        );

      return result.recordset[0]; // Trả về bản ghi đầu tiên tìm thấy
    } catch (error) {
      console.error("Lỗi tại userModel:", error);
      throw error;
    }
  },

  // Kiểm tra trùng lặp Email hoặc SDT với người dùng KHÁC
  checkDuplicate: async (maND, email, sdt) => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaND", sql.NVarChar, maND)
        .input("Email", sql.VarChar, email)
        .input("SDT", sql.VarChar, sdt).query(`
                    SELECT 
                        (SELECT COUNT(*) FROM NGUOIDUNG WHERE Email = @Email AND MaND <> @MaND) AS EmailCount,
                        (SELECT COUNT(*) FROM NGUOIDUNG WHERE SDT = @SDT AND MaND <> @MaND) AS SDTCount
                `);
      return result.recordset[0];
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật thông tin
  updateUser: async (maND, data) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaND", sql.NVarChar, maND)
        .input("HoTen", sql.NVarChar, data.HoTen)
        .input("Email", sql.VarChar, data.Email)
        .input("SDT", sql.VarChar, data.SDT).query(`
                    UPDATE NGUOIDUNG 
                    SET HoTen = @HoTen, Email = @Email, SDT = @SDT 
                    WHERE MaND = @MaND
                `);
      return true;
    } catch (error) {
      throw error;
    }
  },

  getPassword: async (maND) => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaND", sql.NVarChar, maND)
        .query("SELECT MatKhauHash FROM NGUOIDUNG WHERE MaND = @MaND");
      return result.recordset[0] ? result.recordset[0].MatKhauHash : null;
    } catch (error) {
      throw error;
    }
  },

  // Hàm cập nhật mật khẩu mới
  updatePassword: async (maND, newHash) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaND", sql.NVarChar, maND)
        .input("NewHash", sql.VarChar, newHash)
        .query(
          "UPDATE NGUOIDUNG SET MatKhauHash = @NewHash WHERE MaND = @MaND",
        );
      return true;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = userModel;
