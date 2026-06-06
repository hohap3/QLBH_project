import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Swal from "sweetalert2";
import axios from "axios";

const BASE_URL = "https://qlbh-project.onrender.com/api";

async function handleLoginPage() {
  const savedUser = localStorage.getItem("hpstore_user");
  const passwordInput = document.querySelector("#password");
  const loginForm = document.querySelector("#loginForm");
  const usernameInput = document.querySelector("#username");
  const togglePassword = document.querySelector("#togglePassword");

  // Thêm các phần tử chứa text lỗi vào DOM selector
  const usernameError = document.querySelector("#usernameError");
  const passwordError = document.querySelector("#passwordError");

  // ─── 1. KIỂM TRA ĐĂNG NHẬP SỚM (ANTI-TAMPERING) ───
  if (savedUser) {
    try {
      const userData = JSON.parse(savedUser);

      if (userData && userData.token) {
        Swal.fire({
          title: "Đang tự động đăng nhập...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const response = await axios.get(`${BASE_URL}/auth/verify-role`, {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        Swal.close();

        const realRole = response.data.role;
        userData.role = realRole;
        localStorage.setItem("hpstore_user", JSON.stringify(userData));

        if (realRole === "Manager" || realRole === "ADMIN") {
          window.location.href = "/src/pages/dashboard.html";
        } else if (realRole === "Employee" || realRole === "STAFF") {
          window.location.href = "/src/pages/employeeManager.html";
        } else {
          window.location.href = window.location.origin;
        }
        return;
      }
    } catch (e) {
      Swal.close();
      localStorage.removeItem("hpstore_user");
    }
  }

  // ─── 2. KHỞI TẠO ĐIỀU KHIỂN GIAO DIỆN FORM ───
  if (
    !togglePassword ||
    !passwordInput ||
    !loginForm ||
    !usernameInput ||
    !usernameError ||
    !passwordError
  ) {
    console.warn(
      "Một số phần tử không tìm thấy trong DOM. Kiểm tra lại ID trong file HTML.",
    );
    return;
  }

  const eyeIcon = togglePassword.querySelector("i");

  // 🟢 CẬP NHẬT: Hàm hiển thị lỗi dưới Input + Hiệu ứng rung Form
  const showInputError = (errorElement, inputElement, message) => {
    errorElement.innerText = message;
    errorElement.classList.remove("d-none");
    inputElement.classList.add("is-invalid"); // Thêm viền đỏ Bootstrap cho input

    loginForm.classList.add("animate-shake");
    setTimeout(() => loginForm.classList.remove("animate-shake"), 500);
  };

  // 🟢 CẬP NHẬT: Hàm xóa toàn bộ thông báo lỗi cũ
  const clearErrors = () => {
    usernameError.classList.add("d-none");
    usernameError.innerText = "";
    usernameInput.classList.remove("is-invalid");

    passwordError.classList.add("d-none");
    passwordError.innerText = "";
    passwordInput.classList.remove("is-invalid");
  };

  // Xóa lỗi cũ khi người dùng tập trung gõ lại dữ liệu
  usernameInput.addEventListener("input", clearErrors);
  passwordInput.addEventListener("input", clearErrors);

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
    clearErrors(); // Xóa lỗi cũ trước khi kiểm tra lượt mới

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Kiểm tra dữ liệu rỗng Client-side
    if (!username) {
      showInputError(
        usernameError,
        usernameInput,
        "Vui lòng nhập tên đăng nhập!",
      );
      usernameInput.focus();
      return;
    }

    if (!password) {
      showInputError(passwordError, passwordInput, "Vui lòng nhập mật khẩu!");
      passwordInput.focus();
      return;
    }

    if (username.length < 5) {
      showInputError(
        usernameError,
        usernameInput,
        "Tên đăng nhập phải có ít nhất 5 ký tự!",
      );
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

      const response = await axios.post(`${BASE_URL}/auth/login`, {
        identifier: username,
        password: password,
      });

      if (response.status === 200) {
        const { token, user } = response.data;

        const userData = {
          id: user.maND,
          username: user.username,
          name: user.fullname,
          role: user.role,
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
      passwordInput.value = ""; // Xóa mật khẩu vì lý do bảo mật

      let errorMessage = "Thông tin đăng nhập không chính xác!";

      if (error.response) {
        errorMessage =
          error.response.data.message || "Thông tin đăng nhập không chính xác";

        // Trường hợp tài khoản bị khóa thì hiển thị cảnh báo lớn bằng Swal
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

        // 🟢 CẬP NHẬT: Trích xuất hiển thị lỗi của server xuống dưới input
        if (errorMessage.toLowerCase().includes("mật khẩu")) {
          showInputError(passwordError, passwordInput, errorMessage);
        } else {
          showInputError(usernameError, usernameInput, errorMessage);
        }
      } else {
        // Lỗi kết nối mạng/máy chủ sập
        showInputError(
          usernameError,
          usernameInput,
          "Không thể kết nối đến máy chủ!",
        );
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", handleLoginPage);
