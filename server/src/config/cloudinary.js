const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cấu hình tài khoản (Lấy các biến này trên dashboard Cloudinary sau khi đăng ký)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hpstore_products", // Tên thư mục chứa ảnh trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }], // Tự động nén/giới hạn kích thước ảnh
  },
});

const uploadCloud = multer({ storage });
module.exports = uploadCloud;
