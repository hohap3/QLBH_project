const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

// Route danh sách chính (hỗ trợ ?category=...&page=...&limit=...)
router.get("/", productController.getProducts);

// Các route chức năng đặc thù
router.get("/best-sellers", productController.getBestSellers);
router.get("/search", productController.searchProducts);

// Các route thao tác theo ID sản phẩm
router.get("/:id", productController.getProductById);
router.get("/:id/related", productController.getRelatedProducts);

module.exports = router;
