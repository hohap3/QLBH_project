const ProductModel = require("../models/productModel");

// 1. Lấy sản phẩm bán chạy (Có phân trang)
exports.getBestSellers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    const { products, totalItems } = await ProductModel.getBestSellers(
      page,
      limit,
    );

    res.status(200).json({
      products,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Lấy danh sách sản phẩm theo danh mục (Có phân trang)
exports.getProducts = async (req, res) => {
  try {
    const maDM = req.query.category;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;

    console.log(
      `Backend nhận lọc - Danh mục: ${maDM}, Trang: ${page}, Số lượng: ${limit}`,
    );

    const { products, totalItems } = await ProductModel.getProducts(
      maDM,
      page,
      limit,
    );

    res.status(200).json({
      products,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 3. Tìm kiếm sản phẩm
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const products = await ProductModel.searchProducts(q);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 4. Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.getProductById(id);

    if (!product) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm yêu cầu." });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 5. Lấy sản phẩm liên quan
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId } = req.query;

    if (!categoryId) {
      return res
        .status(400)
        .json({ message: "Thiếu mã danh mục (categoryId)" });
    }

    const products = await ProductModel.getRelatedProducts(categoryId, id);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
