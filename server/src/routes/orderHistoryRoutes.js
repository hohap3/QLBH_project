const express = require("express");
const router = express.Router();
// Đã sửa chính xác tên file controller viết thường chữ cái đầu
const orderHistoryController = require("../controllers/OrderHistoryController");
const { verifyToken } = require("../middleware/auth");

router.get("/history", verifyToken, orderHistoryController.getOurOrderHistory);

module.exports = router;
