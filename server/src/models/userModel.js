const { pool } = require("../config/database");

const userModel = {
  // 1. Lấy thông tin chi tiết người dùng bằng mand
  getUserById: async (maND) => {
    try {
      // Postgres chuyển tên bảng/cột thành chữ thường: nguoidung, mand, tendangnhap...
      const query = `
        SELECT mand, tendangnhap, hoten, email, sdt, mavaitro 
        FROM nguoidung 
        WHERE mand = $1
      `;
      const result = await pool.query(query, [maND]);

      // Trả về bản ghi đầu tiên nếu tìm thấy, ngược lại trả về null
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Lỗi tại userModel (getUserById):", error);
      throw error;
    }
  },

  // 2. Kiểm tra trùng lặp Email hoặc SDT với người dùng KHÁC
  checkDuplicate: async (maND, email, sdt) => {
    try {
      // Viết lại câu lệnh lồng để đếm số lượng trùng lặp
      const query = `
        SELECT 
          (SELECT COUNT(*)::int FROM nguoidung WHERE email = $2 AND mand <> $1) AS emailcount,
          (SELECT COUNT(*)::int FROM nguoidung WHERE sdt = $3 AND mand <> $1) AS sdtcount
      `;
      const result = await pool.query(query, [maND, email, sdt]);
      return result.rows[0];
    } catch (error) {
      console.error("Lỗi tại userModel (checkDuplicate):", error);
      throw error;
    }
  },

  // 3. Cập nhật thông tin
  updateUser: async (maND, data) => {
    try {
      const query = `
        UPDATE nguoidung 
        SET hoten = $2, email = $3, sdt = $4 
        WHERE mand = $1
      `;
      await pool.query(query, [maND, data.HoTen, data.Email, data.SDT]);
      return true;
    } catch (error) {
      console.error("Lỗi tại userModel (updateUser):", error);
      throw error;
    }
  },

  // 4. Lấy Hash mật khẩu để đối chiếu
  getPassword: async (maND) => {
    try {
      const query = `SELECT matkhauhash FROM nguoidung WHERE mand = $1`;
      const result = await pool.query(query, [maND]);
      return result.rows.length > 0 ? result.rows[0].matkhauhash : null;
    } catch (error) {
      console.error("Lỗi tại userModel (getPassword):", error);
      throw error;
    }
  },

  // 5. Hàm cập nhật mật khẩu mới
  updatePassword: async (maND, newHash) => {
    try {
      const query = `
        UPDATE nguoidung 
        SET matkhauhash = $2 
        WHERE mand = $1
      `;
      await pool.query(query, [maND, newHash]);
      return true;
    } catch (error) {
      console.error("Lỗi tại userModel (updatePassword):", error);
      throw error;
    }
  },
};

module.exports = userModel;
