import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Swal from "sweetalert2";
import axios from "axios";

async function handleLoginPage() {
  const savedUser = localStorage.getItem("hpstore_user");
  const passwordInput = document.querySelector("#password");
  const loginForm = document.querySelector("#loginForm");
  const usernameInput = document.querySelector("#username");
  const togglePassword = document.querySelector("#togglePassword");

  // ─── 1. KIỂM TRA ĐĂNG NHẬP SỚM (ANTI-TAMPERING) ───
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);

      if (userData && userData.token) {
        // Hiển thị màn hình chờ tải thông tin phân quyền
        Swal.fire({
          title: "Đang tự động đăng nhập...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Gửi token lên Backend kiểm tra xem có bị sửa đổi hay tài khoản bị khóa không
        const response = await axios.get(
          "http://localhost:3000/api/auth/verify-role",
          {
            headers: { Authorization: `Bearer ${userData.token}` },
          },
        );

        Swal.close();
        const realRole = response.data.role;

        // Cập nhật lại role chuẩn từ database vào localStorage đề phòng trước đó bị sửa đổi bậy
        userData.role = realRole;
        localStorage.setItem("hpstore_user", JSON.stringify(userData));

        // Tiến hành điều hướng dựa trên role thực tế từ Database trả về
        if (realRole === "Manager" || realRole === "ADMIN") {
          window.location.href = "/src/pages/dashboard.html";
        } else if (realRole === "Employee" || realRole === "STAFF") {
          window.location.href = "/src/pages/employeeManager.html";
        } else {
          window.location.href = window.location.origin;
        }
        return; // Ngắt luồng, không render form đăng nhập nữa
      }
    } catch (e) {
      Swal.close();
      // Nếu token hết hạn hoặc chuỗi JSON lỗi -> Xóa sạch để người dùng đăng nhập lại
      localStorage.removeItem("hpstore_user");
    }
  }

  // ─── 2. KHỞI TẠO ĐIỀU KHIỂN GIAO DIỆN FORM ───
  if (!togglePassword || !passwordInput || !loginForm || !usernameInput) {
    console.warn(
      "Một số phần tử không tìm thấy trong DOM. Kiểm tra lại ID trong file HTML.",
    );
    return;
  }

  const eyeIcon = togglePassword.querySelector("i");

  const showError = (message) => {
    loginForm.classList.add("position-relative", "animate-shake");
    setTimeout(() => loginForm.classList.remove("animate-shake"), 500);

    Swal.fire({
      icon: "error",
      title: "Thất bại",
      text: message,
      confirmButtonColor: "#6138ff",
    });
  };

  // Hiện/ẩn mật khẩu
  togglePassword.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    eyeIcon.classList.toggle("fa-eye");
    eyeIcon.classList.toggle("fa-eye-slash");
  });

  // ─── 3. XỬ LÝ SỰ KIỆN XÁC THỰC ĐĂNG NHẬP ───
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
      showError("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
      return;
    }

    if (username.length < 5) {
      showError("Tên đăng nhập phải có ít nhất 5 ký tự!");
      usernameInput.focus();
      return;
    }

    try {
      Swal.fire({
        title: "Đang xác thực...",
        text: "Vui lòng chờ trong giây lát",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          identifier: username,
          password: password,
        },
      );

      if (response.status === 200) {
        const { token, user } = response.data;

        // Đồng bộ dữ liệu map trơn tru theo Database mới cập nhật
        const userData = {
          id: user.maND || user.MaND,
          username: user.username || user.TenDangNhap,
          name: user.fullname || user.HoTen,
          role: user.role || user.MaVaiTro,
          token: token,
          loginAt: new Date().toISOString(),
        };

        localStorage.setItem("hpstore_user", JSON.stringify(userData));

        Swal.fire({
          icon: "success",
          title: "Đăng nhập thành công!",
          text: `Chào mừng ${userData.name || "bạn"} đã quay lại HP STORE!`,
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          // Điều hướng thông minh chuẩn quyền hạn
          const userRole = userData.role;
          if (userRole === "Manager" || userRole === "ADMIN") {
            window.location.href = "/src/pages/dashboard.html";
          } else if (userRole === "Employee" || userRole === "STAFF") {
            window.location.href = "/src/pages/employeeManager.html";
          } else {
            window.location.href = window.location.origin;
          }
        });
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      Swal.close();
      passwordInput.value = ""; // Xóa password cũ bảo mật

      let errorMessage = "Không thể kết nối đến máy chủ!";

      if (error.response) {
        errorMessage =
          error.response.data.message || "Thông tin đăng nhập không chính xác";

        if (error.response.status === 403) {
          Swal.fire({
            icon: "warning",
            title: "Tài khoản bị khóa!",
            text: errorMessage,
            confirmButtonColor: "#dc3545",
            allowOutsideClick: false,
          });
          return;
        }
      }
      showError(errorMessage);
    }
  });
}

document.addEventListener("DOMContentLoaded", handleLoginPage);
