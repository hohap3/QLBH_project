const Customer = require("../models/customerModel");

const customerController = {
  // Lấy danh sách khách hàng
  getCustomers: async (req, res) => {
    try {
      const data = await Customer.getAll();
      const formattedData = data.map((item) => ({
        ...item,
        DonGanNhat: item.DonGanNhat ? item.DonGanNhat : null,
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

  // ✅ NGHIỆP VỤ MỚI: Lấy chi tiết thông tin kèm lịch sử hóa đơn mua sắm
  getCustomerHistory: async (req, res) => {
    try {
      const customer = await Customer.getById(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Khách hàng không tồn tại" });
      }
      const orders = await Customer.getOrderHistory(req.params.id);

      // Trả về đồng thời cả đối tượng khách hàng và mảng đơn hàng liên quan
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
      if (err.number === 2627) {
        return res
          .status(400)
          .json({ message: "Mã khách hàng hoặc Email đã tồn tại" });
      }
      res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
    }
  },

  // Cập nhật khách hàng
  editCustomer: async (req, res) => {
    try {
      const result = await Customer.update(req.params.id, req.body);
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      }
      res.status(200).json({ message: "Cập nhật khách hàng thành công" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật dữ liệu", error: err.message });
    }
  },

  // ✅ THAY THẾ REMOVE: Điều chỉnh trạng thái Khóa / Mở khóa tài khoản khách hàng
  toggleCustomerStatus: async (req, res) => {
    const { trangThai } = req.body; // Client truyền lên { trangThai: true/false }
    try {
      const result = await Customer.toggleStatus(req.params.id, trangThai);
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản liên kết với khách hàng này",
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
