// controllers/warehouseController.js
const WarehouseModel = require("../models/warehouseModel");

class WarehouseController {
  // [GET] /api/warehouse/transactions
  static async getAllTransactions(req, res) {
    try {
      const data = await WarehouseModel.getAllTransactions();
      res.status(200).json({
        success: true,
        message: "Lấy lịch sử giao dịch kho thành công!",
        data: data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy dữ liệu kho!",
        error: error.message,
      });
    }
  }

  // [GET] /api/warehouse/transactions/:maSP
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

  // [POST] /api/warehouse/transaction
  static async createTransaction(req, res) {
    try {
      const { maGD, maSP, loaiGD, soLuong } = req.body;

      // Kiểm tra tính đầy đủ của dữ liệu gửi lên
      if (!maGD || !maSP || !loaiGD || !soLuong) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng điền đầy đủ thông tin: Mã giao dịch, Mã sản phẩm, Loại và Số lượng!",
        });
      }

      if (parseInt(soLuong) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng giao dịch kho phải lớn hơn 0!",
        });
      }

      const result = await WarehouseModel.createTransaction({
        maGD,
        maSP,
        loaiGD: parseInt(loaiGD),
        soLuong: parseInt(soLuong),
      });

      res.status(201).json({
        success: true,
        message:
          loaiGD === 1
            ? "Nhập kho sản phẩm thành công!"
            : "Xuất kho sản phẩm thành công!",
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Thao tác kho hàng thất bại!",
        error: error.message,
      });
    }
  }
}

module.exports = WarehouseController;
