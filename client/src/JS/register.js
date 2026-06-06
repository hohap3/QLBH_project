import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import Swal from "sweetalert2";
import axios from "axios";

const BASE_URL = "https://qlbh-project.onrender.com/api";

const checkLoggedIn = () => {
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));
  if (userData && userData.token) {
    window.location.href = "/index.html";
  }
};

checkLoggedIn();

function handleRegisterPage() {
  const registerForm = document.querySelector("#registerForm");
  const toggleButtons = document.querySelectorAll(".toggle-password");
  const termsCheckbox = document.querySelector("#terms");
  const btnAcceptTerms = document.querySelector("#btnAcceptTerms");

  // DOM các phần tử hiển thị lỗi và input tương ứng
  const usernameInput = document.querySelector("#username");
  const fullnameInput = document.querySelector("#fullname");
  const emailInput = document.querySelector("#email");
  const phoneInput = document.querySelector("#phone");
  const passwordInput = document.querySelector("#password");
  const confirmPasswordInput = document.querySelector("#confirmPassword");

  const usernameError = document.querySelector("#usernameError");
  const fullnameError = document.querySelector("#fullnameError");
  const emailError = document.querySelector("#emailError");
  const phoneError = document.querySelector("#phoneError");
  const passwordError = document.querySelector("#passwordError");
  const confirmPasswordError = document.querySelector("#confirmPasswordError");
  const termsError = document.querySelector("#termsError");

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
      // Xóa thông báo lỗi điều khoản khi đã check qua modal
      termsError.classList.add("d-none");
      termsCheckbox.classList.remove("is-invalid");
    });
  }

  if (!registerForm) return;

  // 🟢 Hàm hiển thị thông báo lỗi dưới từng Input
  const showInputError = (errorElement, inputElement, message) => {
    errorElement.innerText = message;
    errorElement.classList.remove("d-none");
    inputElement.classList.add("is-invalid");

    registerForm.classList.add("animate-shake");
    setTimeout(() => registerForm.classList.remove("animate-shake"), 500);
  };

  // 🟢 Hàm xóa sạch trạng thái lỗi cũ
  const clearErrors = () => {
    const errorElements = [
      usernameError,
      fullnameError,
      emailError,
      phoneError,
      passwordError,
      confirmPasswordError,
      termsError,
    ];
    const inputElements = [
      usernameInput,
      fullnameInput,
      emailInput,
      phoneInput,
      passwordInput,
      confirmPasswordInput,
      termsCheckbox,
    ];

    errorElements.forEach((el) => {
      if (el) {
        el.classList.add("d-none");
        el.innerText = "";
      }
    });
    inputElements.forEach((input) => {
      if (input) input.classList.remove("is-invalid");
    });
  };

  // Gắn sự kiện xóa lỗi ngay khi người dùng chỉnh sửa lại dữ liệu
  [
    usernameInput,
    fullnameInput,
    emailInput,
    phoneInput,
    passwordInput,
    confirmPasswordInput,
  ].forEach((input) => {
    input.addEventListener("input", clearErrors);
  });
  termsCheckbox.addEventListener("change", clearErrors);

  // 2. Xử lý gửi form với Axios
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(); // Xóa lỗi cũ trước khi kiểm tra

    // Lấy dữ liệu từ form
    const fullname = fullnameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const terms = termsCheckbox.checked;

    // --- VALIDATION TẠI CLIENT ---
    if (!username) {
      showInputError(
        usernameError,
        usernameInput,
        "Vui lòng nhập tên đăng nhập!",
      );
      usernameInput.focus();
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

    if (!fullname) {
      showInputError(fullnameError, fullnameInput, "Vui lòng điền họ và tên!");
      fullnameInput.focus();
      return;
    }

    const fullnameRegex =
      /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểิếệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ\s]+$/;
    if (!fullnameRegex.test(fullname)) {
      showInputError(
        fullnameError,
        fullnameInput,
        "Họ và tên chỉ được chứa chữ cái và khoảng trắng!",
      );
      fullnameInput.focus();
      return;
    }

    if (!email) {
      showInputError(emailError, emailInput, "Vui lòng nhập địa chỉ Email!");
      emailInput.focus();
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showInputError(
        emailError,
        emailInput,
        "Định dạng địa chỉ Email không hợp lệ (Ví dụ: link@hpstore.com)!",
      );
      emailInput.focus();
      return;
    }

    if (!phone) {
      showInputError(phoneError, phoneInput, "Vui lòng nhập số điện thoại!");
      phoneInput.focus();
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      showInputError(
        phoneError,
        phoneInput,
        "Số điện thoại không hợp lệ (phải gồm 10 chữ số)!",
      );
      phoneInput.focus();
      return;
    }

    if (!password) {
      showInputError(
        passwordError,
        passwordInput,
        "Vui lòng cấu hình mật khẩu an toàn!",
      );
      passwordInput.focus();
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      showInputError(
        passwordError,
        passwordInput,
        "Mật khẩu phải từ 6 ký tự, bao gồm chữ hoa, chữ thường và ký tự đặc biệt!",
      );
      passwordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      showInputError(
        confirmPasswordError,
        confirmPasswordInput,
        "Xác nhận mật khẩu không trùng khớp!",
      );
      confirmPasswordInput.focus();
      return;
    }

    if (!terms) {
      showInputError(
        termsError,
        termsCheckbox,
        "Bạn phải xác nhận đồng ý với điều khoản sử dụng!",
      );
      return;
    }

    // --- GỬI DỮ LIỆU LÊN SERVER ---
    try {
      Swal.fire({
        title: "Đang xử lý...",
        text: "Vui lòng chờ trong giây lát",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.post(`${BASE_URL}/auth/register`, {
        fullname,
        username,
        email,
        phone,
        password,
      });

      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công!",
        text: response.data.message || "Chào mừng bạn đến với HP STORE",
        confirmButtonColor: "#6138ff",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        window.location.href = "login.html";
      });
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      Swal.close();

      let errorMessage = "Không thể kết nối đến máy chủ!";

      if (error.response) {
        errorMessage = error.response.data.message || "Đăng ký thất bại";
        const lowerMsg = errorMessage.toLowerCase();

        // 🟢 Điều hướng text lỗi từ Server xuống đúng ô input bị trùng dữ liệu
        if (
          lowerMsg.includes("tên đăng nhập") ||
          lowerMsg.includes("username")
        ) {
          showInputError(usernameError, usernameInput, errorMessage);
        } else if (lowerMsg.includes("email")) {
          showInputError(emailError, emailInput, errorMessage);
        } else if (
          lowerMsg.includes("số điện thoại") ||
          lowerMsg.includes("phone")
        ) {
          showInputError(phoneError, phoneInput, errorMessage);
        } else {
          showInputError(usernameError, usernameInput, errorMessage);
        }
      } else {
        showInputError(usernameError, usernameInput, errorMessage);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", handleRegisterPage);
