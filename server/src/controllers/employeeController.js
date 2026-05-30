// src/controllers/employeeController.js
const EmployeeModel = require("../models/employeeModel");
const bcrypt = require("bcrypt");

class EmployeeController {
  // [GET] /api/employees
  async getAll(req, res) {
    try {
      const employees = await EmployeeModel.getAllEmployees();
      return res.status(200).json({ success: true, data: employees });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi lấy danh sách nhân viên.",
        error: error.message,
      });
    }
  }

  // [GET] /api/employees/:id
  async getById(req, res) {
    try {
      const employee = await EmployeeModel.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message:
            "Không tìm thấy nhân viên hoặc tài khoản không thuộc quyền quản lý.",
        });
      }
      return res.status(200).json({ success: true, data: employee });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi lấy thông tin chi tiết nhân viên.",
        error: error.message,
      });
    }
  }

  // [POST] /api/employees
  async create(req, res) {
    try {
      const { TenDangNhap, MatKhau, HoTen, Email, SDT } = req.body;

      if (!TenDangNhap || !MatKhau) {
        return res.status(400).json({
          success: false,
          message: "Tên đăng nhập và mật khẩu không được để trống.",
        });
      }

      // Sinh mã nhân viên: NV + chuỗi thời gian rút gọn
      const MaND = "NV" + Date.now().toString().slice(-8);

      // Mã hóa mật khẩu bảo mật trước khi lưu
      const salt = await bcrypt.genSalt(10);
      const MatKhauHash = await bcrypt.hash(MatKhau, salt);

      const newEmployee = await EmployeeModel.createEmployee({
        MaND,
        TenDangNhap,
        MatKhauHash,
        HoTen,
        Email,
        SDT,
      });

      return res.status(201).json({
        success: true,
        message: "Thêm mới tài khoản nhân viên thành công!",
        data: newEmployee,
      });
    } catch (error) {
      // 🟢 FIX CHÍNH POSTGRES: Kiểm tra mã lỗi 23505 (Unique Violation) thay vì kiểm tra chuỗi text
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message:
            "Tên đăng nhập, Email hoặc Số điện thoại này đã tồn tại trên hệ thống.",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ khi tạo tài khoản nhân viên.",
        error: error.message,
      });
    }
  }

  // [PUT] /api/employees/:id
  async update(req, res) {
    try {
      const { HoTen, Email, SDT } = req.body;

      // Kiểm tra nhân viên tồn tại trước khi cập nhật
      const employee = await EmployeeModel.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản nhân viên cần chỉnh sửa.",
        });
      }

      await EmployeeModel.updateEmployee(req.params.id, { HoTen, Email, SDT });
      return res.status(200).json({
        success: true,
        message: "Cập nhật thông tin nhân viên thành công.",
      });
    } catch (error) {
      // 🟢 FIX CHÍNH POSTGRES: Ràng buộc trùng lặp khi cập nhật dữ liệu tài khoản khác
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message:
            "Email hoặc Số điện thoại cập nhật bị trùng với tài khoản khác.",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thông tin nhân viên.",
        error: error.message,
      });
    }
  }

  // [PATCH] /api/employees/:id/toggle-status
  async toggleStatus(req, res) {
    try {
      const { TrangThai } = req.body;

      if (TrangThai === undefined || typeof TrangThai !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "Trạng thái truyền lên không hợp lệ (phải là true hoặc false).",
        });
      }

      const employee = await EmployeeModel.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản nhân viên cần đổi trạng thái.",
        });
      }

      await EmployeeModel.toggleStatus(req.params.id, TrangThai);
      return res.status(200).json({
        success: true,
        message: TrangThai
          ? "Kích hoạt tài khoản nhân viên thành công."
          : "Khóa tài khoản nhân viên thành công.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Lỗi thực thi đổi trạng thái tài khoản.",
        error: error.message,
      });
    }
  }
}

module.exports = new EmployeeController();
