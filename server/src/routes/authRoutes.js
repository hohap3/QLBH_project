const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Sử dụng Destructuring để lấy chính xác verifyToken từ file middleware
const { verifyToken } = require("../middleware/auth");

// Tuyến đường đăng ký & đăng nhập
router.post("/register", authController.register);
router.post("/login", authController.login);

// Tuyến đường Thẩm định quyền hạn thời gian thực dựa vào Token
router.get("/verify-role", verifyToken, authController.verifyRole);

module.exports = router;
