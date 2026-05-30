// src/models/employeeModel.js
const { poolPromise } = require("../config/database");

class EmployeeModel {
  // 1. Lấy toàn bộ danh sách nhân viên
  static async getAllEmployees() {
    try {
      const pool = await poolPromise;
      const query = `
        SELECT mand, tendangnhap, hoten, email, sdt, ngaytao, trangthai, mavaitro 
        FROM nguoidung 
        WHERE mavaitro = 'Employee'
        ORDER BY ngaytao DESC
      `;
      const result = await pool.query(query);
      return result.rows; // 🟢 Postgres sử dụng .rows thay vì .recordset
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
      // Đảm bảo ép kiểu về Boolean chuẩn cho Postgres
      const result = await pool.query(query, [status ? true : false, id]);
      return result.rowCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = EmployeeModel;
