const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// 🟢 SỬA LỖI: Import đúng các hàm được export từ file auth.js
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// Đường dẫn gốc: /api/orders

// 1. Lấy danh sách đơn hàng (Chỉ cho phép Manager và Employee vào xem để quản lý)
router.get(
  "/",
  verifyToken,
  authorizeRoles("Manager", "Employee"),
  orderController.getOrders,
);

// 2. Xem chi tiết một đơn hàng (Cần đăng nhập - Manager, Employee hoặc chính Customer sở hữu đơn đó)
// Lưu ý: Logic kiểm tra đúng chủ sở hữu đơn (Customer) sẽ do `orderController.getOrderById` xử lý bên trong.
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("Manager", "Employee", "Client"),
  orderController.getOrderById,
);

// 3. Cập nhật trạng thái đơn hàng (Chỉ dành cho Manager hoặc Employee xử lý duyệt/giao hàng)
router.put(
  "/status/:id",
  verifyToken,
  authorizeRoles("Manager", "Employee"),
  orderController.updateOrderStatus,
);

// 4. Hủy đơn hàng giữa chừng (Áp dụng cho cả khách hàng tự hủy hoặc admin hủy hộ)
// Lưu ý: Logic check trạng thái "Chờ xác nhận" đã được cấu hình chặt chẽ trong Controller.
router.patch(
  "/cancel/:madonhang",
  verifyToken,
  authorizeRoles("Manager", "Employee", "Customer"),
  orderController.cancelOrder,
);

module.exports = router;
