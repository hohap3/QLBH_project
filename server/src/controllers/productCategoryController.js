const categoryModel = require("../models/productCategoryModel");

const productCategoryController = {
  // API Lấy danh sách danh mục
  getCategories: async (req, res) => {
    try {
      const categories = await categoryModel.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi lấy danh sách danh mục", error: error.message });
    }
  },

  // API Lấy chi tiết 1 danh mục
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await categoryModel.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }
      res.status(200).json(category);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi lấy thông tin danh mục", error: error.message });
    }
  },

  // API Thêm danh mục
  addCategory: async (req, res) => {
    try {
      if (!req.body.MaDanhMuc || !req.body.TenDanhMuc) {
        return res
          .status(400)
          .json({ message: "Mã và Tên danh mục là bắt buộc" });
      }
      await categoryModel.createCategory(req.body);
      res.status(201).json({ message: "Thêm danh mục thành công" });
    } catch (error) {
      // SỬA LỖI: Cập nhật mã lỗi trùng Khóa chính (Unique/Primary Key violation) của Postgres là '23505'
      if (error.code === "23505") {
        return res.status(409).json({ message: "Mã danh mục này đã tồn tại" });
      }
      res
        .status(500)
        .json({ message: "Lỗi khi thêm danh mục", error: error.message });
    }
  },

  // API Cập nhật danh mục
  editCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const success = await categoryModel.updateCategory(id, req.body);
      if (!success) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy danh mục để cập nhật" });
      }
      res.status(200).json({ message: "Cập nhật danh mục thành công" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật danh mục", error: error.message });
    }
  },

  // API Xóa danh mục
  removeCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const success = await categoryModel.deleteCategory(id);
      if (!success) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy danh mục để xóa" });
      }
      res.status(200).json({ message: "Xóa danh mục thành công" });
    } catch (error) {
      // SỬA LỖI: Cập nhật mã lỗi ràng buộc Khóa ngoại (Foreign Key violation) của Postgres là '23503'
      if (error.code === "23503") {
        return res.status(400).json({
          message: "Không thể xóa vì danh mục này đã có sản phẩm thuộc về!",
        });
      }
      res
        .status(500)
        .json({ message: "Lỗi khi xóa danh mục", error: error.message });
    }
  },
};

module.exports = productCategoryController;
