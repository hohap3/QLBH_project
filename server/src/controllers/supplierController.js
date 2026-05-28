const Supplier = require("../models/supplierModel");

const supplierController = {
  // Lấy toàn bộ danh sách
  getAllSuppliers: async (req, res) => {
    try {
      const suppliers = await Supplier.getAll();
      res.status(200).json(suppliers);
    } catch (err) {
      res
        .status(500)
        .json({
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

  // Thêm mới
  createSupplier: async (req, res) => {
    try {
      await Supplier.create(req.body);
      res.status(201).json({ message: "Thêm nhà cung cấp thành công" });
    } catch (err) {
      // Mã lỗi 2627: Vi phạm UNIQUE hoặc PRIMARY KEY
      if (err.number === 2627 || err.number === 2601) {
        if (err.message.includes("PRIMARY"))
          return res
            .status(400)
            .json({ message: "Mã nhà cung cấp này đã tồn tại" });
        if (err.message.includes("UQ_SDT"))
          return res
            .status(400)
            .json({ message: "Số điện thoại này đã được đăng ký" });
        if (err.message.includes("UQ_Email"))
          return res.status(400).json({ message: "Email này đã được đăng ký" });
      }
      res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
    }
  },

  // Cập nhật
  updateSupplier: async (req, res) => {
    try {
      const result = await Supplier.update(req.params.id, req.body);
      if (result.rowsAffected[0] === 0) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy NCC để cập nhật" });
      }
      res.status(200).json({ message: "Cập nhật thông tin thành công" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật dữ liệu", error: err.message });
    }
  },

  // Xóa
  deleteSupplier: async (req, res) => {
    try {
      const result = await Supplier.delete(req.params.id);
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy NCC để xóa" });
      }
      res.status(200).json({ message: "Đã xóa nhà cung cấp thành công" });
    } catch (err) {
      // Lỗi này thường xảy ra nếu NCC đang có sản phẩm liên kết (khóa ngoại)
      res.status(500).json({
        message:
          "Không thể xóa. Nhà cung cấp này có thể đang liên kết với các sản phẩm khác.",
        error: err.message,
      });
    }
  },
};

module.exports = supplierController;
