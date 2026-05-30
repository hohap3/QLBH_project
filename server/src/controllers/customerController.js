// src/controllers/customerController.js
const Customer = require("../models/customerModel");

const customerController = {
  // Lấy danh sách khách hàng
  getCustomers: async (req, res) => {
    try {
      const data = await Customer.getAll();
      const formattedData = data.map((item) => ({
        ...item,
        // Chuyển đổi linh hoạt tên thuộc tính viết thường từ Postgres sang giao diện Front-end mong muốn nếu cần
        DonGanNhat: item.dongannhat ? item.dongannhat : null,
      }));
      res.status(200).json(formattedData);
    } catch (err) {
      res.status(500).json({
        message: "Lỗi khi tải danh sách khách hàng",
        error: err.message,
      });
    }
  },

  // Lấy chi tiết 1 khách hàng
  getCustomerById: async (req, res) => {
    try {
      const customer = await Customer.getById(req.params.id);
      if (!customer)
        return res.status(404).json({ message: "Khách hàng không tồn tại" });
      res.status(200).json(customer);
    } catch (err) {
      res.status(500).json({
        message: "Lỗi truy vấn chi tiết khách hàng",
        error: err.message,
      });
    }
  },

  // Lấy chi tiết thông tin kèm lịch sử hóa đơn mua sắm
  getCustomerHistory: async (req, res) => {
    try {
      const customer = await Customer.getById(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Khách hàng không tồn tại" });
      }
      const orders = await Customer.getOrderHistory(req.params.id);
      res.status(200).json({ customer, orders });
    } catch (err) {
      res.status(500).json({
        message: "Lỗi khi tải lịch sử mua hàng",
        error: err.message,
      });
    }
  },

  // Thêm khách hàng
  addCustomer: async (req, res) => {
    const { MaKH, HoTen, SDT } = req.body;
    if (!MaKH || !HoTen || !SDT) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ Mã, Họ tên và SĐT" });
    }
    try {
      await Customer.create(req.body);
      res.status(201).json({ message: "Thêm khách hàng thành công" });
    } catch (err) {
      // 🟢 FIX CHÍNH POSTGRES: Kiểm tra mã lỗi vi phạm UNIQUE hoặc PRIMARY KEY là '23505'
      if (err.code === "23505") {
        return res.status(400).json({
          message:
            "Mã khách hàng, Số điện thoại hoặc Email đã tồn tại trên hệ thống",
        });
      }
      res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
    }
  },

  // Cập nhật khách hàng
  editCustomer: async (req, res) => {
    try {
      const result = await Customer.update(req.params.id, req.body);

      // 🟢 FIX CHÍNH POSTGRES: Dùng result.rowCount để kiểm tra số hàng ảnh hưởng thay vì rowsAffected[0]
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      }
      res.status(200).json({ message: "Cập nhật khách hàng thành công" });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).json({
          message: "Số điện thoại hoặc Email bị trùng với khách hàng khác",
        });
      }
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật dữ liệu", error: err.message });
    }
  },

  // Điều chỉnh trạng thái Khóa / Mở khóa tài khoản khách hàng
  toggleCustomerStatus: async (req, res) => {
    const { trangThai } = req.body;
    try {
      const result = await Customer.toggleStatus(req.params.id, trangThai);

      // 🟢 FIX CHÍNH POSTGRES: Dùng result.rowCount
      if (result.rowCount === 0) {
        return res.status(404).json({
          message:
            "Không tìm thấy tài khoản liên kết hoặc khách hàng không tồn tại mã người dùng này",
        });
      }
      const msg = trangThai
        ? "Mở khóa tài khoản thành công"
        : "Đã khóa tài khoản khách hàng";
      res.status(200).json({ message: msg });
    } catch (err) {
      res.status(500).json({
        message: "Lỗi hệ thống khi thay đổi trạng thái tài khoản",
        error: err.message,
      });
    }
  },
};

module.exports = customerController;
