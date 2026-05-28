const { sql, poolPromise } = require("../config/database");

class EmployeeModel {
  // 1. Lấy toàn bộ danh sách nhân viên
  static async getAllEmployees() {
    const pool = await poolPromise; // Sử dụng pool đã cấu hình sẵn
    const result = await pool.request().query(`
                SELECT MaND, TenDangNhap, HoTen, Email, SDT, NgayTao, TrangThai, MaVaiTro 
                FROM NGUOIDUNG 
                WHERE MaVaiTro = 'Employee'
                ORDER BY NgayTao DESC
            `);
    return result.recordset;
  }

  // 2. Lấy thông tin chi tiết một nhân viên theo Mã
  static async getEmployeeById(id) {
    const pool = await poolPromise;
    const result = await pool.request().input("MaND", sql.VarChar(20), id)
      .query(`
                SELECT MaND, TenDangNhap, HoTen, Email, SDT, NgayTao, TrangThai, MaVaiTro 
                FROM NGUOIDUNG 
                WHERE MaND = @MaND AND MaVaiTro = 'Employee'
            `);
    return result.recordset[0];
  }

  // 3. Thêm mới một nhân viên
  static async createEmployee(employeeData) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("MaND", sql.VarChar(20), employeeData.MaND)
      .input("TenDangNhap", sql.VarChar(50), employeeData.TenDangNhap)
      .input("MatKhauHash", sql.VarChar(255), employeeData.MatKhauHash)
      .input("HoTen", sql.NVarChar(100), employeeData.HoTen)
      .input("Email", sql.VarChar(100), employeeData.Email)
      .input("SDT", sql.VarChar(15), employeeData.SDT)
      .input("MaVaiTro", sql.VarChar(20), "Employee").query(`
                INSERT INTO NGUOIDUNG (MaND, TenDangNhap, MatKhauHash, HoTen, Email, SDT, MaVaiTro, TrangThai)
                VALUES (@MaND, @TenDangNhap, @MatKhauHash, @HoTen, @Email, @SDT, @MaVaiTro, 1)
            `);
    return { MaND: employeeData.MaND, TenDangNhap: employeeData.TenDangNhap };
  }

  // 4. Cập nhật thông tin thông thường của nhân viên
  static async updateEmployee(id, employeeData) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("MaND", sql.VarChar(20), id)
      .input("HoTen", sql.NVarChar(100), employeeData.HoTen)
      .input("Email", sql.VarChar(100), employeeData.Email)
      .input("SDT", sql.VarChar(15), employeeData.SDT).query(`
                UPDATE NGUOIDUNG 
                SET HoTen = @HoTen, Email = @Email, SDT = @SDT 
                WHERE MaND = @MaND AND MaVaiTro = 'Employee'
            `);
    return true;
  }

  // 5. Thay đổi trạng thái Hoạt động / Khóa tài khoản
  static async toggleStatus(id, status) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("MaND", sql.VarChar(20), id)
      .input("TrangThai", sql.Bit, status).query(`
                UPDATE NGUOIDUNG 
                SET TrangThai = @TrangThai 
                WHERE MaND = @MaND AND MaVaiTro = 'Employee'
            `);
    return true;
  }
}

module.exports = EmployeeModel;
