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
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // 4. Tạo tài khoản mới ứng dụng Transaction của PostgreSQL
  static async createND(data) {
    // Lấy 1 client riêng biệt từ pool để đảm bảo tiến trình Transaction liền mạch
    const client = await pool.connect();

    try {
      // Bắt đầu Giao dịch
      await client.query("BEGIN");

      // 🟢 ĐÃ CẬP NHẬT: Ép chặt mavaitro luôn là 'Client' ở tham số $7 để tăng tính bảo mật
      const insertUserSql = `
        INSERT INTO nguoidung (mand, tendangnhap, matkhauhash, hoten, email, sdt, mavaitro, trangthai, ngaytao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
      `;
      const userParams = [
        data.maND,
        data.username,
        data.passwordHash,
        data.fullname,
        data.email,
        data.phone,
        "Client", // Gán cứng giá trị 'Client' tại đây thay vì dùng data.maVaiTro động
      ];
      await client.query(insertUserSql, userParams);

      // Lệnh 2: Thêm thông tin tương ứng vào bảng khachhang
      const insertCustomerSql = `
        INSERT INTO khachhang (makh, hoten, sdt, email, diachi, mand, ngaytao, diemtichluy)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0)
      `;
      const customerParams = [
        data.maKH,
        data.fullname,
        data.phone,
        data.email,
        data.diaChi || null, // Đảm bảo đồng bộ cho phép nhận giá trị null nếu người dùng không điền address
        data.maND,
      ];
      await client.query(insertCustomerSql, customerParams);

      // Hoàn tất giao dịch thành công
      await client.query("COMMIT");
      return { success: true };
    } catch (err) {
      // Nếu xuất hiện bất kỳ lỗi nào ở 1 trong 2 lệnh, hoàn tác (Rollback) toàn bộ dữ liệu ngay lập tức
      await client.query("ROLLBACK");
      throw err;
    } finally {
      // Giải phóng client trả về lại cho pool
      client.release();
    }
  }

  static async updateOTP(email, otpCode, expiredAt) {
    try {
      const result = await pool.query(
        "UPDATE nguoidung SET otp_code = $1, otp_expired = $2 WHERE email = $3 RETURNING mand",
        [otpCode, expiredAt, email],
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async verifyAndResetPassword(email, otp, newPasswordHash) {
    try {
      // Lấy thông tin OTP hiện tại lên so sánh
      const userResult = await pool.query(
        "SELECT otp_code, otp_expired FROM nguoidung WHERE email = $1",
        [email],
      );

      if (userResult.rows.length === 0) {
        return {
          success: false,
          message: "Email không tồn tại trên hệ thống!",
        };
      }

      const user = userResult.rows[0];

      if (!user.otp_code || user.otp_code !== otp) {
        return { success: false, message: "Mã xác thực OTP không chính xác!" };
      }

      if (new Date() > new Date(user.otp_expired)) {
        return {
          success: false,
          message: "Mã xác thực OTP đã hết hạn sử dụng!",
        };
      }

      // Cập nhật mật khẩu mới và dọn sạch cột OTP
      await pool.query(
        "UPDATE nguoidung SET matkhauhash = $1, otp_code = NULL, otp_expired = NULL WHERE email = $2",
        [newPasswordHash, email],
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthModel;
