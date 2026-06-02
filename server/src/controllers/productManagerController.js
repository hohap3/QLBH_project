const productModel = require("../models/productManagerModel");
const XLSX = require("xlsx");

const productManagerController = {
  // Lấy danh sách sản phẩm có Phân trang 10 và tìm kiếm
  getProducts: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";

      const offset = (page - 1) * limit;

      const { products, totalItems } = await productModel.getAllProducts(
        limit,
        offset,
        search,
      );
      const totalPages = Math.ceil(totalItems / limit);

      res.status(200).json({
        success: true,
        products: products,
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: page,
        limit: limit,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi lấy danh sách sản phẩm",
        error: error.message,
      });
    }
  },

  // Lấy thông tin chi tiết một sản phẩm
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await productModel.getProductById(id);

      if (product) {
        res.status(200).json(product);
      } else {
        res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }
    } catch (error) {
      res.status(500).json({
        message: "Lỗi khi lấy thông tin sản phẩm",
        error: error.message,
      });
    }
  },

  // Thêm mới sản phẩm thủ công
  addProduct: async (req, res) => {
    try {
      const productData = {
        MaSP: req.body.MaSP,
        TenSP: req.body.TenSP,
        GiaNhap: parseFloat(req.body.GiaNhap) || 0,
        GiaBan: parseFloat(req.body.GiaBan) || 0,
        SoLuongTon: parseInt(req.body.SoLuongTon) || 0,
        MoTa: req.body.MoTa || null,
        DonViTinh: req.body.DonViTinh || null,
        MaDanhMuc: req.body.MaDanhMuc,
        MaNCC: req.body.MaNCC,
        HinhAnh: req.file ? req.file.path : req.body.HinhAnh || null,
      };

      if (productData.GiaBan < 0 || productData.SoLuongTon < 0) {
        return res
          .status(400)
          .json({ message: "Giá bán và số lượng không được âm" });
      }

      await productModel.createProduct(productData);
      res.status(201).json({ message: "Thêm sản phẩm thành công" });
    } catch (error) {
      console.error("Lỗi thêm SP:", error.message);
      res
        .status(500)
        .json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
    }
  },

  // Cập nhật thông tin sản phẩm
  // Cập nhật thông tin sản phẩm (productManagerController.js)
  editProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const updateData = {
        TenSP: req.body.TenSP,
        GiaNhap: parseFloat(req.body.GiaNhap) || 0,
        GiaBan: parseFloat(req.body.GiaBan) || 0,
        SoLuongTon: parseInt(req.body.SoLuongTon) || 0,
        MoTa: req.body.MoTa || null,
        DonViTinh: req.body.DonViTinh || null,
        MaDanhMuc: req.body.MaDanhMuc,
        MaNCC: req.body.MaNCC,

        HinhAnh: req.file
          ? req.file.path
          : req.body.HinhAnhCu || req.body.HinhAnh || null,
      };

      await productModel.updateProduct(id, updateData);
      res.status(200).json({ message: "Cập nhật sản phẩm thành công" });
    } catch (error) {
      console.error("🔥 Lỗi chi tiết tại editProduct Controller:", error);

      // Trả thông tin debug chi tiết về giao diện Client/Postman thay vì chữ Internal Server Error chung chung
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi thực hiện cập nhật sản phẩm.",
        error: error.message || String(error),
        dbCode: error.code || null, // Mã lỗi PostgreSQL (Ví dụ: 22P02, 23505...)
        dbDetail: error.detail || null, // Chi tiết trường lỗi từ Database ném lên
      });
    }
  },

  // 🔥 Xóa sản phẩm (Có kiểm tra lỗi ràng buộc ngoại)
  removeProduct: async (req, res) => {
    try {
      const { id } = req.params;
      await productModel.deleteProduct(id);
      res.status(200).json({ message: "Xóa sản phẩm thành công" });
    } catch (error) {
      console.error("Lỗi xóa SP:", error.message);

      // Nếu là lỗi do dính ràng buộc dữ liệu từ Model hoặc từ DB ném về
      if (error.code === "23503" || error.message.includes("đơn hàng")) {
        return res.status(400).json({
          message:
            "Không thể xóa! Sản phẩm này đã phát sinh giao dịch và có trong dữ liệu đơn hàng.",
        });
      }

      res.status(500).json({
        message: "Lỗi hệ thống không thể xóa sản phẩm",
        error: error.message,
      });
    }
  },

  // Đọc Excel xử lý hàng loạt
  importExcel: async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Vui lòng đính kèm tệp Excel dữ liệu" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) {
        return res
          .status(400)
          .json({ message: "Tệp Excel không chứa dữ liệu hợp lệ" });
      }

      const countInserted =
        await productModel.bulkCreateOrUpdateProducts(rawData);

      res.status(200).json({
        message: `Đồng bộ dữ liệu thành công! Đã xử lý ${countInserted}/${rawData.length} sản phẩm.`,
      });
    } catch (error) {
      console.error("Lỗi Import Excel Server:", error.message);
      res.status(500).json({
        message: "Có lỗi xảy ra trong quá trình đọc và đồng bộ file Excel.",
        error: error.message,
      });
    }
  },
};

module.exports = productManagerController;
