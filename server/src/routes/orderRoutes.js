const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// Đường dẫn gốc: /api/orders

// Lấy danh sách đơn hàng (hiển thị bảng)
router.get("/", orderController.getOrders);

// Xem chi tiết một đơn hàng cụ thể
router.get("/:id", orderController.getOrderById);

// Cập nhật trạng thái đơn hàng
router.put("/status/:id", orderController.updateOrderStatus);

module.exports = router;
