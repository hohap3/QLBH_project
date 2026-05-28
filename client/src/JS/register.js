import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import Swal from "sweetalert2";
import axios from "axios"; // Import axios

const checkLoggedIn = () => {
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));

  if (userData && userData.token) {
    // Nếu đã đăng nhập thành công, tự động chuyển hướng về trang chủ index.html
    window.location.href = "/src/pages/index.html";
  }
};

checkLoggedIn();

function handleRegisterPage() {
  const registerForm = document.querySelector("#registerForm");
  const toggleButtons = document.querySelectorAll(".toggle-password");
  const termsCheckbox = document.querySelector("#terms");
  const btnAcceptTerms = document.querySelector("#btnAcceptTerms");

  // 1. Xử lý ẩn/hiện mật khẩu
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");
      input.type = input.type === "password" ? "text" : "password";
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    });
  });

  if (btnAcceptTerms && termsCheckbox) {
    btnAcceptTerms.addEventListener("click", () => {
      termsCheckbox.checked = true;
    });
  }

  // 2. Xử lý gửi form với Axios
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Lấy dữ liệu từ form
    const fullname = document.querySelector("#fullname").value.trim();
    const username = document.querySelector("#username").value.trim();
    const email = document.querySelector("#email").value.trim();
    const phone = document.querySelector("#phone").value.trim();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;
    const terms = document.querySelector("#terms").checked;

    // --- VALIDATION TẠI CLIENT ---
    const showError = (message) => {
      Swal.fire({
        icon: "error",
        title: "Lỗi rồi...",
        text: message,
        confirmButtonColor: "#e91e63",
      });
    };

    if (
      !fullname ||
      !username ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      showError("Vui lòng điền đầy đủ tất cả các trường thông tin!");
      return;
    }

    if (username.length < 5) {
      showError("Tên đăng nhập phải có ít nhất 5 ký tự!");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      showError("Số điện thoại không hợp lệ!");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      showError("Mật khẩu không đạt yêu cầu!");
      return;
    }

    if (password !== confirmPassword) {
      showError("Xác nhận mật khẩu không khớp!");
      return;
    }

    if (!terms) {
      showError("Bạn phải đồng ý với điều khoản sử dụng!");
      return;
    }

    // --- GỬI DỮ LIỆU LÊN SERVER ---
    try {
      // Hiện trạng thái Loading
      Swal.fire({
        title: "Đang xử lý...",
        text: "Vui lòng chờ trong giây lát",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Gọi API bằng Axios
      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          fullname,
          username,
          email,
          phone,
          password,
        },
      );

      // Xử lý phản hồi thành công
      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công!",
        text: response.data.message || "Chào mừng bạn đến với HP STORE",
        confirmButtonColor: "#e91e63",
        timer: 2000,
      }).then(() => {
        window.location.href = "./login.html"; // Chuyển hướng sang trang Login
      });
    } catch (error) {
      // Xử lý lỗi từ Server (Ví dụ: Email đã tồn tại)
      const errorMessage =
        error.response?.data?.message || "Không thể kết nối đến máy chủ!";
      showError(errorMessage);
    }
  });
}

document.addEventListener("DOMContentLoaded", handleRegisterPage);
