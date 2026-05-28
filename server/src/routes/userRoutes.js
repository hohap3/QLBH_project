const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth"); // Middleware kiểm tra đăng nhập

// GET /api/user/profile
router.get("/profile", userController.getProfile);
router.put("/update", userController.updateProfile);
router.put("/change-password", userController.changePassword);

module.exports = router;
