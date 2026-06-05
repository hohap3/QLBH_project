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

      // Lấy dữ liệu và thực hiện loại bỏ khoảng trắng thừa (.trim())
      const hoTen = document.getElementById("info-fullname").value.trim();
      const sdt = document.getElementById("info-phone").value.trim();
      const email = document.getElementById("info-email").value.trim();
      const diaChi = document.getElementById("info-address").value.trim();

      // --- 🟢 ĐÃ CẬP NHẬT: LOGIC VALIDATE DỮ LIỆU CHUẨN ---

      // 1. Kiểm tra họ và tên trống hoặc ngắn hơn 6 ký tự
      if (!hoTen) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Họ và tên không được để trống!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      if (hoTen.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Họ và tên phải có độ dài từ 6 ký tự trở lên!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // 2. Định dạng lại Email bằng RFC 5322 Tiêu chuẩn nâng cao
      // Chấp nhận tất cả đuôi mở rộng phức tạp (ví dụ: .com, .edu.vn, .net) và chống ký tự lạ.
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!email || !emailRegex.test(email)) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Địa chỉ Email không hợp lệ hoặc sai cấu trúc (Ví dụ hợp lệ: nguyenvan@gmail.com)!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // 3. Kiểm tra số điện thoại bắt buộc phải là các ký tự số
      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(sdt)) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Số điện thoại bắt buộc phải là các ký tự số từ 0-9!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // 4. Kiểm tra độ dài tối thiểu của Số điện thoại (từ 10 số trở lên)
      if (sdt.length < 10) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Số điện thoại phải từ 10 ký tự trở lên!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // 🟢 ĐÃ CẬP NHẬT: Gửi chuỗi dữ liệu sạch sau khi đã kiểm tra định dạng thành công
      const payload = {
        HoTen: hoTen,
        SDT: sdt,
        Email: email,
        DiaChi: diaChi,
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

        // 🟢 ĐÃ CẬP NHẬT: Bắt lỗi trùng lặp Số điện thoại hoặc Email từ Backend/PostgreSQL
        const errorDetail = error.response?.data?.error || "";
        let errorMessage = "Không thể cập nhật thông tin lúc này.";

        if (errorDetail.includes("uq_nd_sdt") || errorDetail.includes("sdt")) {
          errorMessage =
            "Số điện thoại này đã được sử dụng bởi một tài khoản khác!";
        } else if (
          errorDetail.includes("uq_nd_email") ||
          errorDetail.includes("email")
        ) {
          errorMessage =
            "Địa chỉ Email này đã được sử dụng bởi một tài khoản khác!";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        Swal.fire({
          icon: "error",
          title: "Trùng lặp dữ liệu!",
          text: errorMessage,
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
