// src/routes/productManagerRoute.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productManagerController");
const { uploadProductImage } = require("../middleware/upload");
const multer = require("multer");
const excelUpload = multer({ storage: multer.memoryStorage() });

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post(
  "/add",
  uploadProductImage.single("HinhAnh"),
  productController.addProduct,
);
router.put(
  "/update/:id",
  uploadProductImage.single("HinhAnh"),
  productController.editProduct,
);
router.delete("/delete/:id", productController.removeProduct);
router.post(
  "/import-excel",
  excelUpload.single("excelFile"),
  productController.importExcel,
);

module.exports = router;
