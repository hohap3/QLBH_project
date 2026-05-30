import axios from "axios";
import Swal from "sweetalert2";

// 🟢 ĐÃ CẬP NHẬT: Đổi từ localhost sang domain Render để chạy thực tế
const BASE_URL = "https://qlbh-project.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Kiểm tra trạng thái đăng nhập từ key chung 'hpstore_user'
  const storedData = localStorage.getItem("hpstore_user");

  if (!storedData) {
    showLoginAlert();
    return;
  }

  try {
    const userSession = JSON.parse(storedData);
    const token = userSession.token;
    const maND = userSession.id;

    if (!token || !maND) {
      showLoginAlert();
      return;
    }

    // 2. Tải thông tin tài khoản chi tiết đổ vào Sidebar và Form
    await loadUserProfile(maND, token);

    // 3. Khởi tạo các sự kiện Form
    initUIEvents(maND, token);
  } catch (e) {
    console.error("Lỗi parse cấu trúc dữ liệu session:", e);
    showLoginAlert();
  }
});

// Hàm hiển thị thông báo bắt buộc đăng nhập
function showLoginAlert() {
  Swal.fire({
    icon: "warning",
    title: "Thông báo!",
    text: "Vui lòng đăng nhập để truy cập hồ sơ!",
    confirmButtonColor: "#6138ff",
  }).then(() => {
    window.location.href = "/src/pages/login.html";
  });
}

// HÀM LẤY VÀ ĐỔ DỮ LIỆU TỪ BACKEND
async function loadUserProfile(maND, token) {
  try {
    const response = await axios.get(`${BASE_URL}/profile/${maND}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    console.log("Dữ liệu Profile nhận được:", data);

    // Đổ dữ liệu vào vùng Sidebar bên trái của trang hoso.html
    const sidebarFullname = document.getElementById("sidebar-fullname");
    const sidebarUsername = document.getElementById("sidebar-username");
    const sidebarPoints = document.getElementById("sidebar-points");

    // 🟢 ĐÃ CẬP NHẬT: Sửa các trường dữ liệu thành CHỮ THƯỜNG đồng bộ với PostgreSQL
    if (sidebarFullname)
      sidebarFullname.innerText = data.hoten || "Chưa cập nhật";
    if (sidebarUsername) sidebarUsername.innerText = `@${data.tendangnhap}`;
    if (sidebarPoints) sidebarPoints.innerText = data.diemtichluy || 0;

    // Điền dữ liệu vào Form thông tin chi tiết (Sửa sang chữ thường)
    document.getElementById("info-username").value = data.tendangnhap;
    document.getElementById("info-fullname").value = data.hoten || "";
    document.getElementById("info-phone").value = data.sdt || "";
    document.getElementById("info-email").value = data.email || "";
    document.getElementById("info-address").value = data.diachi || "";

    // Định dạng ngày tạo tài khoản thân thiện (Sửa sang chữ thường)
    if (data.ngaytao) {
      const orderDate = new Date(data.ngaytao);
      document.getElementById("info-created-date").value =
        orderDate.toLocaleDateString("vi-VN");
    }
  } catch (err) {
    console.error("Lỗi lấy thông tin profile:", err);
    Swal.fire({
      icon: "error",
      title: "Lỗi!",
      text:
        err.response?.data?.message ||
        "Có lỗi xảy ra khi lấy thông tin từ máy chủ!",
      confirmButtonColor: "#6138ff",
    });
  }
}

// KHỞI TẠO CÁC SỰ KIỆN FORM VÀ THAO TÁC TRÊN TRANG HỒ SƠ
function initUIEvents(maND, token) {
  // Ẩn/Hiện mật khẩu nhanh cho các ô Input Password
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.onclick = function () {
      const input = this.parentElement.querySelector("input");
      if (input.type === "password") {
        input.type = "text";
        this.innerHTML = '<i class="fa fa-eye-slash"></i>';
      } else {
        input.type = "password";
        this.innerHTML = '<i class="fa fa-eye"></i>';
      }
    };
  });

  // SUBMIT: CẬP NHẬT THÔNG TIN CÁ NHÂN
  const formInfo = document.getElementById("form-update-profile");
  if (formInfo) {
    formInfo.onsubmit = async (e) => {
      e.preventDefault();

      // 🟢 ĐÃ CẬP NHẬT: Giữ nguyên key PascalCase gửi lên body, Controller ở Backend sẽ tự ánh xạ lại sang chữ thường
      const payload = {
        HoTen: document.getElementById("info-fullname").value.trim(),
        SDT: document.getElementById("info-phone").value.trim(),
        Email: document.getElementById("info-email").value.trim(),
        DiaChi: document.getElementById("info-address").value.trim(),
      };

      try {
        await axios.put(`${BASE_URL}/profile/update/${maND}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Thông tin cá nhân đã được cập nhật!",
          confirmButtonColor: "#6138ff",
        }).then(() => {
          const userSession = JSON.parse(localStorage.getItem("hpstore_user"));
          if (userSession) {
            userSession.name = payload.HoTen;
            localStorage.setItem("hpstore_user", JSON.stringify(userSession));
          }
          location.reload();
        });
      } catch (error) {
        console.error("Lỗi cập nhật profile:", error);
        Swal.fire({
          icon: "error",
          title: "Lỗi!",
          text:
            error.response?.data?.message ||
            "Không thể cập nhật thông tin lúc này.",
          confirmButtonColor: "#6138ff",
        });
      }
    };
  }

  // SUBMIT: THAY ĐỔI MẬT KHẨU
  const formPassword = document.getElementById("form-change-password");
  if (formPassword) {
    formPassword.onsubmit = async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("pass-current").value;
      const newPassword = document.getElementById("pass-new").value;
      const confirmPassword = document.getElementById("pass-confirm").value;

      // 1. Kiểm tra độ dài mật khẩu mới
      if (newPassword.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: "Mật khẩu mới phải từ 6 ký tự trở lên!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // 2. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
      if (currentPassword === newPassword) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: "Mật khẩu mới không được phép trùng với mật khẩu hiện tại!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // 3. Kiểm tra nhập lại mật khẩu mới
      if (newPassword !== confirmPassword) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: "Xác nhận mật khẩu mới không trùng khớp!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      try {
        // Gửi request PUT đổi mật khẩu
        await axios.put(
          `${BASE_URL}/profile/change-password/${maND}`,
          { currentPassword, newPassword },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        // 4. Đổi mật khẩu thành công -> Xóa bộ nhớ Session & Yêu cầu đăng nhập lại
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại với mật khẩu mới!",
          confirmButtonColor: "#6138ff",
          allowOutsideClick: false,
        }).then(() => {
          formPassword.reset();

          // Thực hiện xóa sạch token đăng nhập cũ trong localStorage
          localStorage.removeItem("hpstore_user");

          // Điều hướng ngay lập tức về trang Login
          window.location.href = "/src/pages/login.html";
        });
      } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        Swal.fire({
          icon: "error",
          title: "Thất bại!",
          text:
            error.response?.data?.message ||
            "Mật khẩu cũ không chính xác hoặc lỗi hệ thống.",
          confirmButtonColor: "#6138ff",
        });
      }
    };
  }
}
