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

    // Khởi tạo bộ chọn địa chỉ trước khi load profile
    await initLocationDropdowns();

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

// 🟢 HÀM KHỞI TẠO ĐỊA CHỈ 3 CẤP TỪ API PUBLIC
async function initLocationDropdowns() {
  const provinceSel = document.getElementById("info-province");
  const districtSel = document.getElementById("info-district");
  const wardSel = document.getElementById("info-ward");

  if (!provinceSel) return;

  try {
    // Reset về trạng thái ban đầu để tránh trùng lặp option khi reload hoặc gọi lại
    provinceSel.innerHTML =
      '<option value="">-- Chọn Tỉnh/Thành phố --</option>';

    // Tải danh sách Tỉnh/Thành phố
    const res = await axios.get("https://provinces.open-api.vn/api/p/");
    res.data.forEach((p) => {
      provinceSel.options[provinceSel.options.length] = new Option(
        p.name,
        p.code,
      );
    });

    // Lắng nghe thay đổi ở ô Tỉnh -> Tải Huyện
    provinceSel.addEventListener("change", async () => {
      districtSel.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
      wardSel.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
      districtSel.disabled = true;
      wardSel.disabled = true;

      if (provinceSel.value) {
        const dRes = await axios.get(
          `https://provinces.open-api.vn/api/p/${provinceSel.value}?depth=2`,
        );
        dRes.data.districts.forEach((d) => {
          districtSel.options[districtSel.options.length] = new Option(
            d.name,
            d.code,
          );
        });
        districtSel.disabled = false;
      }
    });

    // Lắng nghe thay đổi ở ô Huyện -> Tải Xã
    districtSel.addEventListener("change", async () => {
      wardSel.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
      wardSel.disabled = true;

      if (districtSel.value) {
        const wRes = await axios.get(
          `https://provinces.open-api.vn/api/d/${districtSel.value}?depth=2`,
        );
        wRes.data.wards.forEach((w) => {
          wardSel.options[wardSel.options.length] = new Option(w.name, w.code);
        });
        wardSel.disabled = false;
      }
    });
  } catch (error) {
    console.error("Không thể tải API địa chính công cộng:", error);
  }
}

// HÀM LẤY VÀ ĐỔ DỮ LIỆU TỪ BACKEND
async function loadUserProfile(maND, token) {
  try {
    const response = await axios.get(`${BASE_URL}/profile/${maND}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;
    console.log("Dữ liệu Profile nhận được:", data);

    // Đổ dữ liệu vào vùng Sidebar bên trái
    const sidebarFullname = document.getElementById("sidebar-fullname");
    const sidebarUsername = document.getElementById("sidebar-username");
    const sidebarPoints = document.getElementById("sidebar-points");

    if (sidebarFullname)
      sidebarFullname.innerText = data.hoten || "Chưa cập nhật";
    if (sidebarUsername) sidebarUsername.innerText = `@${data.tendangnhap}`;
    if (sidebarPoints) sidebarPoints.innerText = data.diemtichluy || 0;

    // Điền dữ liệu vào Form thông tin chi tiết
    document.getElementById("info-username").value = data.tendangnhap;
    document.getElementById("info-fullname").value = data.hoten || "";
    document.getElementById("info-phone").value = data.sdt || "";
    document.getElementById("info-email").value = data.email || "";

    // 🟢 SỬA LỖI ĐỊA CHỈ NULL: Kiểm tra nghiêm ngặt tính hợp lệ của chuỗi
    if (
      data.diachi &&
      data.diachi.trim() !== "" &&
      data.diachi !== "null" &&
      data.diachi !== "undefined"
    ) {
      const parts = data.diachi.split(",").map((p) => p.trim());

      // Nếu chuỗi chuẩn mực có cấu trúc: [Số nhà], [Phường/Xã], [Quận/Huyện], [Tỉnh/Thành]
      if (parts.length >= 4) {
        const provinceText = parts.pop();
        const districtText = parts.pop();
        const wardText = parts.pop();
        const streetText = parts.join(", "); // Gom các phần còn lại làm số nhà

        document.getElementById("info-street").value = streetText;

        // Kích hoạt khớp chọn Tỉnh
        const provinceSel = document.getElementById("info-province");
        for (let i = 0; i < provinceSel.options.length; i++) {
          if (provinceSel.options[i].text === provinceText) {
            provinceSel.selectedIndex = i;
            provinceSel.dispatchEvent(new Event("change")); // Kích hoạt sự kiện để load Huyện
            break;
          }
        }

        // Đợi API tải danh sách Huyện rồi khớp dữ liệu
        setTimeout(async () => {
          const districtSel = document.getElementById("info-district");
          for (let i = 0; i < districtSel.options.length; i++) {
            if (districtSel.options[i].text === districtText) {
              districtSel.selectedIndex = i;
              districtSel.dispatchEvent(new Event("change")); // Kích hoạt sự kiện để load Xã
              break;
            }
          }

          // Đợi API tải danh sách Xã rồi khớp dữ liệu nốt
          setTimeout(() => {
            const wardSel = document.getElementById("info-ward");
            for (let i = 0; i < wardSel.options.length; i++) {
              if (wardSel.options[i].text === wardText) {
                wardSel.selectedIndex = i;
                break;
              }
            }
          }, 600);
        }, 600);
      } else {
        // Fallback nếu dữ liệu cũ dạng tự do không đúng 4 phần, đổ hết vào ô số nhà
        document.getElementById("info-street").value = data.diachi;
      }
    } else {
      // 🟢 FIX: Đảm bảo khi địa chỉ trống, ô Tỉnh vẫn sẵn sàng để chọn lựa
      document.getElementById("info-street").value = "";
      document.getElementById("info-province").selectedIndex = 0;
      document.getElementById("info-district").innerHTML =
        '<option value="">-- Chọn Quận/Huyện --</option>';
      document.getElementById("info-ward").innerHTML =
        '<option value="">-- Chọn Phường/Xã --</option>';
      document.getElementById("info-district").disabled = true;
      document.getElementById("info-ward").disabled = true;
    }

    // Định dạng ngày tạo tài khoản thân thiện
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

      const hoTen = document.getElementById("info-fullname").value.trim();
      const sdt = document.getElementById("info-phone").value.trim();
      const email = document.getElementById("info-email").value.trim();

      // Thu thập thông tin từ bộ dropdown địa chính mới
      const pEl = document.getElementById("info-province");
      const dEl = document.getElementById("info-district");
      const wEl = document.getElementById("info-ward");
      const streetText = document.getElementById("info-street").value.trim();

      const provinceText = pEl.options[pEl.selectedIndex]?.value
        ? pEl.options[pEl.selectedIndex].text
        : "";
      const districtText = dEl.options[dEl.selectedIndex]?.value
        ? dEl.options[dEl.selectedIndex].text
        : "";
      const wardText = wEl.options[wEl.selectedIndex]?.value
        ? wEl.options[wEl.selectedIndex].text
        : "";

      // Validate bắt buộc chọn đầy đủ các cấp địa chỉ nếu đã nhập số nhà hoặc có thao tác chọn địa chính
      if (
        (streetText || provinceText || districtText || wardText) &&
        (!provinceText || !districtText || !wardText || !streetText)
      ) {
        Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin địa chỉ",
          text: "Vui lòng nhập đầy đủ Số nhà kèm chọn Tỉnh, Huyện, Xã!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      // Ghép chuỗi địa chỉ ngăn cách bằng dấu phẩy theo chuẩn quốc gia
      let diaChi = "";
      if (streetText) {
        diaChi = `${streetText}, ${wardText}, ${districtText}, ${provinceText}`;
      }

      // --- LOGIC VALIDATE CÁC TRƯỜNG DỮ LIỆU CÒN LẠI ---
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
          text: "Họ và tên phải từ 6 ký tự trở lên!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (email && !emailRegex.test(email)) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Địa chỉ Email không hợp lệ!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      const phoneRegex = /^[0-9]+$/;
      if (!phoneRegex.test(sdt)) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Số điện thoại bắt buộc phải là số!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      if (sdt.length < 10) {
        Swal.fire({
          icon: "warning",
          title: "Lỗi nhập liệu",
          text: "Số điện thoại phải từ 10 số trở lên!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      const payload = {
        HoTen: hoTen,
        SDT: sdt,
        Email: email || null, // Chuyển chuỗi rỗng thành null để khớp DB
        DiaChi: diaChi || null, // Chuyển chuỗi rỗng thành null nếu khách xóa địa chỉ
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

  // SUBMIT: THAY ĐỔI MẬT KHẨU (Giữ nguyên)
  const formPassword = document.getElementById("form-change-password");
  if (formPassword) {
    formPassword.onsubmit = async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("pass-current").value;
      const newPassword = document.getElementById("pass-new").value;
      const confirmPassword = document.getElementById("pass-confirm").value;

      if (newPassword.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: "Mật khẩu mới phải từ 6 ký tự trở lên!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      if (currentPassword === newPassword) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: "Mật khẩu mới không được trùng mật khẩu cũ!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo!",
          text: "Xác nhận mật khẩu mới không khớp!",
          confirmButtonColor: "#6138ff",
        });
        return;
      }

      try {
        await axios.put(
          `${BASE_URL}/profile/change-password/${maND}`,
          { currentPassword, newPassword },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại!",
          confirmButtonColor: "#6138ff",
          allowOutsideClick: false,
        }).then(() => {
          formPassword.reset();
          localStorage.removeItem("hpstore_user");
          window.location.href = "/src/pages/login.html";
        });
      } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);
        Swal.fire({
          icon: "error",
          title: "Thất bại!",
          text: error.response?.data?.message || "Mật khẩu cũ không chính xác.",
          confirmButtonColor: "#6138ff",
        });
      }
    };
  }
}
