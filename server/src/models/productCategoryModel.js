const { pool } = require("../config/database");

const productCategoryModel = {
  // 1. Lấy tất cả danh mục
  getAllCategories: async () => {
    try {
      // Viết thường hoàn toàn, không nháy kép theo đúng cấu trúc trên Neon.tech
      const result = await pool.query(
        "SELECT madanhmuc, tendanhmuc, mota FROM danhmuc",
      );
      return result.rows; // Trả về mảng dữ liệu
    } catch (error) {
      throw error;
    }
  },

  // 2. Lấy 1 danh mục theo ID (Dùng cho chức năng Sửa)
  getCategoryById: async (maDM) => {
    try {
      // Sửa hoàn toàn điều kiện lọc theo cột madanhmuc viết thường
      const result = await pool.query(
        "SELECT madanhmuc, tendanhmuc, mota FROM danhmuc WHERE madanhmuc = $1",
        [maDM],
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 3. Thêm danh mục mới
  createCategory: async (data) => {
    try {
      const sql = `
        INSERT INTO danhmuc (madanhmuc, tendanhmuc, mota)
        VALUES ($1, $2, $3)
      `;
      const params = [data.MaDanhMuc, data.TenDanhMuc, data.MoTa || null];

      await pool.query(sql, params);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // 4. Cập nhật danh mục
  updateCategory: async (maDM, data) => {
    try {
      const sql = `
        UPDATE danhmuc 
        SET tendanhmuc = $1, mota = $2 
        WHERE madanhmuc = $3
      `;
      const params = [data.TenDanhMuc, data.MoTa || null, maDM];

      const result = await pool.query(sql, params);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  },

  // 5. Xóa danh mục
  deleteCategory: async (maDM) => {
    try {
      const result = await pool.query(
        "DELETE FROM danhmuc WHERE madanhmuc = $1",
        [maDM],
      );
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = productCategoryModel;
