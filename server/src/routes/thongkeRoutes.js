const express = require("express");
const router = express.Router();
const ThongKeController = require("../controllers/thongKeController");

// API: /api/thong-ke/san-pham-danh-muc
router.get("/san-pham-danh-muc", ThongKeController.getStatsCategory);
router.get("/overview", ThongKeController.getDashboardOverview);
router.get("/top-products", ThongKeController.getTopProducts);
router.get("/monthly-orders", ThongKeController.getMonthlyStats);

router.get("/monthly-revenue", ThongKeController.getMonthlyRevenue);

module.exports = router;
