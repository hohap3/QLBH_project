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

  const loadUserData = async () => {
    try {
      // Truyền ID vào query string
      const response = await axios.get(
        `${BASE_URL}/user/profile?id=${userStorage.id}`,
      );
      const user = response.data;

      // 2. Đổ dữ liệu vào giao diện
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

  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();

      // --- 🟢 BỔ SUNG LOGIC VALIDATE DỮ LIỆU ---
      const hoTen = document.getElementById("txtHoTen").value.trim();
      const email = document.getElementById("txtEmail").value.trim();
      const sdt = document.getElementById("txtSDT").value.trim();

      // 1. Kiểm tra họ tên không được để trống
      if (!hoTen) {
        Swal.fire("Lỗi nhập liệu", "Họ và tên không được để trống!", "warning");
        return;
      }

      // 2. Kiểm tra định dạng Email hợp lệ bằng Regular Expression
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Swal.fire("Lỗi nhập liệu", "Định dạng Email không hợp lệ!", "warning");
        return;
      }

      // 3. Kiểm tra số điện thoại có phải hoàn toàn là số hay không
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(sdt)) {
        Swal.fire(
          "Lỗi nhập liệu",
          "Số điện thoại bắt buộc phải là các ký tự số!",
          "warning",
        );
        return;
      }

      // 4. Kiểm tra độ dài tối thiểu của Số điện thoại
      if (sdt.length < 10) {
        Swal.fire(
          "Lỗi nhập liệu",
          "Số điện thoại phải từ 10 ký tự trở lên!",
          "warning",
        );
        return;
      }

      // --- 🟡 TIẾN HÀNH XỬ LÝ GỬI DỮ LIỆU LÊN SERVER ---
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';

      const updateData = {
        MaND: userStorage.id, // ID để backend định danh
        HoTen: hoTen,
        Email: email,
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

        // Cập nhật lại localStorage để đồng bộ hiển thị tên mới trên Header ngay lập tức
        const newUserInfo = { ...userStorage, HoTen: updateData.HoTen };
        localStorage.setItem("hpstore_user", JSON.stringify(newUserInfo));
      } catch (error) {
        console.error("Lỗi update:", error);

        // Hiển thị lỗi từ backend (ví dụ: trùng Email/SDT)
        const errorMsg =
          error.response?.data?.message || "Có lỗi xảy ra khi cập nhật";
        Swal.fire("Thất bại", errorMsg, "error");
      } finally {
        // Khôi phục trạng thái nút bấm ban đầu
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    };
  }

  if (btnLogout) {
    // Tránh gán chồng sự kiện nếu người dùng click menu nhiều lần
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
        // Xóa dữ liệu phiên làm việc
        localStorage.removeItem("hpstore_user");
        localStorage.removeItem("current_admin_page");
        localStorage.removeItem("current_employee_page");
        // Chuyển hướng về trang login
        window.location.href = "/src/pages/login.html";
      }
    };
  }
}
