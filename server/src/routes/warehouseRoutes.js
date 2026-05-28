// routes/warehouseRoutes.js
const express = require("express");
const router = express.Router();
const WarehouseController = require("../controllers/warehouseController");

// 1. Tuyến đường lấy toàn bộ danh sách lịch sử biến động kho hàng
router.get("/transactions", WarehouseController.getAllTransactions);

// 2. Tuyến đường xem lịch sử biến động kho của một sản phẩm nhất định
router.get("/transactions/:maSP", WarehouseController.getTransactionsByProduct);

// 3. Tuyến đường thực hiện một phiên Nhập hoặc Xuất kho mới
router.post("/transaction", WarehouseController.createTransaction);

module.exports = router;
