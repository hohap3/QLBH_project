const { pool } = require("../config/database");

class ProfileModel {
  // 1. Lấy thông tin chi tiết bằng cách JOIN bảng nguoidung và khachhang
  static async getProfileByMaND(maND) {
    try {
      // ĐÃ SỬA: Chuyển sang cú pháp Postgres ($1) và đồng bộ chữ thường
      const query = `
        SELECT 
          nd.mand, nd.tendangnhap, nd.ngaytao, nd.trangthai,
          kh.makh, kh.hoten, kh.sdt, kh.email, kh.diachi, kh.diemtichluy
        FROM nguoidung nd
        LEFT JOIN khachhang kh ON nd.mand = kh.mand
        WHERE nd.mand = $1
      `;

      const result = await pool.query(query, [maND]);
      return result.rows[0]; // Postgres trả về mảng rows thay vì recordset
    } catch (err) {
      throw err;
    }
  }

  // 2. Cập nhật thông tin cá nhân (Sử dụng Postgres Transaction)
  static async updateProfile(maND, data) {
    const client = await pool.connect(); // Lấy client riêng biệt để chạy Transaction

    try {
      await client.query("BEGIN");

      // Cập nhật bảng nguoidung
      const queryND = `
        UPDATE nguoidung 
        SET hoten = $1, email = $2, sdt = $3 
        WHERE mand = $4
      `;
      await client.query(queryND, [
        data.hoten,
        data.email || null,
        data.sdt,
        maND,
      ]);

      // Cập nhật bảng khachhang
      const queryKH = `
        UPDATE khachhang 
        SET hoten = $1, email = $2, sdt = $3, diachi = $4 
        WHERE mand = $5
      `;
      await client.query(queryKH, [
        data.hoten,
        data.email || null,
        data.sdt,
        data.diachi || null,
        maND,
      ]);

      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release(); // Giải phóng kết nối trả về pool
    }
  }

  // 3. Lấy mật khẩu băm hiện tại để đối chiếu
  static async getPasswordHash(maND) {
    try {
      const result = await pool.query(
        "SELECT matkhauhash FROM nguoidung WHERE mand = $1",
        [maND],
      );
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  }

  // 4. Cập nhật mật khẩu mới
  static async updatePassword(maND, newPasswordHash) {
    try {
      await pool.query(
        "UPDATE nguoidung SET matkhauhash = $1 WHERE mand = $2",
        [newPasswordHash, maND],
      );
      return true;
    } catch (err) {
      throw err;
    }
  }
}

module.exports = ProfileModel;
