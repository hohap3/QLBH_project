const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth");

// Chỉ Admin mới được xem danh sách tất cả người dùng
router.get("/all-users", verifyToken, isAdmin, async (req, res) => {
  // Logic lấy dữ liệu từ SQL Server...
  res.json({ message: "Dữ liệu mật cho Admin" });
});

module.exports = router;
