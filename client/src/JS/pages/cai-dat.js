import Swal from "sweetalert2";
import axios from "axios";
import { BASE_URL } from "/src/JS/common/header";

// Hàm này sẽ được gọi mỗi khi trang Cài đặt được nạp vào vùng dynamic-content
export async function initCaiDat() {
  const btnLogout = document.getElementById("btnLogout");
  const userStorage = JSON.parse(localStorage.getItem("hpstore_user"));
  const profileForm = document.getElementById("profileForm");

  if (!userStorage || !userStorage.id) {
    Swal.fire("Lỗi", "Phiên làm việc hết hạn, vui lòng đăng nhập lại", "error");
    return;
  }

  // --- 🔴 CÁC HÀM TIỆN ÍCH XỬ LÝ ERROR TEXT (INLINE ERROR) ---

  // Hàm hiển thị lỗi inline trực tiếp dưới input
  function showInlineError(inputId, errorId, message) {
    const inputField = document.getElementById(inputId);
    const errorContainer = document.getElementById(errorId);
    if (inputField && errorContainer) {
      inputField.classList.add("is-invalid");
      errorContainer.innerText = message;
      errorContainer.classList.remove("d-none");
    }
  }

  // Hàm xóa toàn bộ lỗi cũ trên form trước khi tiến hành validate mới
  function clearFormErrors() {
    if (!profileForm) return;
    profileForm.querySelectorAll(".form-control").forEach((input) => {
      input.classList.remove("is-invalid");
    });
    profileForm.querySelectorAll(".error-text").forEach((errDiv) => {
      errDiv.classList.add("d-none");
      errDiv.innerText = "";
    });
  }

  // Khởi tạo cơ chế lắng nghe sự kiện gõ phím -> Tự động xóa lỗi inline
  const fieldsToWatch = ["txtHoTen", "txtEmail", "txtSDT"];
  fieldsToWatch.forEach((id) => {
    const inputEl = document.getElementById(id);
    if (inputEl) {
      inputEl.addEventListener("input", function () {
        this.classList.remove("is-invalid");
        const errDiv = document.getElementById(`${id}-error`);
        if (errDiv) {
          errDiv.classList.add("d-none");
          errDiv.innerText = "";
        }
      });
    }
  });

  // --- LOAD PROFILE DATA ---
  const loadUserData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/user/profile?id=${userStorage.id}`,
      );
      const user = response.data;

      const inputTenDN = document.getElementById("txtTenDangNhap");
      const inputHoTen = document.getElementById("txtHoTen");
      const inputEmail = document.getElementById("txtEmail");
      const inputSDT = document.getElementById("txtSDT");

      if (inputTenDN) inputTenDN.value = user.tendangnhap;
      if (inputHoTen) inputHoTen.value = user.hoten || "";
      if (inputEmail) inputEmail.value = user.email || "";
      if (inputSDT) inputSDT.value = user.sdt || "";
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu:", error);
      Swal.fire("Lỗi", "Không thể lấy thông tin từ máy chủ", "error");
    }
  };

  await loadUserData();

  // --- HANDLE SUBMIT FORM ---
  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();

      // Xóa sạch các vết lỗi cũ trước khi validate lượt mới
      clearFormErrors();

      const hoTen = document.getElementById("txtHoTen").value.trim();
      const email = document.getElementById("txtEmail").value.trim();
      const sdt = document.getElementById("txtSDT").value.trim();

      let hasError = false;

      // 1. Validate Họ tên
      if (!hoTen) {
        showInlineError(
          "txtHoTen",
          "txtHoTen-error",
          "Họ và tên không được để trống!",
        );
        hasError = true;
      } else if (hoTen.length < 6) {
        showInlineError(
          "txtHoTen",
          "txtHoTen-error",
          "Họ và tên phải có độ dài từ 6 ký tự trở lên!",
        );
        hasError = true;
      }

      // 2. Validate Email (Theo chuẩn Regex hoso.js)
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (email && !emailRegex.test(email)) {
        showInlineError(
          "txtEmail",
          "txtEmail-error",
          "Địa chỉ Email không hợp lệ hoặc sai cấu trúc!",
        );
        hasError = true;
      }

      // 3. Validate Số điện thoại (Chỉ nhận số & tối thiểu 10 ký tự)
      const phoneRegex = /^[0-9]+$/;
      if (!sdt) {
        showInlineError(
          "txtSDT",
          "txtSDT-error",
          "Số điện thoại không được để trống!",
        );
        hasError = true;
      } else if (!phoneRegex.test(sdt)) {
        showInlineError(
          "txtSDT",
          "txtSDT-error",
          "Số điện thoại bắt buộc phải là các ký tự số từ 0-9!",
        );
        hasError = true;
      } else if (sdt.length < 10) {
        showInlineError(
          "txtSDT",
          "txtSDT-error",
          "Số điện thoại phải từ 10 chữ số trở lên!",
        );
        hasError = true;
      }

      // Nếu phát hiện có lỗi nhập liệu thì dừng xử lý, không gửi API
      if (hasError) return;

      // --- TIẾN HÀNH XỬ LÝ GỬI DỮ LIỆU LÊN SERVER ---
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';

      const updateData = {
        MaND: userStorage.id,
        HoTen: hoTen,
        Email: email || null, // Đồng bộ đẩy chuỗi rỗng về null
        SDT: sdt,
      };

      try {
        const response = await axios.put(`${BASE_URL}/user/update`, updateData);

        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: response.data.message || "Cập nhật thông tin thành công!",
          timer: 2000,
          showConfirmButton: false,
        });

        // Cập nhật lại localStorage để đồng bộ hiển thị tên mới
        const newUserInfo = { ...userStorage, HoTen: updateData.HoTen };
        localStorage.setItem("hpstore_user", JSON.stringify(newUserInfo));
      } catch (error) {
        console.error("Lỗi update:", error);

        // Bắt lỗi trùng lặp dữ liệu từ Database/Server gửi về và đẩy ngược vào inline error text
        const errorDetail = error.response?.data?.error || "";
        const serverMsg = error.response?.data?.message || "";

        if (
          errorDetail.includes("uq_nd_sdt") ||
          errorDetail.includes("sdt") ||
          serverMsg.includes("Số điện thoại")
        ) {
          showInlineError(
            "txtSDT",
            "txtSDT-error",
            "Số điện thoại này đã được sử dụng bởi một tài khoản khác!",
          );
        } else if (
          errorDetail.includes("uq_nd_email") ||
          errorDetail.includes("email") ||
          serverMsg.includes("Email")
        ) {
          showInlineError(
            "txtEmail",
            "txtEmail-error",
            "Địa chỉ Email này đã được sử dụng bởi một tài khoản khác!",
          );
        } else {
          // Gặp lỗi hệ thống không lường trước khác mới dùng thông báo tổng quan
          Swal.fire(
            "Lỗi hệ thống",
            serverMsg || "Có lỗi xảy ra khi cập nhật",
            "error",
          );
        }
      } finally {
        // Khôi phục trạng thái nút bấm ban đầu
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    };
  }

  // --- HANDLE LOGOUT EVENT ---
  if (btnLogout) {
    btnLogout.onclick = async () => {
      const result = await Swal.fire({
        title: "Xác nhận đăng xuất?",
        text: "Phiên làm việc của bạn sẽ kết thúc.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#6138ff",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        localStorage.removeItem("hpstore_user");
        localStorage.removeItem("current_admin_page");
        localStorage.removeItem("current_employee_page");
        window.location.href = "/src/pages/login.html";
      }
    };
  }
}
