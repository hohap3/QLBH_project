import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = "https://qlbh-project.onrender.com/api";
const DEFAULT_IMAGE = "/img/default.jpg";

let currentProductPage = 1;
let currentCategory = "all";
let currentBestSellerPage = 1;
const LIMIT = 8;

// Hàm tìm kiếm gợi ý
async function searchProducts() {
  const searchInput = document.getElementById("search-input");
  const suggestionsBox = document.getElementById("search-suggestions");
  if (!searchInput || !suggestionsBox) return;

  searchInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.trim();
    if (keyword.length < 1) {
      suggestionsBox.classList.add("d-none");
      return;
    }
    try {
      const res = await fetch(
        `${BASE_URL}/productsClient/search?q=${encodeURIComponent(keyword)}`,
      );
      const products = await res.json();
      if (products && products.length > 0) {
        suggestionsBox.innerHTML = products
          .map(
            (sp) => `
                    <a href="/src/pages/product-detail.html?id=${sp.MaSP}" class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-2">
                        <img src="${BASE_URL.replace("/api", "")}/uploads/products/${sp.HinhAnh}" alt="${sp.TenSP}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
                        <div class="overflow-hidden">
                            <div class="fw-bold text-truncate" style="font-size: 0.9rem;">${sp.TenSP}</div>
                            <div class="text-primary small fw-bold">${new Intl.NumberFormat("vi-VN").format(sp.GiaBan)}đ</div>
                        </div>
                    </a>
                `,
          )
          .join("");
        suggestionsBox.classList.remove("d-none");
      } else {
        suggestionsBox.classList.add("d-none");
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    }
  });

  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.classList.add("d-none");
    }
  });
}

// ─── 1. HÀM TẢI SẢN PHẨM CÓ PHÂN TRANG & LỌC ───
async function loadProducts(maDM = "all", page = 1) {
  const productContainer = document.getElementById("product-list");
  const paginationContainer = document.getElementById("products-pagination");
  if (!productContainer) return;

  currentCategory = maDM;
  currentProductPage = page;
  productContainer.innerHTML =
    '<div class="text-center w-100 my-4"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await fetch(
      `${BASE_URL}/productsClient?category=${maDM}&page=${page}&limit=${LIMIT}`,
    );
    const data = await res.json();

    // Đồng bộ cấu trúc bóc tách mảng từ Postgres endpoint
    const products =
      data.products || data.data || (Array.isArray(data) ? data : []);
    const totalPages =
      data.totalPages ||
      (data.totalItems ? Math.ceil(data.totalItems / LIMIT) : 1);

    if (products.length === 0) {
      productContainer.innerHTML = `<div class="col-12 text-center my-5"><p class="text-muted">Không có sản phẩm nào thuộc danh mục này.</p></div>`;
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    // Render danh sách sản phẩm
    productContainer.innerHTML = products
      .map((sp) => {
        const imgPath =
          sp.HinhAnh && sp.HinhAnh !== "NULL" && sp.HinhAnh !== ""
            ? `${BASE_URL.replace("/api", "")}/uploads/products/${sp.HinhAnh}`
            : DEFAULT_IMAGE;

        return `
                <div class="col-lg-3 col-md-6 mb-4">
                    <div class="card h-100 border-0 shadow-sm product-card" style="border-radius: 20px; overflow: hidden; transition: transform 0.2s;">
                        <a href="/src/pages/product-detail.html?id=${sp.MaSP}" class="text-decoration-none text-dark">
                            <div class="img-container p-4 text-center" style="background: linear-gradient(180deg, #f0f3ff 0%, #ffffff 100%); position: relative;">
                                <div class="wishlist-btn" style="position: absolute; top: 15px; right: 15px; cursor: pointer; color: #ccc;">
                                    <i class="fa-regular fa-heart"></i>
                                </div>
                                <img src="${imgPath}" class="card-img-top mx-auto" alt="${sp.TenSP || "Sản phẩm"}" style="width: 130px; height: 130px; object-fit: contain;" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
                            </div>
                            <div class="card-body">
                                <small class="text-primary fw-bold">${sp.TenDanhMuc || "Công nghệ"}</small>
                                <h6 class="fw-bold text-truncate mt-1 mb-2">${sp.TenSP}</h6>
                                <div class="mb-2">
                                    <small class="text-warning"><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i></small>
                                    <small class="text-muted">(156)</small>
                                </div>
                                <div class="price-text mb-2" style="color: #6366f1; font-size: 1.25rem; font-weight: 700;">
                                    ${new Intl.NumberFormat("vi-VN").format(sp.GiaBan)}đ
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            `;
      })
      .join("");

    if (paginationContainer) {
      renderPaginationUI(
        paginationContainer,
        totalPages,
        currentProductPage,
        async (targetPage) => {
          // Tối ưu UX: Đợi API trả data xong mới cuộn trang lên mượt mà
          await loadProducts(currentCategory, targetPage);
          productContainer.scrollIntoView({ behavior: "smooth" });
        },
      );
    }
  } catch (err) {
    console.error("Lỗi load danh sách sản phẩm:", err);
    productContainer.innerHTML = `<p class="text-center text-danger">Không thể kết nối đến máy chủ.</p>`;
  }
}

// ─── 2. HÀM TẢI SẢN PHẨM BÁN CHẠY CÓ PHÂN TRANG ───
async function loadBestSellers(page = 1) {
  const container = document.getElementById("best-sellers-container");
  const paginationContainer = document.getElementById("bestsellers-pagination");
  if (!container) return;

  currentBestSellerPage = page;
  container.innerHTML =
    '<div class="text-center w-100 my-3"><div class="spinner-border text-primary spinner-border-sm"></div></div>';

  try {
    const response = await fetch(
      `${BASE_URL}/productsClient/best-sellers?page=${page}&limit=${LIMIT}`,
    );
    const data = await response.json();

    const products =
      data.products || data.data || (Array.isArray(data) ? data : []);
    const totalPages =
      data.totalPages ||
      (data.totalItems ? Math.ceil(data.totalItems / LIMIT) : 1);

    if (products.length === 0) {
      container.innerHTML = `<p class="text-muted text-center w-100">Chưa có dữ liệu sản phẩm bán chạy.</p>`;
      if (paginationContainer) paginationContainer.innerHTML = "";
      return;
    }

    container.innerHTML = products
      .map((sp) => {
        const imgPath =
          sp.HinhAnh && sp.HinhAnh !== "NULL" && sp.HinhAnh !== ""
            ? `${BASE_URL.replace("/api", "")}/uploads/products/${sp.HinhAnh}`
            : DEFAULT_IMAGE;

        return `
                <div class="col-lg-3 col-md-6 mb-4">
                    <div class="card h-100 border-0 shadow-sm product-card" style="border-radius: 15px; overflow: hidden;">
                        <a href="/src/pages/product-detail.html?id=${sp.MaSP}" class="text-decoration-none text-dark">
                            <div class="p-3 text-center bg-white">
                                <img src="${imgPath}" class="card-img-top mx-auto" alt="${sp.TenSP}" style="height: 160px; width: 100%; object-fit: contain;" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
                            </div>
                            <div class="card-body">
                                <h6 class="card-title text-truncate fw-bold mb-1">${sp.TenSP}</h6>
                                <h5 class="text-primary fw-bold mb-2">${new Intl.NumberFormat("vi-VN").format(sp.GiaBan)}đ</h5>
                                <p class="small text-muted mb-0"><i class="fa-solid fa-fire text-danger me-1"></i>Đã bán: ${sp.TongDaBan || 0}</p> 
                            </div>
                        </a>    
                    </div>
                </div>
            `;
      })
      .join("");

    if (paginationContainer) {
      renderPaginationUI(
        paginationContainer,
        totalPages,
        currentBestSellerPage,
        async (targetPage) => {
          await loadBestSellers(targetPage);
          container.scrollIntoView({ behavior: "smooth" });
        },
      );
    }
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm bán chạy:", error);
    container.innerHTML = `<p class="text-center text-danger">Không thể tải dữ liệu.</p>`;
  }
}

// ─── 3. HÀM TỰ ĐỘNG DỰNG GIAO DIỆN THANH PHÂN TRANG ───
function renderPaginationUI(container, totalPages, currentPage, onPageChange) {
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<ul class="pagination pagination-sm justify-content-center mt-3 shadow-sm rounded-pill p-1 bg-white" style="width: fit-content; margin: 0 auto; list-style: none; display: flex; align-items: center;">`;

  // Nút Quay lại (Previous)
  html += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link page-item-link border-0 rounded-circle me-1 d-flex align-items-center justify-content-center" href="#" data-page="${currentPage - 1}" style="width: 32px; height: 32px;"><i class="fa-solid fa-chevron-left"></i></a>
        </li>
    `;

  // Các nút số trang cụ thể
  for (let i = 1; i <= totalPages; i++) {
    const isActive = currentPage === i;
    html += `
            <li class="page-item ${isActive ? "active" : ""}">
                <a class="page-link page-item-link border-0 rounded-circle mx-1 fw-bold d-flex align-items-center justify-content-center ${isActive ? "bg-primary text-white shadow-sm" : "text-secondary"}" 
                   href="#" data-page="${i}" style="width: 32px; height: 32px; font-size: 0.85rem;">${i}</a>
            </li>
        `;
  }

  // Nút Kế tiếp (Next)
  html += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link page-item-link border-0 rounded-circle ms-1 d-flex align-items-center justify-content-center" href="#" data-page="${currentPage + 1}" style="width: 32px; height: 32px;"><i class="fa-solid fa-chevron-right"></i></a>
        </li>
    `;
  html += `</ul>`;

  container.innerHTML = html;

  container.querySelectorAll(".page-item-link").forEach((link) => {
    link.onclick = function (e) {
      e.preventDefault();
      const targetPage = parseInt(this.getAttribute("data-page"));
      if (
        !isNaN(targetPage) &&
        targetPage !== currentPage &&
        targetPage > 0 &&
        targetPage <= totalPages
      ) {
        onPageChange(targetPage);
      }
    };
  });
}

// Hàm khởi tạo danh mục
async function renderCategoryButtons() {
  try {
    const res = await fetch(`${BASE_URL}/categories`);
    const categories = await res.json();
    const filterContainer = document.getElementById("category-filter");
    if (!filterContainer) return;

    filterContainer.innerHTML = "";
    const btnAll = document.createElement("button");
    btnAll.className = "btn filter-btn active";
    btnAll.innerText = "Tất cả";
    btnAll.dataset.id = "all";
    btnAll.onclick = function () {
      updateActiveButton(this);
      loadProducts("all", 1);
    };
    filterContainer.appendChild(btnAll);

    if (categories && Array.isArray(categories)) {
      categories.forEach((dm) => {
        const btn = document.createElement("button");
        btn.className = "btn filter-btn";
        btn.innerText = dm.TenDanhMuc;
        btn.dataset.id = dm.MaDanhMuc;

        btn.onclick = function () {
          updateActiveButton(this);
          const id = this.dataset.id;
          loadProducts(id, 1);
        };
        filterContainer.appendChild(btn);
      });
    }
  } catch (err) {
    console.error("Lỗi tải danh mục:", err);
  }
}

function updateActiveButton(activeBtn) {
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.remove("active"));
  activeBtn.classList.add("active");
}

// Khởi chạy đồng thời tăng tốc độ tải
document.addEventListener("DOMContentLoaded", () => {
  Promise.all([
    loadBestSellers(1),
    renderCategoryButtons(),
    loadProducts("all", 1),
    searchProducts(),
  ]).catch((err) => console.error("Lỗi khởi tạo ứng dụng:", err));
});
