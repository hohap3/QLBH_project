import Swal from "sweetalert2";
import axios from "axios";

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
        `http://localhost:3000/api/user/profile?id=${userStorage.id}`,
      );
      const user = response.data;

      // 2. Đổ dữ liệu vào giao diện
      const inputTenDN = document.getElementById("txtTenDangNhap");
      const inputHoTen = document.getElementById("txtHoTen");
      const inputEmail = document.getElementById("txtEmail");
      const inputSDT = document.getElementById("txtSDT");

      if (inputTenDN) inputTenDN.value = user.TenDangNhap;
      if (inputHoTen) inputHoTen.value = user.HoTen || "";
      if (inputEmail) inputEmail.value = user.Email || "";
      if (inputSDT) inputSDT.value = user.SDT || "";
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu:", error);
      Swal.fire("Lỗi", "Không thể lấy thông tin từ máy chủ", "error");
    }
  };

  await loadUserData();

  if (profileForm) {
    profileForm.onsubmit = async (e) => {
      e.preventDefault();

      // Hiệu ứng loading cho nút lưu
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';

      const updateData = {
        MaND: userStorage.id, // ID để backend định danh
        HoTen: document.getElementById("txtHoTen").value.trim(),
        Email: document.getElementById("txtEmail").value.trim(),
        SDT: document.getElementById("txtSDT").value.trim(),
      };

      try {
        const response = await axios.put(
          "http://localhost:3000/api/user/update",
          updateData,
        );

        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: response.data.message,
          timer: 2000,
          showConfirmButton: false,
        });

        // Cập nhật lại localStorage nếu bạn muốn hiển thị tên mới trên Header ngay lập tức
        const newUserInfo = { ...userStorage, HoTen: updateData.HoTen };
        localStorage.setItem("hpstore_user", JSON.stringify(newUserInfo));
      } catch (error) {
        console.error("Lỗi update:", error);

        // Hiển thị lỗi từ backend (ví dụ: trùng Email/SDT)
        const errorMsg =
          error.response?.data?.message || "Có lỗi xảy ra khi cập nhật";
        Swal.fire("Thất bại", errorMsg, "error");
      } finally {
        // Khôi phục trạng thái nút bấm
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
