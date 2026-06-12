import axios from "axios";
import Swal from "sweetalert2";
import { checkAuth } from "./auth-guard.js";

document.addEventListener("DOMContentLoaded", () => {
  checkAuth(["Manager", "ADMIN"]);
});

function updateUserSection() {
  const userSection = document.querySelector(".user-section");
  if (!userSection) return;

  const savedUser = localStorage.getItem("hpstore_user");
  if (!savedUser) return;

  const adminData = JSON.parse(savedUser);

  if (adminData) {
    const avatarEl = userSection.querySelector(".user-avatar");
    const nameEl = userSection.querySelector(".user-name");
    const emailEl = userSection.querySelector(".user-email");

    const displayName = adminData.fullName || adminData.name || "Quản trị viên";
    const displayEmail =
      adminData.email || adminData.username || "admin@hpstore.vn";

    if (nameEl) nameEl.innerText = displayName;
    if (emailEl) emailEl.innerText = displayEmail;

    if (avatarEl) {
      if (displayName) {
        const initials = displayName
          .trim()
          .split(/\s+/)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2);
        avatarEl.innerText = initials;
      } else {
        avatarEl.innerText = "AD";
      }
    }
  }
}

// 1. Cấu hình đường dẫn đến các file HTML con (🟢 Đã xóa trùng lặp key khach-hang)
const pageUrls = {
  "tong-quan": "/src/pages/tong-quan.html",
  "san-pham": "/src/pages/san-pham.html",
  "don-hang": "/src/pages/don-hang.html",
  "khach-hang": "/src/pages/khach-hang.html",
  "cai-dat": "/src/pages/cai-dat.html",
  "update-pass": "/src/pages/update-pass.html",
  "nha-cung-cap": "/src/pages/nha-cung-cap.html",
  "danh-muc": "/src/pages/danh-muc.html",
  "quanly-nhanvien": "/src/pages/quanly-nhanvien.html",
  "quanly-khohang": "/src/pages/quanly-khohang.html",
};

// 2. Hàm chuyển trang sử dụng Fetch API
async function switchPage(pageKey, title) {
  const contentArea = document.getElementById("dynamic-content");
  const pageUrl = pageUrls[pageKey] || `/src/pages/${pageKey}.html`;

  try {
    const response = await fetch(pageUrl);
    if (!response.ok) throw new Error(`Không thể tải trang: ${pageKey}`);

    const html = await response.text();
    contentArea.innerHTML = html;
    localStorage.setItem("current_admin_page", pageKey);

    // KÍCH HOẠT LOGIC JS RIÊNG CHO TỪNG TRANG (Import động an toàn)
    switch (pageKey) {
      case "cai-dat": {
        const { initCaiDat } = await import("./pages/cai-dat.js");
        initCaiDat();
        break;
      }
      case "update-pass": {
        const { initUpdatePass } = await import("./pages/update-pass.js");
        initUpdatePass();
        break;
      }
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
      case "khach-hang": {
        const { initCustomerManager } = await import("./pages/khach-hang.js");
        initCustomerManager();
        break;
      }
      case "don-hang": {
        const { initOrderManager } = await import("./pages/don-hang.js");
        initOrderManager();
        break;
      }
      case "tong-quan": {
        const { initTongQuan } = await import("./pages/tong-quat.js");
        initTongQuan();
        break;
      }
      case "quanly-nhanvien": {
        const { initEmployeeManager } =
          await import("./pages/quanly-nhanvien.js");
        initEmployeeManager();
        break;
      }
      case "quanly-khohang": {
        const { initWarehouseManager } = await import("./pages/warehouse.js");
        initWarehouseManager();
        break;
      }
    }
  } catch (error) {
    console.error("Lỗi khi chuyển trang:", error);
    contentArea.innerHTML = `<div class="alert alert-danger">Lỗi tải nội dung trang hoặc kịch bản đi kèm.</div>`;
  }
}

// 3. Khởi tạo sự kiện
document.addEventListener("DOMContentLoaded", () => {
  const menuLinks = document.querySelectorAll("#sidebarMenu .nav-link");
  const clearActiveClasses = () =>
    menuLinks.forEach((l) => l.classList.remove("active"));

  updateUserSection();

  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      clearActiveClasses();
      link.classList.add("active");
      switchPage(link.getAttribute("data-page"), link.innerText.trim());
    });
  });

  const lastPage = localStorage.getItem("current_admin_page") || "tong-quan";
  const activeLink = document.querySelector(
    `#sidebarMenu .nav-link[data-page="${lastPage}"]`,
  );

  clearActiveClasses();
  if (activeLink) {
    activeLink.classList.add("active");
    switchPage(lastPage, activeLink.innerText.trim());
  } else {
    switchPage("tong-quan", "Tổng quan Dashboard");
  }
});
