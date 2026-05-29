const BASE_URL = "https://qlbh-project.onrender.com/api";
const IMAGE_BASE_URL = "https://qlbh-project.onrender.com/uploads/products";
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

    // Đổ dữ liệu ra các thẻ HTML tương ứng (Đồng bộ chữ thường theo Postgres)
    document.getElementById("breadcrumb-category").innerText = sp.tendanhmuc;
    document.getElementById("breadcrumb-product").innerText = sp.tensp;

    const imgElement = document.getElementById("product-detail-img");
    imgElement.src =
      sp.hinhanh && sp.hinhanh !== "NULL" && sp.hinhanh !== ""
        ? `${IMAGE_BASE_URL}/${sp.hinhanh}`
        : DEFAULT_IMAGE;
    imgElement.alt = sp.tensp;

    document.getElementById("product-detail-category").innerText =
      sp.tendanhmuc;
    document.getElementById("product-detail-name").innerText = sp.tensp;
    document.getElementById("product-detail-sold").innerText =
      sp.tongdaban || 0;
    document.getElementById("product-detail-stock").innerText = sp.soluongton;
    document.getElementById("product-detail-price").innerText =
      `${new Intl.NumberFormat("vi-VN").format(sp.giaban)}đ`;
    document.getElementById("product-detail-desc").innerText =
      sp.mota || "Chưa có mô tả chi tiết cho sản phẩm này.";

    // Cập nhật trạng thái Kho hàng & Giao diện Nút mua hàng tương ứng
    const statusElement = document.getElementById("product-detail-status");
    const btnAddToCart = document.getElementById("btn-add-to-cart");
    const quantityInput = document.getElementById("quantity-input");

    if (sp.soluongton > 0) {
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
        btnAddToCart.className = "btn btn-secondary w-100 py-3 disabled";
      }

      // 3. Khóa ô nhập số lượng
      if (quantityInput) {
        quantityInput.value = 0;
        quantityInput.disabled = true;
      }
    }

    document.getElementById("spec-id").innerText = sp.masp;
    document.getElementById("spec-category").innerText = sp.tendanhmuc;
    document.getElementById("spec-vendor").innerText = sp.tenncc;
    document.getElementById("spec-unit").innerText = sp.donvitinh || "Cái";

    setupQuantityEvents(sp.soluongton);

    // Chờ tải xong xuôi sản phẩm liên quan rồi mới kích hoạt sự kiện nút bấm giỏ hàng
    await loadRelatedProducts(sp.madanhmuc, sp.masp);

    setupAddToCartButton();
  } catch (err) {
    console.error(err);
    alert("Có lỗi xảy ra khi tải thông tin sản phẩm!");
  }
});

function setupAddToCartButton() {
  const btnAddToCart = document.getElementById("btn-add-to-cart");
  if (!btnAddToCart || btnAddToCart.disabled) return;

  btnAddToCart.addEventListener("click", () => {
    if (!currentProductData) return;

    const quantityInput = document.getElementById("quantity-input");
    const selectedQty = parseInt(quantityInput.value) || 1;

    executeAddProductToCart(currentProductData, selectedQty);
  });
}

function executeAddProductToCart(product, quantityToBuy) {
  // Chuẩn hóa linh hoạt hỗ trợ cả đối tượng viết hoa hoặc viết thường từ hàm truyền vào
  const stock =
    product.soluongton !== undefined ? product.soluongton : product.SoLuongTon;
  const maSP = product.masp || product.MaSP;
  const tenSP = product.tensp || product.TenSP;
  const giaBan = product.giaban || product.GiaBan;
  const hinhAnh = product.hinhanh || product.HinhAnh;

  // Chặn trường hợp cố tình gọi hàm khi hàng trong kho bằng 0
  if (stock <= 0) {
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
  const existIndex = userCart.findIndex((item) => item.MaSP === maSP);

  if (existIndex > -1) {
    const newQty = userCart[existIndex].SoLuong + quantityToBuy;

    if (newQty > stock) {
      Swal.fire(
        "Vượt quá số lượng",
        `Trong kho chỉ còn tối đa ${stock} sản phẩm.`,
        "error",
      );
      return;
    }
    userCart[existIndex].SoLuong = newQty;
  } else {
    // Giữ nguyên key viết hoa lưu vào LocalStorage để không làm gãy trang Giỏ hàng hiện tại của bạn
    userCart.push({
      MaSP: maSP,
      TenSP: tenSP,
      GiaBan: giaBan,
      HinhAnh: hinhAnh,
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
        sp.hinhanh && sp.hinhanh !== "NULL" && sp.hinhanh !== ""
          ? `${IMAGE_BASE_URL}/${sp.hinhanh}`
          : DEFAULT_IMAGE;

      const targetObjectString = encodeURIComponent(JSON.stringify(sp));

      let actionButtonHtml = "";
      if (sp.soluongton > 0) {
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
                        <a href="product-detail.html?id=${sp.masp}" class="text-decoration-none">
                            <div class="text-center p-3" style="background: #fdfdfd; height: 160px; display: flex; align-items: center; justify-content: center;">
                                <img src="${imgUrl}" class="card-img-top p-2" alt="${sp.tensp}" style="max-height: 100%; object-fit: contain;">
                            </div>
                        </a>
                        <div class="card-body d-flex flex-column justify-content-between">
                            <div>
                                <small class="text-primary fw-bold d-block mb-1" style="font-size: 0.8rem;">${sp.tendanhmuc}</small>
                                <a href="product-detail.html?id=${sp.masp}" class="text-decoration-none text-dark">
                                    <h6 class="card-title text-truncate fw-bold mb-1" style="font-size: 0.95rem;">${sp.tensp}</h6>
                                </a>
                                <div class="d-flex align-items-center mb-2">
                                    <small class="text-warning me-1" style="font-size:0.7rem;">
                                        <i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>
                                    </small>
                                    <small class="text-muted" style="font-size:0.75rem;">(156)</small>
                                </div>
                            </div>
                            <div>
                                <h5 class="text-primary fw-bold mb-2" style="font-size:1.05rem;">${new Intl.NumberFormat("vi-VN").format(sp.giaban)}đ</h5>
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
