import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";

document.addEventListener("DOMContentLoaded", () => {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const toggleNewPasswordBtn = document.getElementById("toggleNewPassword");
  const newPasswordInput = document.getElementById("newPassword");

  let savedEmail = ""; // Biến toàn cục tạm thời để lưu email giữa 2 bước

  // =================================================================================
  // ⚡ XỬ LÝ BƯỚC 1: GỬI EMAIL ĐỂ NHẬN MÃ OTP
  // =================================================================================
  if (forgotPasswordForm) {
    forgotPasswordForm.onsubmit = async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const email = emailInput.value.trim();

      // Kiểm tra định dạng Email RFC 5322 chuẩn tương tự trang hồ sơ
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        Swal.fire(
          "Lỗi nhập liệu",
          "Cấu trúc Email không hợp lệ (Ví dụ: abc@gmail.com)!",
          "warning",
        );
        return;
      }

      // Đổi trạng thái nút bấm để báo hiệu đang xử lý
      const btnSubmitEmail = document.getElementById("btnSubmitEmail");
      const originalBtnHtml = btnSubmitEmail.innerHTML;
      btnSubmitEmail.disabled = true;
      btnSubmitEmail.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang gửi mã...';

      try {
        // Gửi request lên Backend (Khớp với Route: router.post("/forgot-password"))
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

        // Lưu email lại để dùng tiếp cho bước 2
        savedEmail = email;

        // Hiệu ứng mượt mà: Ẩn form nhập email, hiển thị form nhập OTP + Pass mới
        forgotPasswordForm.classList.add("d-none");
        resetPasswordForm.classList.remove("d-none");
      } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Email không tồn tại hoặc lỗi hệ thống!";
        Swal.fire("Thất bại", errorMsg, "error");
      } finally {
        // Khôi phục nút bấm ban đầu
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

      const otp = document.getElementById("otp").value.trim();
      const newPassword = newPasswordInput.value;

      // Validate dữ liệu đầu vào cơ bản trước khi gửi lên Server
      if (otp.length !== 6 || isNaN(otp)) {
        Swal.fire(
          "Lỗi nhập liệu",
          "Mã xác thực OTP phải chứa đủ 6 ký tự số!",
          "warning",
        );
        return;
      }

      if (newPassword.length < 6) {
        Swal.fire(
          "Lỗi nhập liệu",
          "Mật khẩu mới bắt buộc phải từ 6 ký tự trở lên!",
          "warning",
        );
        return;
      }

      const btnResetPass = document.getElementById("btnResetPass");
      const originalResetHtml = btnResetPass.innerHTML;
      btnResetPass.disabled = true;
      btnResetPass.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang xử lý...';

      try {
        // Gửi request lên Backend (Khớp với Route: router.post("/reset-password"))
        const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
          email: savedEmail, // Email lấy từ bước 1
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

        // Điều hướng người dùng quay trở lại trang đăng nhập
        window.location.href = "/src/pages/login.html";
      } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);
        const errorMsg =
          error.response?.data?.message ||
          "Mã OTP không đúng hoặc đã hết hiệu lực!";
        Swal.fire("Lỗi xác thực", errorMsg, "error");
      } finally {
        btnResetPass.disabled = false;
        btnResetPass.innerHTML = originalResetHtml;
      }
    };
  }

  // =================================================================================
  // ⚡ TÍNH NĂNG PHỤ: ẨN / HIỆN MẬT KHẨU (TOGGLE PASSWORD)
  // =================================================================================
  if (toggleNewPasswordBtn && newPasswordInput) {
    toggleNewPasswordBtn.onclick = () => {
      const isPassword = newPasswordInput.type === "password";
      newPasswordInput.type = isPassword ? "text" : "password";

      // Thay đổi icon con mắt (eye / eye-slash) tương ứng
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
