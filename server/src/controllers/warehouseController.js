const WarehouseModel = require("../models/warehouseModel");

class WarehouseController {
  // [GET] /api/warehouse/transactions
  // 🟢 CẬP NHẬT: API tiếp nhận tham số phân trang ?page=x
  static async getAllTransactions(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 10; // Giới hạn hiển thị đúng 10 giao dịch kho trên mỗi trang

      const paginationResult = await WarehouseModel.getAllTransactions(
        page,
        limit,
      );

      res.status(200).json({
        success: true,
        currentPage: page,
        limitPerPage: limit,
        totalRecords: paginationResult.totalRecords,
        totalPages: paginationResult.totalPages,
        data: paginationResult.transactions, // Mảng chứa 10 dòng giao dịch kho
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy dữ liệu kho!",
        error: error.message,
      });
    }
  }

  // [GET] /api/warehouse/transactions/:maSP (Giữ nguyên)
  static async getTransactionsByProduct(req, res) {
    try {
      const { maSP } = req.params;
      const data = await WarehouseModel.getTransactionsByProduct(maSP);
      res.status(200).json({
        success: true,
        message: `Lấy lịch sử kho của sản phẩm ${maSP} thành công!`,
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tìm kiếm lịch sử sản phẩm!",
        error: error.message,
      });
    }
  }

  // [POST] /api/warehouse/transaction (Giữ nguyên)
  static async createTransaction(req, res) {
    try {
      const { maGD, maSP, loaiGD, soLuong } = req.body;

      if (
        !maGD ||
        !maSP ||
        loaiGD === undefined ||
        soLuong === undefined ||
        soLuong === ""
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng điền đầy đủ thông tin: Mã giao dịch, Mã sản phẩm, Loại và Số lượng!",
        });
      }

      const parsedSoLuong = parseInt(soLuong, 10);
      const parsedLoaiGD = parseInt(loaiGD, 10);

      if (isNaN(parsedSoLuong) || parsedSoLuong <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng giao dịch kho bắt buộc phải lớn hơn 0!",
        });
      }

      if (parsedSoLuong > 10000) {
        return res.status(400).json({
          success: false,
          message:
            "Số lượng cho mỗi giao dịch không được phép vượt quá 10.000 đơn vị!",
        });
      }

      if (parsedLoaiGD !== 1 && parsedLoaiGD !== 2) {
        return res.status(400).json({
          success: false,
          message: "Loại giao dịch không hợp lệ (1: Nhập kho, 2: Xuất kho)!",
        });
      }

      const result = await WarehouseModel.createTransaction({
        maGD: maGD.trim(),
        maSP,
        loaiGD: parsedLoaiGD,
        soLuong: parsedSoLuong,
      });

      res.status(201).json({
        success: true,
        message:
          parsedLoaiGD === 1
            ? "Nhập kho sản phẩm thành công!"
            : "Xuất kho sản phẩm thành công!",
        data: result,
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          message:
            "Mã giao dịch này đã tồn tại trong hệ thống! Vui lòng nhập mã khác.",
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || "Thao tác kho hàng thất bại!",
      });
    }
  }
}

module.exports = WarehouseController;
