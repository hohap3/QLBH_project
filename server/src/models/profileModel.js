const { poolPromise, sql } = require("../config/database");

class ProfileModel {
  // 1. Lấy thông tin chi tiết bằng cách JOIN bảng NGUOIDUNG và KHACHHANG
  static async getProfileByMaND(maND) {
    try {
      const query = `
                SELECT 
                    nd.MaND, nd.TenDangNhap, nd.NgayTao, nd.TrangThai,
                    kh.MaKH, kh.HoTen, kh.SDT, kh.Email, kh.DiaChi, kh.DiemTichLuy
                FROM NGUOIDUNG nd
                LEFT JOIN KHACHHANG kh ON nd.MaND = kh.MaND
                WHERE nd.MaND = @MaND
            `;
      // SỬA: Sử dụng poolPromise hoặc kết nối chuẩn để đảm bảo tái sử dụng connection ổn định
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaND", sql.VarChar(20), maND)
        .query(query);

      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  // 2. Cập nhật thông tin cá nhân (Cập nhật đồng thời cả 2 bảng để đồng bộ dữ liệu)
  static async updateProfile(maND, data) {
    // SỬA: Lấy pool kết nối trước khi khởi tạo Transaction
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool); // Truyền pool vào đây để sửa lỗi crash kết nối

    try {
      await transaction.begin();

      // Cập nhật bảng NGUOIDUNG
      const queryND = `
                UPDATE NGUOIDUNG 
                SET HoTen = @HoTen, Email = @Email, SDT = @SDT 
                WHERE MaND = @MaND
            `;
      await new sql.Request(transaction)
        .input("MaND", sql.VarChar(20), maND)
        .input("HoTen", sql.NVarChar(100), data.HoTen)
        .input("Email", sql.VarChar(100), data.Email || null)
        .input("SDT", sql.VarChar(15), data.SDT)
        .query(queryND);

      // Cập nhật bảng KHACHHANG (Cho phép DiaChi có thể là NULL)
      const queryKH = `
                UPDATE KHACHHANG 
                SET HoTen = @HoTen, Email = @Email, SDT = @SDT, DiaChi = @DiaChi 
                WHERE MaND = @MaND
            `;
      await new sql.Request(transaction)
        .input("MaND", sql.VarChar(20), maND)
        .input("HoTen", sql.NVarChar(100), data.HoTen)
        .input("Email", sql.VarChar(100), data.Email || null)
        .input("SDT", sql.VarChar(15), data.SDT)
        .input("DiaChi", sql.NVarChar(255), data.DiaChi || null) // Nhận giá trị NULL chính xác
        .query(queryKH);

      await transaction.commit();
      return true;
    } catch (err) {
      // SỬA: Kiểm tra kĩ trạng thái transaction trước khi rollback nhằm tránh lỗi lặp
      if (transaction._backedUp || transaction.isOpen) {
        await transaction.rollback();
      }
      throw err;
    }
  }

  // 3. Lấy mật khẩu mã hóa hiện tại để đối chiếu trước khi đổi
  static async getPasswordHash(maND) {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaND", sql.VarChar(20), maND)
        .query("SELECT MatKhauHash FROM NGUOIDUNG WHERE MaND = @MaND");
      return result.recordset[0];
    } catch (err) {
      throw err;
    }
  }

  // 4. Cập nhật mật khẩu mới (Lưu trường MatKhauHash)
  static async updatePassword(maND, newPasswordHash) {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaND", sql.VarChar(20), maND)
        .input("MatKhauHash", sql.VarChar(255), newPasswordHash)
        .query(
          "UPDATE NGUOIDUNG SET MatKhauHash = @MatKhauHash WHERE MaND = @MaND",
        );
      return true;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = ProfileModel;
