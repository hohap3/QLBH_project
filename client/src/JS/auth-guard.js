// src/JS/auth-guard.js
import Swal from "sweetalert2";
import axios from "axios";

// Ẩn nội dung body ngay lập tức để tránh tình trạng giao diện bị nhấp nháy (FOUC) trước khi check quyền
document.body.style.display = "none";

/**
 * Hàm kiểm tra và phân quyền truy cập hệ thống (Thời gian thực)
 * @param {Array} allowedRoles Mảng các mã vai trò được phép truy cập (Ví dụ: ['Manager', 'Employee'])
 */
export async function checkAuth(allowedRoles) {
  const savedUser = localStorage.getItem("hpstore_user");

  // 1. Kiểm tra sự tồn tại của phiên đăng nhập trong localStorage
  if (!savedUser) {
    return redirectToLogin("Bạn cần đăng nhập để vào hệ thống quản lý!");
  }

  try {
    const user = JSON.parse(savedUser);

    if (!user || !user.token) {
      return redirectToLogin("Phiên đăng nhập không hợp lệ!");
    }

    // ─── ĐỒNG BỘ URL: Chuyển sang domain Render thực tế giống các module khác ───
    const response = await axios.get(
      "https://qlbh-project.onrender.com/api/auth/verify-role",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      },
    );

    // Lấy vai trò thực tế chuẩn xác được Backend giải mã từ Token trong SQL Server/PostgreSQL
    const realRole = response.data.role;

    // Cập nhật lại thông tin chuẩn vào localStorage đề phòng người dùng cố tình chỉnh sửa bậy trước đó
    user.role = realRole;
    user.fullname = response.data.fullname;
    localStorage.setItem("hpstore_user", JSON.stringify(user));

    // 2. Kiểm tra quyền hạn thời gian thực
    if (!allowedRoles.includes(realRole)) {
      await Swal.fire({
        icon: "error",
        title: "Không đủ quyền hạn",
        text: "Tài khoản của bạn không được phép truy cập vào trang này!",
        confirmButtonColor: "#6138ff",
        allowOutsideClick: false,
      });

      // Điều hướng thông minh dựa trên VAI TRÒ THỰC TẾ
      if (realRole === "Employee" || realRole === "STAFF") {
        window.location.href = "/src/pages/employeeManager.html";
      } else if (realRole === "Manager" || realRole === "ADMIN") {
        window.location.href = "/src/pages/dashboard.html";
      } else {
        // Khách hàng hoặc tài khoản vãng lai -> Đẩy thẳng về trang chủ cửa hàng
        window.location.href = "/";
      }
      return;
    }

    // Nếu Token hợp lệ + Quyền hạn chính xác -> Cho phép hiển thị giao diện toàn trang
    document.body.style.display = "block";
  } catch (error) {
    console.error("Auth Guard Error:", error);

    let message = "Phiên làm việc đã hết hạn hoặc không hợp lệ!";

    // Nếu tài khoản bị khóa đột xuất hoặc token hết hạn, Backend trả về 403 hoặc 401
    if (
      error.response &&
      (error.response.status === 403 || error.response.status === 401)
    ) {
      message =
        error.response.data.message ||
        "Tài khoản của bạn hiện đang bị khóa hoặc hết hạn phiên làm việc!";
    }

    // Xóa dữ liệu lỗi/hết hạn trong localStorage (Lưu ý: Chỉ xóa phiên đăng nhập user, KHÔNG xóa giỏ hàng)
    localStorage.removeItem("hpstore_user");
    return redirectToLogin(message);
  }
}

/**
 * Hàm phụ hỗ trợ hiển thị thông báo và đá người dùng về trang Login
 */
async function redirectToLogin(message) {
  await Swal.fire({
    icon: "warning",
    title: "Truy cập bị từ chối",
    text: message,
    confirmButtonColor: "#6138ff",
    allowOutsideClick: false,
  });
  window.location.href = "/src/pages/login.html";
}
