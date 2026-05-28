const { sql, poolPromise } = require("../config/database");

const productCategoryModel = {
  // Lấy tất cả danh mục
  getAllCategories: async () => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .query("SELECT MaDanhMuc, TenDanhMuc, MoTa FROM DANHMUC");
      return result.recordset;
    } catch (error) {
      throw error;
    }
  },

  // Lấy 1 danh mục theo ID (Dùng cho chức năng Sửa)
  getCategoryById: async (maDM) => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaDanhMuc", sql.VarChar, maDM)
        .query(
          "SELECT MaDanhMuc, TenDanhMuc, MoTa FROM DANHMUC WHERE MaDanhMuc = @MaDanhMuc",
        );
      return result.recordset[0]; // Trả về object đầu tiên
    } catch (error) {
      throw error;
    }
  },

  // Thêm danh mục mới
  createCategory: async (data) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaDanhMuc", sql.VarChar, data.MaDanhMuc)
        .input("TenDanhMuc", sql.NVarChar, data.TenDanhMuc)
        .input("MoTa", sql.NVarChar, data.MoTa || null) // Tránh lỗi nếu MoTa để trống
        .query(`
                    INSERT INTO DANHMUC (MaDanhMuc, TenDanhMuc, MoTa)
                    VALUES (@MaDanhMuc, @TenDanhMuc, @MoTa)
                `);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật danh mục
  updateCategory: async (maDM, data) => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaDanhMuc", sql.VarChar, maDM)
        .input("TenDanhMuc", sql.NVarChar, data.TenDanhMuc)
        .input("MoTa", sql.NVarChar, data.MoTa || null).query(`
                    UPDATE DANHMUC 
                    SET TenDanhMuc = @TenDanhMuc, MoTa = @MoTa 
                    WHERE MaDanhMuc = @MaDanhMuc
                `);
      return result.rowsAffected[0] > 0; // Trả về true nếu có dòng được cập nhật
    } catch (error) {
      throw error;
    }
  },

  // Xóa danh mục
  deleteCategory: async (maDM) => {
    try {
      const pool = await poolPromise;
      const result = await pool
        .request()
        .input("MaDanhMuc", sql.VarChar, maDM)
        .query("DELETE FROM DANHMUC WHERE MaDanhMuc = @MaDanhMuc");
      return result.rowsAffected[0] > 0; // Trả về true nếu có dòng bị xóa
    } catch (error) {
      throw error;
    }
  },
};

module.exports = productCategoryModel;
