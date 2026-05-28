const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

// Lấy danh sách tất cả nhân viên
router.get("/", (req, res) => employeeController.getAll(req, res));

// Lấy chi tiết một nhân viên
router.get("/:id", (req, res) => employeeController.getById(req, res));

// Tạo mới nhân viên
router.post("/", (req, res) => employeeController.create(req, res));

// Cập nhật thông tin nhân viên (PUT sửa đổi toàn bộ thông tin cơ bản)
router.put("/:id", (req, res) => employeeController.update(req, res));

// Thay đổi trạng thái khóa/mở tài khoản nhanh (PATCH tối ưu cho sửa đổi một phần dữ liệu)
router.patch("/:id/toggle-status", (req, res) =>
  employeeController.toggleStatus(req, res),
);

module.exports = router;
