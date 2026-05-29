const { pool } = require("../config/database");

class AuthModel {
  // 1. Tìm người dùng bằng tên đăng nhập hoặc email
  static async findByIdentifier(identifier) {
    try {
      const result = await pool.query(
        "SELECT * FROM nguoidung WHERE tendangnhap = $1 OR email = $1",
        [identifier],
      );

      const user = result.rows[0];

      // Lưu ý: Postgres trả về kiểu BOOLEAN thực sự (true/false) hoặc số 0/1 tùy cấu trúc, check cả 2 cho chắc chắn
      if (user && (user.trangthai === false || user.trangthai === 0)) {
        const error = new Error(
          "Tài khoản này đã bị khóa. Vui lòng liên hệ Admin!",
        );
        error.status = 403;
        throw error;
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // 2. Tìm người dùng bằng mã (Dùng để verify token)
  static async findByMaND(maND) {
    try {
      const result = await pool.query(
        "SELECT mand, tendangnhap, hoten, mavaitro, trangthai FROM nguoidung WHERE mand = $1",
        [maND],
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 3. Kiểm tra trùng lặp tài khoản / email
  static async checkDuplicate(username, email) {
    try {
      const result = await pool.query(
        "SELECT tendangnhap, email FROM nguoidung WHERE tendangnhap = $1 OR email = $2",
        [username, email],
      );
      return result.rows; // Trả về mảng các tài khoản trùng lặp
    } catch (error) {
      throw error;
    }
  }

  // 4. Tạo tài khoản mới ứng dụng Transaction của PostgreSQL
  static async createND(data) {
    // Để chạy Transaction trong node-postgres, ta bắt buộc phải lấy ra 1 client riêng biệt
    const client = await pool.connect();

    try {
      // Bắt đầu Giao dịch
      await client.query("BEGIN");

      // Lệnh 1: Thêm tài khoản mới vào bảng nguoidung (Dùng NOW() thay cho GETDATE())
      const insertUserSql = `
        INSERT INTO nguoidung (mand, tendangnhap, matkhauhash, hoten, email, sdt, mavaitro, trangthai, ngaytao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW())
      `;
      const userParams = [
        data.maND,
        data.username,
        data.passwordHash,
        data.fullname,
        data.email,
        data.phone,
        data.maVaiTro,
      ];
      await client.query(insertUserSql, userParams);

      // Lệnh 2: Thêm thông tin vào bảng khachhang (Có bổ sung thêm cột diachi của bạn)
      const insertCustomerSql = `
        INSERT INTO khachhang (makh, hoten, sdt, email, diachi, mand, ngaytao, diemtichluy)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0)
      `;
      const customerParams = [
        data.maKH,
        data.fullname,
        data.phone,
        data.email,
        data.diaChi, // Dữ liệu địa chỉ truyền từ req.body
        data.maND,
      ];
      await client.query(insertCustomerSql, customerParams);

      // Hoàn tất giao dịch thành công
      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      // Nếu xuất hiện bất kỳ lỗi nào, hoàn tác (Rollback) lại toàn bộ dữ liệu
      await client.query("ROLLBACK");
      throw err;
    } finally {
      // Giải phóng client trả về lại cho pool
      client.release();
    }
  }
}

module.exports = AuthModel;
