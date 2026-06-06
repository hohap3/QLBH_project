import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";

document.addEventListener("DOMContentLoaded", () => {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const toggleNewPasswordBtn = document.getElementById("toggleNewPassword");
  const newPasswordInput = document.getElementById("newPassword");

  // DOM các phần tử phục vụ hiển thị lỗi inline
  const emailInput = document.getElementById("email");
  const otpInput = document.getElementById("otp");

  const emailError = document.getElementById("emailError");
  const otpError = document.getElementById("otpError");
  const newPasswordError = document.getElementById("newPasswordError");

  let savedEmail = ""; // Biến toàn cục tạm thời để lưu email giữa 2 bước

  // 🟢 Hàm xử lý hiển thị thông báo lỗi dưới ô dữ liệu
  const showInputError = (formElement, errorElement, inputElement, message) => {
    errorElement.innerText = message;
    errorElement.classList.remove("d-none");
    inputElement.classList.add("is-invalid");

    formElement.classList.add("animate-shake");
    setTimeout(() => formElement.classList.remove("animate-shake"), 500);
  };

  // 🟢 Hàm dọn dẹp sạch sẽ các vết lỗi cũ
  const clearErrors = () => {
    [emailError, otpError, newPasswordError].forEach((el) => {
      if (el) {
        el.classList.add("d-none");
        el.innerText = "";
      }
    });
    [emailInput, otpInput, newPasswordInput].forEach((input) => {
      if (input) input.classList.remove("is-invalid");
    });
  };

  // Gắn sự kiện dọn lỗi khi người dùng bắt đầu nhập lại text
  if (emailInput) emailInput.addEventListener("input", clearErrors);
  if (otpInput) otpInput.addEventListener("input", clearErrors);
  if (newPasswordInput) newPasswordInput.addEventListener("input", clearErrors);

  // =================================================================================
  // ⚡ XỬ LÝ BƯỚC 1: GỬI EMAIL ĐỂ NHẬN MÃ OTP
  // =================================================================================
  if (forgotPasswordForm) {
    forgotPasswordForm.onsubmit = async (e) => {
      e.preventDefault();
      clearErrors();

      const email = emailInput.value.trim();

      // Kiểm tra rỗng Client-side
      if (!email) {
        showInputError(
          forgotPasswordForm,
          emailError,
          emailInput,
          "Vui lòng nhập địa chỉ Email đăng ký!",
        );
        emailInput.focus();
        return;
      }

      // Kiểm tra cấu trúc định dạng Email RFC 5322 chuẩn
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        showInputError(
          forgotPasswordForm,
          emailError,
          emailInput,
          "Cấu trúc Email không hợp lệ (Ví dụ: abc@gmail.com)!",
        );
        emailInput.focus();
        return;
      }

      // Đổi trạng thái nút bấm để báo hiệu đang xử lý
      const btnSubmitEmail = document.getElementById("btnSubmitEmail");
      const originalBtnHtml = btnSubmitEmail.innerHTML;
      btnSubmitEmail.disabled = true;
      btnSubmitEmail.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang gửi mã...';

      try {
        const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
          email,
        });

        await Swal.fire({
          icon: "success",
          title: "Đã gửi mã OTP!",
          text:
            response.data.message ||
            "Mã xác thực đã được gửi vào Email của bạn. Vui lòng kiểm tra hộp thư!",
          confirmButtonColor: "#6138ff",
        });

        savedEmail = email;

        // Chuyển form mượt mà bước tiếp theo
        forgotPasswordForm.classList.add("d-none");
        resetPasswordForm.classList.remove("d-none");
      } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Email không tồn tại hoặc lỗi hệ thống!";

        // Đẩy thông báo lỗi hệ thống/hoặc lỗi không tồn tại xuống dưới input email
        showInputError(forgotPasswordForm, emailError, emailInput, errorMsg);
      } finally {
        btnSubmitEmail.disabled = false;
        btnSubmitEmail.innerHTML = originalBtnHtml;
      }
    };
  }

  // =================================================================================
  // ⚡ XỬ LÝ BƯỚC 2: XÁC THỰC OTP & CẬP NHẬT MẬT KHẨU MỚI
  // =================================================================================
  if (resetPasswordForm) {
    resetPasswordForm.onsubmit = async (e) => {
      e.preventDefault();
      clearErrors();

      const otp = otpInput.value.trim();
      const newPassword = newPasswordInput.value;

      // Validate dữ liệu OTP
      if (!otp) {
        showInputError(
          resetPasswordForm,
          otpError,
          otpInput,
          "Vui lòng cung cấp mã xác thực OTP!",
        );
        otpInput.focus();
        return;
      }

      if (otp.length !== 6 || isNaN(otp)) {
        showInputError(
          resetPasswordForm,
          otpError,
          otpInput,
          "Mã xác thực OTP phải chứa đủ 6 ký tự số!",
        );
        otpInput.focus();
        return;
      }

      // Validate dữ liệu mật khẩu mới
      if (!newPassword) {
        showInputError(
          resetPasswordForm,
          newPasswordError,
          newPasswordInput,
          "Vui lòng nhập mật khẩu mới!",
        );
        newPasswordInput.focus();
        return;
      }

      // Kiểm tra độ mạnh mật khẩu bảo mật nghiêm ngặt (Regex)
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        showInputError(
          resetPasswordForm,
          newPasswordError,
          newPasswordInput,
          "Mật khẩu phải từ 6 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 ký tự đặc biệt (!@#$...).",
        );
        newPasswordInput.focus();
        return;
      }

      const btnResetPass = document.getElementById("btnResetPass");
      const originalResetHtml = btnResetPass.innerHTML;
      btnResetPass.disabled = true;
      btnResetPass.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';

      try {
        const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
          email: savedEmail,
          otp: otp,
          newPassword: newPassword,
        });

        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text:
            response.data.message ||
            "Đổi mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.",
          confirmButtonColor: "#6138ff",
        });

        window.location.href = "/src/pages/login.html";
      } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Mã OTP không đúng hoặc đã hết hiệu lực!";

        // Phân tích nội dung chuỗi lỗi để đẩy xuống input OTP hay Input Mật khẩu tương ứng
        if (
          errorMsg.toLowerCase().includes("mật khẩu") ||
          errorMsg.toLowerCase().includes("password")
        ) {
          showInputError(
            resetPasswordForm,
            newPasswordError,
            newPasswordInput,
            errorMsg,
          );
        } else {
          showInputError(resetPasswordForm, otpError, otpInput, errorMsg);
        }
      } finally {
        btnResetPass.disabled = false;
        btnResetPass.innerHTML = originalResetHtml;
      }
    };
  }

  // Xử lý bật tắt ẩn hiện password
  if (toggleNewPasswordBtn && newPasswordInput) {
    toggleNewPasswordBtn.onclick = () => {
      const isPassword = newPasswordInput.type === "password";
      newPasswordInput.type = isPassword ? "text" : "password";

      const icon = toggleNewPasswordBtn.querySelector("i");
      if (icon) {
        if (isPassword) {
          icon.classList.remove("fa-regular", "fa-eye");
          icon.classList.add("fa-solid", "fa-eye-slash");
        } else {
          icon.classList.remove("fa-solid", "fa-eye-slash");
          icon.classList.add("fa-regular", "fa-eye");
        }
      }
    };
  }
});
