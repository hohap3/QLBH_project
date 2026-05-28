const productModel = require("../models/productManagerModel");
const XLSX = require("xlsx");

const productManagerController = {
  // Lấy danh sách sản phẩm
  getProducts: async (req, res) => {
    try {
      const products = await productModel.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({
        message: "Lỗi khi lấy danh sách sản phẩm",
        error: error.message,
      });
    }
  },

  // Thêm vào trong đối tượng productManagerController
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

  // Thêm sản phẩm
  addProduct: async (req, res) => {
    try {
      // Chuẩn hóa dữ liệu trước khi đưa vào Model
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
        // Ưu tiên lấy filename từ Multer, nếu không có lấy từ body, cuối cùng là null
        HinhAnh: req.file ? req.file.filename : req.body.HinhAnh || null,
      };

      // Kiểm tra nghiệp vụ cơ bản
      if (productData.GiaBan < 0 || productData.SoLuongTon < 0) {
        return res
          .status(400)
          .json({ message: "Giá bán và số lượng không được âm" });
      }

      await productModel.createProduct(productData);
      res.status(201).json({ message: "Thêm sản phẩm thành công" });
    } catch (error) {
      console.error("Lỗi thêm SP:", error.message);
      // Trả về chi tiết lỗi để dễ debug
      res
        .status(500)
        .json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
    }
  },

  // Cập nhật sản phẩm
  // controllers/productManagerController.js

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
        // Logic hình ảnh: Nếu có file mới thì dùng file mới, không thì giữ tên cũ gửi từ body
        HinhAnh: req.file ? req.file.filename : req.body.HinhAnh,
      };

      await productModel.updateProduct(id, updateData);
      res.status(200).json({ message: "Cập nhật sản phẩm thành công" });
    } catch (error) {
      console.error("Lỗi cập nhật SP:", error.message);
      res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
  },

  // Xóa sản phẩm
  removeProduct: async (req, res) => {
    try {
      const { id } = req.params;
      await productModel.deleteProduct(id);
      res.status(200).json({ message: "Xóa sản phẩm thành công" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
    }
  },

  importExcel: async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ message: "Vui lòng đính kèm tệp Excel dữ liệu" });
      }

      // Đọc dữ liệu thô từ bộ nhớ đệm Buffer của Multer
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

      // Lấy tên của bảng tính đầu tiên (Sheet thứ nhất)
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Chuyển đổi toàn bộ hàng cột trong Excel thành dạng mảng JSON
      // Lưu ý: Các tên cột ở dòng đầu tiên của file Excel của bạn cần phải trùng khớp chính xác
      // với các key: MaSP, TenSP, GiaNhap, GiaBan, SoLuongTon, MoTa, DonViTinh, MaDanhMuc, MaNCC
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) {
        return res
          .status(400)
          .json({ message: "Tệp Excel không chứa dữ liệu hợp lệ" });
      }

      // Đẩy mảng dữ liệu xuống tầng Model để xử lý hàng loạt
      const countInserted =
        await productModel.bulkCreateOrUpdateProducts(rawData);

      res.status(200).json({
        message: `Đồng bộ dữ liệu thành công! Đã xử lý ${countInserted}/${rawData.length} sản phẩm vào cơ sở dữ liệu.`,
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
