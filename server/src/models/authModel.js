const { poolPromise, sql } = require("../config/database");

class AuthModel {
  static async findByIdentifier(identifier) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("identifier", sql.VarChar(100), identifier)
      .query(
        "SELECT * FROM NGUOIDUNG WHERE TenDangNhap = @identifier OR Email = @identifier",
      );

    const user = result.recordset[0];

    if (user && user.TrangThai === false) {
      // Bạn có thể quăng một Error có thông báo rõ ràng
      const error = new Error(
        "Tài khoản này đã bị khóa. Vui lòng liên hệ Admin!",
      );
      error.status = 403; // Forbidden
      throw error;
    }

    return user;
  }

  static async findByMaND(maND) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("maND", sql.VarChar(20), maND)
      .query(
        "SELECT MaND, TenDangNhap, HoTen, MaVaiTro, TrangThai FROM NGUOIDUNG WHERE MaND = @maND",
      );

    return result.recordset[0];
  }

  static async checkDuplicate(username, email) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("username", sql.VarChar(50), username)
      .input("email", sql.VarChar(100), email)
      .query(
        "SELECT TenDangNhap, Email FROM NGUOIDUNG WHERE TenDangNhap = @username OR Email = @email",
      );
    return result.recordset;
  }

  static async createND(data) {
    const pool = await poolPromise;
    // Khởi tạo Transaction để đảm bảo tính toàn vẹn dữ liệu
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const request = new sql.Request(transaction);

      // 1. Thêm vào bảng NGUOIDUNG
      await request
        .input("MaND", sql.VarChar(20), data.maND)
        .input("TenDangNhap", sql.VarChar(50), data.username)
        .input("MatKhauHash", sql.VarChar(255), data.passwordHash)
        .input("HoTen", sql.NVarChar(100), data.fullname)
        .input("Email", sql.VarChar(100), data.email)
        .input("SDT", sql.VarChar(15), data.phone)
        .input("MaVaiTro", sql.VarChar(20), data.maVaiTro).query(`
                INSERT INTO NGUOIDUNG (MaND, TenDangNhap, MatKhauHash, HoTen, Email, SDT, MaVaiTro, TrangThai, NgayTao)
                VALUES (@MaND, @TenDangNhap, @MatKhauHash, @HoTen, @Email, @SDT, @MaVaiTro, 1, GETDATE())
            `);

      // 2. Thêm vào bảng KHACHHANG (Truyền các thuộc tính giống nhau)
      // Giả sử MaKH bạn tự sinh hoặc dùng chung với MaND (tùy nghiệp vụ)
      // Ở đây tôi ví dụ MaKH là data.maKH hoặc dùng tiền tố KH + MaND
      await request.input(
        "MaKH",
        sql.VarChar(20),
        data.maKH || `KH${data.maND}`,
      ).query(`
                INSERT INTO KHACHHANG (MaKH, HoTen, SDT, Email, MaND, NgayTao, DiemTichLuy)
                VALUES (@MaKH, @HoTen, @SDT, @Email, @MaND, GETDATE(), 0)
            `);

      // Hoàn tất giao dịch
      await transaction.commit();
      return { success: true };
    } catch (err) {
      // Nếu có lỗi, hoàn tác lại toàn bộ (không lưu NGUOIDUNG nếu KHACHHANG lỗi)
      if (transaction) await transaction.rollback();
      throw err;
    }
  }
}

module.exports = AuthModel;
