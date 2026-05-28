const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "src/public/uploads/products";
    // Kiểm tra và tạo thư mục nếu chưa có để tránh lỗi
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Lưu tên file theo dạng: product-1714830000-123456.jpg
    cb(null, "product-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Chuyển sang cú pháp CommonJS
const uploadProductImage = multer({ storage: storage });

module.exports = {
  uploadProductImage,
};
