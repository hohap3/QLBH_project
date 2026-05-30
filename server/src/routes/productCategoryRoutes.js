const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/productCategoryController");

// 1. Lấy danh sách tất cả danh mục
// GET: https://qlbh-project.onrender.com/api/categories
router.get("/", categoryController.getCategories);

// 2. Lấy chi tiết một danh mục theo ID (Dùng khi bấm nút "Sửa" để đổ dữ liệu lên form)
// GET: https://qlbh-project.onrender.com/api/categories/SmartPhone
router.get("/:id", categoryController.getCategoryById);

// 3. Thêm mới danh mục

// POST: https://qlbh-project.onrender.com/api/categories/add
router.post("/add", categoryController.addCategory);

// 4. Cập nhật danh mục theo ID

// PUT: https://qlbh-project.onrender.com/api/categories/update/SmartPhone
router.put("/update/:id", categoryController.editCategory);

// 5. Xóa danh mục theo ID

// DELETE: https://qlbh-project.onrender.com/api/categories/delete/SmartPhone
router.delete("/delete/:id", categoryController.removeCategory);

module.exports = router;
