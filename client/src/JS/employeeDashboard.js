// employeeDashboard.js
import axios from "axios";
import Swal from "sweetalert2";
import { checkAuth } from "./auth-guard.js";

document.addEventListener("DOMContentLoaded", () => {
  checkAuth(["Manager", "ADMIN", "Employee", "STAFF"]);
});

/**
 * Cập nhật thông tin tài khoản nhân viên lên thanh Sidebar
 */
function updateUserSection() {
  const userSection = document.querySelector(".user-section");
  if (!userSection) return;

  // Lấy thông tin user đăng nhập được lưu trữ từ hệ thống HP STORE
  // Cấu trúc dự kiến: { HoTen: "Nguyễn Văn A", Email: "employee@hpstore.vn" }
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));

  if (userData) {
    const avatarEl = userSection.querySelector(".user-avatar");
    const nameEl = userSection.querySelector(".user-name");
    const emailEl = userSection.querySelector(".user-email");

    // Hiển thị Họ tên và Email thực tế của nhân viên
    if (nameEl) nameEl.innerText = userData.name || "Nhân viên";
    if (emailEl) emailEl.innerText = userData.username || "employee@hpstore.vn";

    // Tự động tạo ký tự Avatar từ họ tên (Ví dụ: "Nguyễn Văn Đạt" -> "NV" hoặc "ĐA")
    if (avatarEl && userData.HoTen) {
      const initials = userData.HoTen.split(" ")
        .filter((n) => n.length > 0)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      avatarEl.innerText = initials;
    }
  }
}

// 1. Cấu hình danh mục trang hiển thị được phép của Nhân viên
const pageUrls = {
  "san-pham": "/src/pages/san-pham.html",
  "danh-muc": "/src/pages/danh-muc.html",
  "nha-cung-cap": "/src/pages/nha-cung-cap.html",
  "don-hang": "/src/pages/don-hang.html",
  "quanly-khohang": "/src/pages/quanly-khohang.html",
  "update-pass": "/src/pages/update-pass.html",
  "cai-dat": "/src/pages/cai-dat.html",
};

// 2. Hàm chuyển đổi trang động bằng Fetch API
async function switchPage(pageKey, title) {
  const contentArea = document.getElementById("dynamic-content");
  if (!contentArea) return;

  // Kiểm tra tính hợp lệ bảo mật: Nếu trang không nằm trong danh sách của nhân viên thì chặn lại
  if (!pageUrls[pageKey]) {
    contentArea.innerHTML = `<div class="alert alert-warning">Bạn không có quyền truy cập chức năng này.</div>`;
    return;
  }

  const pageUrl = pageUrls[pageKey];

  try {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error("Không thể tải trang");

    const html = await response.text();
    contentArea.innerHTML = html;

    // Lưu lại trang hiện tại của nhân viên để không bị mất khi F5 (Refresh)
    localStorage.setItem("current_employee_page", pageKey);

    // KÍCH HOẠT LOGIC JAVASCRIPT RIÊNG CHO TỪNG PHÂN HỆ
    switch (pageKey) {
      case "san-pham": {
        const { initProductManager } = await import("./pages/san-pham.js");
        initProductManager();
        break;
      }
      case "danh-muc": {
        const { initCategoryManager } = await import("./pages/danh-muc.js");
        initCategoryManager();
        break;
      }
      case "nha-cung-cap": {
        const { initSupplierManager } = await import("./pages/nha-cung-cap.js");
        initSupplierManager();
        break;
      }
      case "don-hang": {
        const { initOrderManager } = await import("./pages/don-hang.js");
        initOrderManager();
        break;
      }

      case "update-pass": {
        const { initUpdatePass } = await import("./pages/update-pass.js");
        initUpdatePass();
        break;
      }

      case "cai-dat": {
        const { initCaiDat } = await import("./pages/cai-dat.js");
        initCaiDat();
        break;
      }

      case "quanly-khohang": {
        const { initWarehouseManager } = await import("./pages/warehouse.js");
        initWarehouseManager();
        break;
      }
    }
  } catch (error) {
    console.error("Lỗi khi chuyển phân hệ trang:", error);
    contentArea.innerHTML = `<div class="alert alert-danger">Lỗi tải nội dung phân hệ. Vui lòng thử lại!</div>`;
  }
}

// 3. Khởi chạy và lắng nghe sự kiện chuyển đổi giao diện công việc
document.addEventListener("DOMContentLoaded", () => {
  const menuLinks = document.querySelectorAll("#sidebarMenu .nav-link");
  const clearActiveClasses = () =>
    menuLinks.forEach((l) => l.classList.remove("active"));

  // Gắn thông tin nhân viên đăng nhập lên giao diện
  updateUserSection();

  // Bắt sự kiện click chuột trên thanh điều hướng Sidebar
  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      clearActiveClasses();
      link.classList.add("active");
      switchPage(link.getAttribute("data-page"), link.innerText.trim());
    });
  });

  // Khôi phục lại trang làm việc trước đó khi tải lại trình duyệt (Mặc định ban đầu là: san-pham)
  const lastPage = localStorage.getItem("current_employee_page") || "san-pham";
  const activeLink = document.querySelector(
    `#sidebarMenu .nav-link[data-page="${lastPage}"]`,
  );

  clearActiveClasses();
  if (activeLink) {
    activeLink.classList.add("active");
    switchPage(lastPage, activeLink.innerText.trim());
  } else {
    // Dự phòng nếu không tìm thấy cấu hình cũ
    const defaultLink = document.querySelector(
      `#sidebarMenu .nav-link[data-page="san-pham"]`,
    );
    if (defaultLink) defaultLink.classList.add("active");
    switchPage("san-pham", "Quản lý sản phẩm");
  }
});
