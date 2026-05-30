const WarehouseModel = require("../models/warehouseModel");

class WarehouseController {
  // [GET] /api/warehouse/transactions
  static async getAllTransactions(req, res) {
    try {
      const data = await WarehouseModel.getAllTransactions();
      res.status(200).json({
        success: true,
        message: "Lấy lịch sử giao dịch kho thành công!",
        data: data, // Mảng các Object dạng chữ thường (masp, tensp, ngaygd...)
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

      // Đảm bảo dữ liệu truyền lên đầy đủ
      if (!maGD || !maSP || loaiGD === undefined || !soLuong) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng điền đầy đủ thông tin: Mã giao dịch, Mã sản phẩm, Loại và Số lượng!",
        });
      }

      const parsedSoLuong = parseInt(soLuong);
      const parsedLoaiGD = parseInt(loaiGD);

      if (isNaN(parsedSoLuong) || parsedSoLuong <= 0) {
        return res.status(400).json({
          success: false,
          message: "Số lượng giao dịch kho phải lớn hơn 0!",
        });
      }

      if (parsedLoaiGD !== 1 && parsedLoaiGD !== 2) {
        return res.status(400).json({
          success: false,
          message: "Loại giao dịch không hợp lệ (1: Nhập kho, 2: Xuất kho)!",
        });
      }

      const result = await WarehouseModel.createTransaction({
        maGD,
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
      res.status(400).json({
        success: false,
        message: error.message || "Thao tác kho hàng thất bại!",
      });
    }
  }
}

module.exports = WarehouseController;
