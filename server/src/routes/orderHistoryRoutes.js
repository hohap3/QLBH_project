const express = require("express");
const router = express.Router();

const orderHistoryController = require("../controllers/OrderHistoryController");
const { verifyToken } = require("../middleware/auth");

// Đường dẫn: GET https://qlbh-project.onrender.com/api/orders/history
router.get("/history", verifyToken, orderHistoryController.getOurOrderHistory);

module.exports = router;
