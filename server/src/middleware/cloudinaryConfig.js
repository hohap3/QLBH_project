const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// 1. Cấu hình tài khoản Cloudinary lấy từ file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Cấu hình nơi lưu trữ (Storage) trên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hpstore_products", // Tên thư mục sẽ tự động tạo trên Cloudinary của bạn
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Các định dạng file cho phép

    // Tự động tối ưu dung lượng & kích thước ngay khi upload để tiết kiệm bộ nhớ
    transformation: [
      { width: 600, height: 600, crop: "limit" }, // Giới hạn ảnh tối đa 600x600 (tránh ảnh quá nặng)
      { quality: "auto" }, // Tự động nén dung lượng mà không làm giảm chất lượng mắt thường thấy
    ],

    // Tạo tên file ngẫu nhiên trên cloud để không bị trùng lặp dữ liệu
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      // Loại bỏ đuôi file mở rộng cũ, chỉ lấy tên sạch + mã độc nhất
      const name = file.originalname.split(".")[0].replace(/\s+/g, "-");
      return `prod-${name}-${uniqueSuffix}`;
    },
  },
});

// 3. Khởi tạo middleware multer với cấu hình storage trên
const uploadCloud = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn dung lượng file tối đa là 5MB
  },
});

module.exports = uploadCloud;
