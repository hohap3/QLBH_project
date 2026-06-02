const express = require("express");
const router = express.Router();
const productController = require("../controllers/productManagerController");
const multer = require("multer");

// 🔥 Import cấu hình Cloudinary mới thay thế cho upload local cũ
const uploadCloud = require("../middleware/cloudinaryConfig");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// 🔥 Đổi thành uploadCloud
router.post(
  "/add",
  uploadCloud.single("HinhAnh"),
  productController.addProduct,
);
router.put(
  "/update/:id",
  uploadCloud.single("HinhAnh"),
  productController.editProduct,
);

router.delete("/delete/:id", productController.removeProduct);
router.post(
  "/import-excel",
  excelUpload.single("excelFile"),
  productController.importExcel,
);

module.exports = router;
