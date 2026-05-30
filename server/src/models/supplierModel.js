// src/models/supplierModel.js
const { poolPromise } = require("../config/database");

const Supplier = {
  // Lấy tất cả nhà cung cấp (Sắp xếp theo ngày tạo giảm dần)
  getAll: async () => {
    try {
      const pool = await poolPromise;
      // PostgreSQL khuyến khích viết thường tên bảng/trường: nhacungcap, ngaytao
      const query = "SELECT * FROM nhacungcap ORDER BY ngaytao DESC";
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết 1 nhà cung cấp
  getById: async (maNCC) => {
    try {
      const pool = await poolPromise;
      const query = "SELECT * FROM nhacungcap WHERE mancc = $1";
      const result = await pool.query(query, [maNCC]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Thêm mới nhà cung cấp
  create: async (data) => {
    try {
      const pool = await poolPromise;
      const query = `
                INSERT INTO nhacungcap (mancc, tenncc, sdt, email, diachi, trangthai)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
      const values = [
        data.MaNCC,
        data.TenNCC,
        data.SDT,
        data.Email,
        data.DiaChi,
        data.TrangThai !== undefined ? data.TrangThai : true, // Kiểu BOOLEAN trong Postgres
      ];
      return await pool.query(query, values);
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật nhà cung cấp
  update: async (maNCC, data) => {
    try {
      const pool = await poolPromise;
      const query = `
                UPDATE nhacungcap 
                SET tenncc = $1, sdt = $2, email = $3, diachi = $4, trangthai = $5
                WHERE mancc = $6
            `;
      const values = [
        data.TenNCC,
        data.SDT || null,
        data.Email || null,
        data.DiaChi || null,
        data.TrangThai ? true : false,
        maNCC,
      ];
      return await pool.query(query, values);
    } catch (error) {
      throw error;
    }
  },

  // Xóa nhà cung cấp
  delete: async (maNCC) => {
    try {
      const pool = await poolPromise;
      const query = "DELETE FROM nhacungcap WHERE mancc = $1";
      return await pool.query(query, [maNCC]);
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Supplier;
