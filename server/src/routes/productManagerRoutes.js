const express = require("express");
const router = express.Router();
const productController = require("../controllers/productManagerController");
// Đảm bảo đường dẫn file middleware chính xác theo cấu trúc folder của bạn
const { uploadProductImage } = require("../middleware/upload");
const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

// 1. Lấy danh sách sản phẩm
router.get("/", productController.getProducts);

router.get("/:id", productController.getProductById);

// 2. Thêm mới sản phẩm (Cần middleware để lưu ảnh khi tạo mới)
router.post(
  "/add",
  uploadProductImage.single("HinhAnh"),
  productController.addProduct,
);

// 3. Cập nhật sản phẩm (Cần middleware để xử lý ảnh khi sửa)
// 'HinhAnh' phải khớp với tên bạn append trong FormData ở Frontend
router.put(
  "/update/:id",
  uploadProductImage.single("HinhAnh"),
  productController.editProduct,
);

// 4. Xóa sản phẩm
router.delete("/delete/:id", productController.removeProduct);

router.post(
  "/import-excel",
  excelUpload.single("excelFile"),
  productController.importExcel,
);

module.exports = router;
