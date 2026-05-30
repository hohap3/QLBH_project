// src/controllers/supplierController.js
const Supplier = require("../models/supplierModel");

const supplierController = {
  // Lấy toàn bộ danh sách
  getAllSuppliers: async (req, res) => {
    try {
      const suppliers = await Supplier.getAll();
      res.status(200).json(suppliers);
    } catch (err) {
      res.status(500).json({
        message: "Lỗi Server khi tải danh sách NCC",
        error: err.message,
      });
    }
  },

  // Lấy chi tiết theo ID
  getSupplierById: async (req, res) => {
    try {
      const supplier = await Supplier.getById(req.params.id);
      if (!supplier) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy nhà cung cấp này" });
      }
      res.status(200).json(supplier);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi truy vấn chi tiết", error: err.message });
    }
  },

  // Thêm mới nhà cung cấp
  createSupplier: async (req, res) => {
    try {
      await Supplier.create(req.body);
      res.status(201).json({ message: "Thêm nhà cung cấp thành công" });
    } catch (err) {
      // 🟢 FIX CHÍNH POSTGRES: Mã 23505 đại diện cho Duplicate / Vi phạm UNIQUE hoặc PRIMARY KEY
      if (err.code === "23505") {
        const errMsg = err.message.toLowerCase();
        if (errMsg.includes("pkey") || errMsg.includes("primary"))
          return res
            .status(400)
            .json({ message: "Mã nhà cung cấp này đã tồn tại" });
        if (errMsg.includes("sdt") || errMsg.includes("phone"))
          return res
            .status(400)
            .json({ message: "Số điện thoại này đã được đăng ký" });
        if (errMsg.includes("email"))
          return res.status(400).json({ message: "Email này đã được đăng ký" });
      }
      res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
    }
  },

  // Cập nhật thông tin
  updateSupplier: async (req, res) => {
    try {
      const result = await Supplier.update(req.params.id, req.body);

      // 🟢 FIX CHÍNH POSTGRES: Sử dụng result.rowCount thay vì rowsAffected[0]
      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy NCC để cập nhật" });
      }
      res.status(200).json({ message: "Cập nhật thông tin thành công" });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).json({
          message:
            "Số điện thoại hoặc Email này đã tồn tại ở nhà cung cấp khác!",
        });
      }
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật dữ liệu", error: err.message });
    }
  },

  // Xóa nhà cung cấp
  deleteSupplier: async (req, res) => {
    try {
      const result = await Supplier.delete(req.params.id);

      // 🟢 FIX CHÍNH POSTGRES: Sử dụng result.rowCount thay vì rowsAffected[0]
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Không tìm thấy NCC để xóa" });
      }
      res.status(200).json({ message: "Đã xóa nhà cung cấp thành công" });
    } catch (err) {
      // 🟢 FIX CHÍNH POSTGRES: Lỗi mã 23503 là vi phạm ràng buộc khoá ngoại (Foreign Key Violation)
      if (err.code === "23503") {
        return res.status(400).json({
          message:
            "Không thể xóa. Nhà cung cấp này hiện đang liên kết với dữ liệu sản phẩm trong kho.",
        });
      }
      res
        .status(500)
        .json({ message: "Lỗi khi xóa nhà cung cấp", error: err.message });
    }
  },
};

module.exports = supplierController;
