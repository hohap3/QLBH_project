const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/productCategoryController");

// 1. Lấy danh sách tất cả danh mục
// GET: http://localhost:3000/api/categories
router.get("/", categoryController.getCategories);

// 2. Lấy chi tiết một danh mục theo ID (Cần thiết để đổ dữ liệu vào Form Sửa)
// GET: http://localhost:3000/api/categories/SmartPhone
router.get("/:id", categoryController.getCategoryById);

// 3. Thêm mới danh mục
// POST: http://localhost:3000/api/categories/add
router.post("/add", categoryController.addCategory);

// 4. Cập nhật danh mục theo ID
// PUT: http://localhost:3000/api/categories/update/SmartPhone
router.put("/update/:id", categoryController.editCategory);

// 5. Xóa danh mục theo ID
// DELETE: http://localhost:3000/api/categories/delete/SmartPhone
router.delete("/delete/:id", categoryController.removeCategory);

module.exports = router;
