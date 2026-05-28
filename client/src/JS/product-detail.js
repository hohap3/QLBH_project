const BASE_URL = "http://localhost:3000/api";
const IMAGE_BASE_URL = "http://localhost:3000/uploads/products";
const DEFAULT_IMAGE = "/img/default.jpg";
import Swal from "sweetalert2";

let currentProductData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (!productId) {
    alert("Không tìm thấy mã sản phẩm!");
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/productsClient/${productId}`);
    if (!res.ok) throw new Error("Sản phẩm không tồn tại");

    const sp = await res.json();
    currentProductData = sp;

    // Đổ dữ liệu ra các thẻ HTML tương ứng
    document.getElementById("breadcrumb-category").innerText = sp.TenDanhMuc;
    document.getElementById("breadcrumb-product").innerText = sp.TenSP;

    const imgElement = document.getElementById("product-detail-img");
    imgElement.src =
      sp.HinhAnh && sp.HinhAnh !== "NULL"
        ? `${IMAGE_BASE_URL}/${sp.HinhAnh}`
        : DEFAULT_IMAGE;
    imgElement.alt = sp.TenSP;

    document.getElementById("product-detail-category").innerText =
      sp.TenDanhMuc;
    document.getElementById("product-detail-name").innerText = sp.TenSP;
    document.getElementById("product-detail-sold").innerText =
      sp.TongDaBan || 0;
    document.getElementById("product-detail-stock").innerText = sp.SoLuongTon;
    document.getElementById("product-detail-price").innerText =
      `${new Intl.NumberFormat("vi-VN").format(sp.GiaBan)}đ`;
    document.getElementById("product-detail-desc").innerText =
      sp.MoTa || "Chưa có mô tả chi tiết cho sản phẩm này.";

    // Cập nhật trạng thái Kho hàng & Giao diện Nút mua hàng tương ứng
    const statusElement = document.getElementById("product-detail-status");
    const btnAddToCart = document.getElementById("btn-add-to-cart");
    const quantityInput = document.getElementById("quantity-input");

    if (sp.SoLuongTon > 0) {
      statusElement.innerText = "Còn hàng";
      statusElement.className = "text-success fw-bold";
    } else {
      // 1. Cập nhật nhãn thông tin kho
      statusElement.innerText = "Hết hàng";
      statusElement.className = "text-danger fw-bold";

      // 2. Vô hiệu hóa nút bấm giỏ hàng chính
      if (btnAddToCart) {
        btnAddToCart.disabled = true;
        btnAddToCart.innerHTML = `<i class="fa-solid fa-ban me-2"></i>Hết hàng`;
        btnAddToCart.className = "btn btn-secondary w-100 py-3 disabled"; // Chuyển sang màu xám
      }

      // 3. Khóa ô nhập số lượng
      if (quantityInput) {
        quantityInput.value = 0;
        quantityInput.disabled = true;
      }
    }

    document.getElementById("spec-id").innerText = sp.MaSP;
    document.getElementById("spec-category").innerText = sp.TenDanhMuc;
    document.getElementById("spec-vendor").innerText = sp.TenNCC;
    document.getElementById("spec-unit").innerText = sp.DonViTinh || "Cái";

    setupQuantityEvents(sp.SoLuongTon);

    // Chờ tải xong xuôi sản phẩm liên quan rồi mới kích hoạt sự kiện nút bấm giỏ hàng
    await loadRelatedProducts(sp.MaDanhMuc, sp.MaSP);

    setupAddToCartButton();
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra khi tải thông tin sản phẩm!");
  }
});

function setupAddToCartButton() {
  const btnAddToCart = document.getElementById("btn-add-to-cart");
  if (!btnAddToCart || btnAddToCart.disabled) return; // Không gán sự kiện nếu nút đã bị disabled do hết hàng

  btnAddToCart.addEventListener("click", () => {
    if (!currentProductData) return;

    const quantityInput = document.getElementById("quantity-input");
    const selectedQty = parseInt(quantityInput.value) || 1;

    executeAddProductToCart(currentProductData, selectedQty);
  });
}

function executeAddProductToCart(product, quantityToBuy) {
  // Chặn trường hợp cố tình gọi hàm khi hàng trong kho bằng 0
  if (product.SoLuongTon <= 0) {
    Swal.fire(
      "Hết hàng",
      "Sản phẩm này hiện tại đã hết hàng trong kho!",
      "error",
    );
    return;
  }

  const userData = JSON.parse(localStorage.getItem("hpstore_user"));

  if (!userData || !userData.token) {
    Swal.fire({
      title: "Yêu cầu đăng nhập",
      text: "Bạn cần đăng nhập tài khoản thành viên để thêm sản phẩm vào giỏ hàng.",
      icon: "warning",
      confirmButtonText: "Đăng nhập ngay",
      confirmButtonColor: "#6f42c1",
    }).then((result) => {
      if (result.isConfirmed) window.location.href = "/src/pages/login.html";
    });
    return;
  }

  const currentUserId = userData.MaND || userData.id;
  const userCartKey = `hpstore_cart_${currentUserId}`;
  let userCart = JSON.parse(localStorage.getItem(userCartKey)) || [];
  const existIndex = userCart.findIndex((item) => item.MaSP === product.MaSP);

  if (existIndex > -1) {
    const newQty = userCart[existIndex].SoLuong + quantityToBuy;

    if (newQty > product.SoLuongTon) {
      Swal.fire(
        "Vượt quá số lượng",
        `Trong kho chỉ còn tối đa ${product.SoLuongTon} sản phẩm.`,
        "error",
      );
      return;
    }
    userCart[existIndex].SoLuong = newQty;
  } else {
    userCart.push({
      MaSP: product.MaSP,
      TenSP: product.TenSP,
      GiaBan: product.GiaBan,
      HinhAnh: product.HinhAnh,
      SoLuong: quantityToBuy,
    });
  }

  localStorage.setItem(userCartKey, JSON.stringify(userCart));

  Swal.fire({
    title: "Thành công!",
    text: `Đã thêm ${quantityToBuy} sản phẩm vào giỏ hàng thành công.`,
    icon: "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.innerText = userCart.reduce((sum, item) => sum + item.SoLuong, 0);
  }
}

// Xử lý thêm nhanh sản phẩm liên quan ra phạm vi window toàn cục
window.quickAddToCart = function (productStr) {
  try {
    const product = JSON.parse(decodeURIComponent(productStr));
    executeAddProductToCart(product, 1);
  } catch (e) {
    console.error("Lỗi parse dữ liệu sản phẩm liên quan:", e);
  }
};

function setupQuantityEvents(maxStock) {
  const input = document.getElementById("quantity-input");
  const btnDecrease = document.getElementById("btn-decrease");
  const btnIncrease = document.getElementById("btn-increase");

  // Nếu hết hàng thì không gán sự kiện tăng giảm nữa
  if (maxStock <= 0) {
    if (btnDecrease) btnDecrease.onclick = null;
    if (btnIncrease) btnIncrease.onclick = null;
    return;
  }

  btnDecrease.onclick = () => {
    let val = parseInt(input.value) || 1;
    if (val > 1) input.value = val - 1;
  };

  btnIncrease.onclick = () => {
    let val = parseInt(input.value) || 1;
    if (val < maxStock) {
      input.value = val + 1;
    } else {
      alert(`Sản phẩm này hiện chỉ còn tối đa ${maxStock} cái trong kho.`);
    }
  };

  input.onchange = () => {
    let val = parseInt(input.value);
    if (isNaN(val) || val < 1) input.value = 1;
    if (val > maxStock) {
      input.value = maxStock;
      alert(`Sản phẩm này hiện chỉ còn tối đa ${maxStock} cái trong kho.`);
    }
  };
}

async function loadRelatedProducts(categoryId, currentProductId) {
  try {
    const response = await fetch(
      `${BASE_URL}/productsClient/${currentProductId}/related?categoryId=${categoryId}`,
    );
    if (!response.ok) return;

    const relatedProducts = await response.json();
    const container = document.getElementById("related-products-container");
    container.innerHTML = "";

    if (relatedProducts.length === 0) {
      container.innerHTML = `<div class="col-12 text-muted text-center py-4">Không tìm thấy sản phẩm tương tự nào khác trong danh mục này.</div>`;
      return;
    }

    relatedProducts.forEach((sp) => {
      const imgUrl =
        sp.HinhAnh && sp.HinhAnh !== "NULL"
          ? `${IMAGE_BASE_URL}/${sp.HinhAnh}`
          : DEFAULT_IMAGE;

      const targetObjectString = encodeURIComponent(JSON.stringify(sp));

      // 🟢 ĐÃ UPDATE: Kiểm tra sản phẩm liên quan xem còn hàng hay không để đổi trạng thái nút bấm nhanh
      let actionButtonHtml = "";
      if (sp.SoLuongTon > 0) {
        actionButtonHtml = `
          <button class="btn btn-primary w-100 rounded-pill btn-sm py-2" onclick="window.quickAddToCart('${targetObjectString}')">
              <i class="fa fa-shopping-cart me-1" style="font-size: 0.85rem;"></i>Thêm vào giỏ
          </button>`;
      } else {
        actionButtonHtml = `
          <button class="btn btn-secondary w-100 rounded-pill btn-sm py-2 disabled" disabled>
              <i class="fa fa-ban me-1" style="font-size: 0.85rem;"></i>Hết hàng
          </button>`;
      }

      const itemHtml = `
                <div class="col">
                    <div class="card h-100 border-0 shadow-sm" style="border-radius: 15px; overflow: hidden; transition: transform 0.2s;">
                        <a href="product-detail.html?id=${sp.MaSP}" class="text-decoration-none">
                            <div class="text-center p-3" style="background: #fdfdfd; height: 160px; display: flex; align-items: center; justify-content: center;">
                                <img src="${imgUrl}" class="card-img-top p-2" alt="${sp.TenSP}" style="max-height: 100%; object-fit: contain;">
                            </div>
                        </a>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <small class="text-primary fw-bold d-block mb-1" style="font-size: 0.8rem;">${sp.TenDanhMuc}</small>
                                <a href="product-detail.html?id=${sp.MaSP}" class="text-decoration-none text-dark">
                                    <h6 class="card-title text-truncate fw-bold mb-1" style="font-size: 0.95rem;">${sp.TenSP}</h6>
                                </a>
                                <div class="d-flex align-items-center mb-2">
                                    <small class="text-warning me-1" style="font-size:0.7rem;">
                                        <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>
                                    </small>
                                    <small class="text-muted" style="font-size:0.75rem;">(156)</small>
                                </div>
                            </div>
                            <div>
                                <h5 class="text-primary fw-bold mb-2" style="font-size:1.05rem;">${new Intl.NumberFormat("vi-VN").format(sp.GiaBan)}đ</h5>
                                ${actionButtonHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
      container.insertAdjacentHTML("beforeend", itemHtml);
    });
  } catch (error) {
    console.error("Không thể tải khối sản phẩm liên quan:", error);
  }
}
