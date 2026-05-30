// src/JS/header.js
export const BASE_URL = "https://qlbh-project.onrender.com/api";
import Swal from "sweetalert2";

function injectHeaderCSS() {
  const cssPath = "/src/styles/header.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
}

// Hàm khởi tạo và chạy đồng bộ tất cả các tính năng của Header
export function initHeader() {
  renderHeader();
  injectHeaderCSS();
  checkLoginStatus();
}

// Tự động chạy khi trang tải xong trong phạm vi module này
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeader);
} else {
  initHeader();
}

// Hàm tự động sinh giao diện Header cố định
export function renderHeader() {
  const headerElement = document.getElementById("main-header");
  if (!headerElement) return;

  headerElement.className = "bg-white shadow-sm sticky-top";
  headerElement.innerHTML = `
        <div class="container py-3">
            <div class="row align-items-center">
                <div class="col-lg-2 col-md-3 col-6">
                    <a class="navbar-brand d-flex align-items-center" href="/">
                        <i class="fa-solid fa-store text-primary me-2" style="font-size: 1.5rem;"></i>
                        <div>
                            <strong class="text-primary d-block" style="font-size: 1.1rem;">HP STORE</strong>
                        </div>
                    </a>
                </div>

                <div class="col-lg-5 col-md-4 d-none d-md-block position-relative">
                    <div class="input-group">
                        <input type="text" id="search-input" class="form-control search-bar" placeholder="Tìm kiếm sản phẩm..." style="border-radius: 20px 0 0 20px;">
                        <button class="btn btn-outline-primary" style="border-radius: 0 20px 20px 0;">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>
                    <div id="search-suggestions" class="list-group position-absolute w-100 shadow-sm d-none" style="z-index: 1000; top: 100%; max-height: 300px; overflow-y: auto;">
                    </div>
                </div>

                <div class="col-lg-5 col-md-5 col-6 d-flex justify-content-end align-items-center gap-2 auth-buttons" id="auth-section">
                    <a href="/src/pages/login.html" class="btn btn-login d-none d-sm-inline-block">Đăng nhập</a>
                    <a href="/src/pages/register.html" class="btn btn-register d-none d-sm-inline-block">Đăng ký</a>
                    
                    <div class="vr mx-2 d-none d-sm-block"></div>
                    <button class="btn btn-cart position-relative" id="btn-header-cart">
                        <i class="fa fa-shopping-cart"></i>
                        <span class="d-none d-lg-inline ms-1">Giỏ hàng</span>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-count">0</span>
                    </button>
                </div>
            </div>
        </div>
    `;

  const cartBtn = document.getElementById("btn-header-cart");
  if (cartBtn) {
    cartBtn.addEventListener("click", () => {
      window.location.href = "/src/pages/cart.html";
    });
  }
}

// Hàm kiểm tra trạng thái đăng nhập và thay đổi giao diện động
export function checkLoginStatus() {
  const authSection = document.getElementById("auth-section");
  if (!authSection) return;

  const userData = JSON.parse(localStorage.getItem("hpstore_user"));

  if (userData && userData.token) {
    authSection.innerHTML = `
            <div class="dropdown user-dropdown">
                <a class="nav-link d-flex align-items-center gap-2 py-2" href="#" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                    <div class="user-avatar-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center" 
                         style="width: 35px; height: 35px; border-radius: 50%;">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <span class="fw-bold text-dark d-none d-sm-inline">Chào, ${userData.name ? userData.name.split(" ").pop() : "Khách"}</span>
                    <i class="fa-solid fa-chevron-down ms-1 small text-muted d-none d-sm-inline"></i>
                </a>
                
                <ul class="dropdown-menu dropdown-menu-end shadow border-0" 
                    style="border-radius: 15px; min-width: 200px; margin-top: 10px;">
                    <li class="px-3 py-2">
                        <div class="small text-muted">Tài khoản cá nhân</div>
                        <div class="fw-bold text-truncate">${userData.name || "Người dùng"}</div>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2" href="/src/pages/hoso.html">
                        <i class="fa-solid fa-circle-user me-2 text-muted"></i>Hồ sơ của tôi</a></li>
                    <li><a class="dropdown-item py-2" href="/src/pages/order-history.html">
                        <i class="fa-solid fa-box me-2 text-muted"></i>Đơn hàng đã mua</a>
                    </li>
                    
                    ${
                      userData.role === "Manager"
                        ? `
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-primary fw-bold" href="/src/pages/dashboard.html">
                        <i class="fa-solid fa-gauge-high me-2"></i>Trang quản trị</a></li>
                    `
                        : ""
                    }

                    ${
                      userData.role === "Employee"
                        ? `
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-success fw-bold" href="/src/pages/employeeManager.html">
                        <i class="fa-solid fa-user-tie me-2"></i>Giao diện nhân viên</a></li>
                    `
                        : ""
                    }
                    
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-danger" id="btnLogout" style="cursor: pointer;">
                        <i class="fa-solid fa-power-off me-2"></i>Đăng xuất</a></li>
                </ul>
            </div>

            <div class="vr mx-2 d-none d-sm-block"></div>

            <button class="btn btn-cart position-relative" id="btn-header-cart-logged">
                <i class="fa fa-shopping-cart"></i>
                <span class="d-none d-lg-inline ms-1">Giỏ hàng</span>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-count">0</span>
            </button>
        `;

    const currentUserId = userData.MaND || userData.id;
    const userCart =
      JSON.parse(localStorage.getItem(`hpstore_cart_${currentUserId}`)) || [];
    const totalItems = userCart.reduce(
      (sum, item) => sum + (parseInt(item.SoLuong) || 0),
      0,
    );

    const badge = document.getElementById("cart-count");
    if (badge) {
      badge.innerText = totalItems;
    }

    const cartBtnLogged = document.getElementById("btn-header-cart-logged");
    if (cartBtnLogged) {
      cartBtnLogged.addEventListener("click", () => {
        window.location.href = "/src/pages/cart.html";
      });
    }

    // Đính ký sự kiện logout chuẩn xác
    const logoutBtn = document.getElementById("btnLogout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }
  }
}

export function handleLogout(e) {
  if (e) e.preventDefault();
  Swal.fire({
    title: "Bạn muốn đăng xuất?",
    text: "Hẹn gặp lại bạn tại HP STORE nhé!",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#0d6efd",
    cancelButtonColor: "#dc3545",
    confirmButtonText: "Đăng xuất",
    cancelButtonText: "Ở lại",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1. Lấy thông tin user hiện tại ra để biết Mã ND nhằm xóa đúng giỏ hàng
      const userData = JSON.parse(localStorage.getItem("hpstore_user"));
      if (userData) {
        const currentUserId = userData.MaND || userData.id;
        // 2. Xóa sạch giỏ hàng của tài khoản này khỏi máy tính
        // localStorage.removeItem(`hpstore_cart_${currentUserId}`);
      }

      // 3. Xóa session đăng nhập tài khoản
      localStorage.removeItem("hpstore_user");
      localStorage.removeItem("current_employee_page");

      // Điều hướng về trang chủ
      window.location.href = "/";
    }
  });
}
