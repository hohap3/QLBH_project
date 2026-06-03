// src/models/employeeModel.js
const { poolPromise } = require("../config/database");

class EmployeeModel {
  // 1. Lấy danh sách nhân viên có phân trang (Mặc định 10 nhân viên/trang)
  static async getAllEmployees(page = 1, limit = 10, search = "", status = "") {
    try {
      const pool = await poolPromise;
      const offset = (page - 1) * limit;

      let query = `
        SELECT mand, tendangnhap, hoten, email, sdt, ngaytao, trangthai, mavaitro 
        FROM nguoidung 
        WHERE mavaitro = 'Employee'
      `;
      const values = [];
      let paramIndex = 1;

      // Nếu có từ khóa tìm kiếm (Tìm theo Mã, Họ tên, SĐT hoặc Email)
      if (search) {
        query += ` AND (mand ILIKE $${paramIndex} OR hoten ILIKE $${paramIndex} OR sdt ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }

      // Nếu có chọn lọc trạng thái (1: Hoạt động, 0: Khóa)
      if (status !== "") {
        query += ` AND trangthai = $${paramIndex}`;
        values.push(status === "1");
        paramIndex++;
      }

      // Thêm sắp xếp và phân trang
      query += ` ORDER BY ngaytao DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // 1b. Đếm tổng số lượng nhân viên thỏa mãn điều kiện lọc (Bắt buộc phải đồng bộ để tính số trang chính xác)
  static async countEmployees(search = "", status = "") {
    try {
      const pool = await poolPromise;

      let query = `
        SELECT COUNT(*) as total 
        FROM nguoidung 
        WHERE mavaitro = 'Employee'
      `;
      const values = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (mand ILIKE $${paramIndex} OR hoten ILIKE $${paramIndex} OR sdt ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }

      if (status !== "") {
        query += ` AND trangthai = $${paramIndex}`;
        values.push(status === "1");
        paramIndex++;
      }

      const result = await pool.query(query, values);
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      throw error;
    }
  }

  // 2. Lấy thông tin chi tiết một nhân viên theo Mã
  static async getEmployeeById(id) {
    try {
      const pool = await poolPromise;
      const query = `
        SELECT mand, tendangnhap, hoten, email, sdt, ngaytao, trangthai, mavaitro 
        FROM nguoidung 
        WHERE mand = $1 AND mavaitro = 'Employee'
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 3. Thêm mới một nhân viên
  static async createEmployee(employeeData) {
    try {
      const pool = await poolPromise;
      const query = `
        INSERT INTO nguoidung (mand, tendangnhap, matkhauhash, hoten, email, sdt, mavaitro, trangthai)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      `;
      const values = [
        employeeData.MaND,
        employeeData.TenDangNhap,
        employeeData.MatKhauHash,
        employeeData.HoTen,
        employeeData.Email,
        employeeData.SDT,
        "Employee",
      ];
      await pool.query(query, values);
      return { MaND: employeeData.MaND, TenDangNhap: employeeData.TenDangNhap };
    } catch (error) {
      throw error;
    }
  }

  // 4. Cập nhật thông tin thông thường của nhân viên
  static async updateEmployee(id, employeeData) {
    try {
      const pool = await poolPromise;
      const query = `
        UPDATE nguoidung 
        SET hoten = $1, email = $2, sdt = $3 
        WHERE mand = $4 AND mavaitro = 'Employee'
      `;
      const values = [
        employeeData.HoTen,
        employeeData.Email,
        employeeData.SDT,
        id,
      ];
      const result = await pool.query(query, values);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // 5. Thay đổi trạng thái Hoạt động / Khóa tài khoản
  static async toggleStatus(id, status) {
    try {
      const pool = await poolPromise;
      const query = `
        UPDATE nguoidung 
        SET trangthai = $1 
        WHERE mand = $2 AND mavaitro = 'Employee'
      `;
      const result = await pool.query(query, [status ? true : false, id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EmployeeModel;
