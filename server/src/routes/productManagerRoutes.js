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
  (req, res, next) => {
    // Thực thi middleware uploadCloud theo cách thủ công để chủ động bắt lỗi luồng
    uploadCloud.single("HinhAnh")(req, res, function (err) {
      if (err) {
        console.error(
          "⚠️ Lỗi phát sinh tại Middleware Cloudinary Route:",
          err.message,
        );

        // Nếu lỗi do người dùng truyền sai kiểu file hoặc lỗi logic multer,
        // ta chặn lại trả lỗi rõ ràng thay vì để crash 500 sập toàn server Render
        return res.status(400).json({
          success: false,
          message: "Lỗi xử lý file hình ảnh tải lên!",
          error: err.message,
        });
      }
      // Nếu không có lỗi (kể cả khi không có file ảnh nào được chọn), tiếp tục đi vào Controller
      next();
    });
  },
  productController.editProduct,
);

router.delete("/delete/:id", productController.removeProduct);
router.post(
  "/import-excel",
  excelUpload.single("excelFile"),
  productController.importExcel,
);

module.exports = router;
