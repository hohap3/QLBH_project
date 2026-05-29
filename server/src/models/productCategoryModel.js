// Chỉ cần require pool từ file cấu hình database.js mới của bạn
const { pool } = require("../config/database");

const productCategoryModel = {
  // Lấy tất cả danh mục
  getAllCategories: async () => {
    try {
      // Postgres truy vấn trực tiếp từ đối tượng pool
      const result = await pool.query(
        'SELECT "MaDanhMuc", "TenDanhMuc", "MoTa" FROM "DANHMUC"',
      );
      return result.rows; // Trả về mảng dữ liệu nằm trong rows
    } catch (error) {
      throw error;
    }
  },

  // Lấy 1 danh mục theo ID (Dùng cho chức năng Sửa)
  getCategoryById: async (maDM) => {
    try {
      // Dùng tham số $1 chống SQL Injection thay cho @MaDanhMuc
      const result = await pool.query(
        'SELECT "MaDanhMuc", "TenDanhMuc", "MoTa" FROM "DANHMUC" WHERE "MaDanhMuc" = $1',
        [maDM],
      );
      return result.rows[0]; // Trả về object đầu tiên hoặc undefined nếu không có
    } catch (error) {
      throw error;
    }
  },

  // Thêm danh mục mới
  createCategory: async (data) => {
    try {
      const sql = `
        INSERT INTO "DANHMUC" ("MaDanhMuc", "TenDanhMuc", "MoTa")
        VALUES ($1, $2, $3)
      `;
      const params = [data.MaDanhMuc, data.TenDanhMuc, data.MoTa || null];

      await pool.query(sql, params);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật danh mục
  updateCategory: async (maDM, data) => {
    try {
      const sql = `
        UPDATE "DANHMUC" 
        SET "TenDanhMuc" = $1, "MoTa" = $2 
        WHERE "MaDanhMuc" = $3
      `;
      const params = [data.TenDanhMuc, data.MoTa || null, maDM];

      const result = await pool.query(sql, params);
      return result.rowCount > 0; // rowCount thay thế cho rowsAffected[0]
    } catch (error) {
      throw error;
    }
  },

  // Xóa danh mục
  deleteCategory: async (maDM) => {
    try {
      const result = await pool.query(
        'DELETE FROM "DANHMUC" WHERE "MaDanhMuc" = $1',
        [maDM],
      );
      return result.rowCount > 0; // Trả về true nếu xóa thành công ít nhất 1 dòng
    } catch (error) {
      throw error;
    }
  },
};

module.exports = productCategoryModel;
