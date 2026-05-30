// src/JS/checkout.js

import Swal from "sweetalert2";

const MY_ACCOUNT = "0934135205";
const DEFAULT_IMAGE = "/img/default.jpg";
let baseTotalMoney = 0;
import { BASE_URL } from "/src/JS/common/header";

// THÔNG TIN TÀI KHOẢN NGÂN HÀNG CỦA SHOP (Cấu hình để sinh VietQR)
const BANK_CONFIG = {
  bankId: "mbbank", // Tên viết tắt của ngân hàng (vcb, mbbank, tcb, acb...)
  accountNo: MY_ACCOUNT, // Số tài khoản ngân hàng của bạn
  accountName: "CONG TY HP STORE", // Tên chủ tài khoản
};

document.addEventListener("DOMContentLoaded", () => {
  autofillUserInfo();
  renderCheckoutSummary();

  const shippingOptions = document.querySelectorAll(
    'input[name="shippingMethod"]',
  );
  shippingOptions.forEach((option) => {
    option.addEventListener("change", updateFinalTotalDisplay);
  });

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  }
});

function getCartKey() {
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));
  if (userData && (userData.MaND || userData.id)) {
    return `hpstore_cart_${userData.MaND || userData.id}`;
  }
  return "hpstore_cart_guest";
}

async function autofillUserInfo() {
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));
  if (!userData || !(userData.MaND || userData.id)) {
    resetPlaceholdersToGuest();
    return;
  }
  const maND = userData.MaND || userData.id;
  try {
    const res = await fetch(`${BASE_URL}/account/checkout-info/${maND}`);
    const result = await res.json();
    if (result.success && result.data) {
      const user = result.data;
      if (user.HoTen)
        document.getElementById("checkout-fullname").value = user.HoTen;
      if (user.SDT) document.getElementById("checkout-phone").value = user.SDT;
      if (user.DiaChi)
        document.getElementById("checkout-address").value = user.DiaChi;
    } else {
      resetPlaceholdersToGuest();
    }
  } catch (error) {
    console.error("Không thể kết nối API lấy thông tin tài khoản:", error);
    resetPlaceholdersToGuest();
  }
}

function resetPlaceholdersToGuest() {
  document.getElementById("checkout-fullname").placeholder =
    "Nhập họ tên người nhận...";
  document.getElementById("checkout-phone").placeholder =
    "Nhập số điện thoại nhận hàng...";
}

function renderCheckoutSummary() {
  const container = document.getElementById("checkout-items-list");
  if (!container) return;

  const cartKey = getCartKey();
  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

  if (cart.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Giỏ hàng trống!",
      text: "Không có sản phẩm nào để thanh toán. Quay lại trang chủ mua sắm nhé!",
      confirmButtonColor: "#6366f1",
    }).then(() => {
      window.location.href = "/index.html";
    });
    return;
  }

  baseTotalMoney = cart.reduce((sum, item) => {
    const gia = parseFloat(item.GiaBan) || 0;
    const qty = parseInt(item.SoLuong) || 0;
    return sum + gia * qty;
  }, 0);

  container.innerHTML = cart
    .map((item) => {
      const gia = parseFloat(item.GiaBan) || 0;
      const qty = parseInt(item.SoLuong) || 0;
      const imgPath =
        item.HinhAnh && item.HinhAnh !== "NULL"
          ? `${BASE_URL}/uploads/products/${item.HinhAnh}`
          : DEFAULT_IMAGE;

      return `
            <div class="d-flex align-items-center gap-3 mb-3">
                <img src="${imgPath}" class="product-checkout-img border" alt="${item.TenSP || "Sản phẩm"}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
                <div class="flex-grow-1 min-w-0">
                    <h6 class="small fw-bold text-dark mb-0 text-truncate" style="max-width: 220px;">${item.TenSP || "Sản phẩm"}</h6>
                    <small class="text-muted">SL: ${qty} x ${gia.toLocaleString("vi-VN")} đ</small>
                </div>
                <span class="small fw-bold text-dark text-end">${(gia * qty).toLocaleString("vi-VN")} đ</span>
            </div>
        `;
    })
    .join("");

  document.getElementById("checkout-subtotal").innerText =
    `${baseTotalMoney.toLocaleString("vi-VN")} đ`;
  updateFinalTotalDisplay();
}

function updateFinalTotalDisplay() {
  const selectedShipElement = document.querySelector(
    'input[name="shippingMethod"]:checked',
  );
  const shipFee = selectedShipElement ? parseInt(selectedShipElement.value) : 0;

  const feeLabel = document.getElementById("checkout-shipping-fee");
  if (feeLabel) {
    if (shipFee === 0) {
      feeLabel.innerText = "Miễn phí";
      feeLabel.className = "fw-bold text-success";
    } else {
      feeLabel.innerText = `${shipFee.toLocaleString("vi-VN")} đ`;
      feeLabel.className = "fw-bold text-dark";
    }
  }

  const finalTotal = baseTotalMoney + shipFee;
  document.getElementById("checkout-total").innerText =
    `${finalTotal.toLocaleString("vi-VN")} đ`;
  return finalTotal;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("checkout-fullname").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const note = document.getElementById("checkout-note").value.trim();
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked',
  ).value;

  if (!name || !phone || !address) {
    Swal.fire({
      icon: "warning",
      title: "Thiếu thông tin nhận hàng",
      text: "Vui lòng cung cấp đầy đủ Tên, Số điện thoại và Địa chỉ giao hàng chính xác!",
      confirmButtonColor: "#6366f1",
    });
    return;
  }

  const cartKey = getCartKey();
  const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  const userData = JSON.parse(localStorage.getItem("hpstore_user")) || {};
  const finalTotalMoney = updateFinalTotalDisplay();

  const checkoutPayload = {
    MaNguoiDung: userData.MaND || userData.id || null,
    GhiChu: note || null,
    NguoiNhan: name,
    SDTNguoiNhan: phone,
    DiaChi: address,
    PhuongThucThanhToan: paymentMethod,
    ChiTiet: cart.map((item) => ({
      MaSP: item.MaSP,
      SoLuong: parseInt(item.SoLuong),
      GiaBan: parseFloat(item.GiaBan),
    })),
  };

  try {
    Swal.fire({
      title: "Đang xử lý đơn hàng...",
      text: "Vui lòng không tắt trình duyệt hoặc tải lại trang.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // 1. Gọi API gửi thông tin tạo đơn hàng lưu xuống Database SQL Server
    const response = await fetch(`${BASE_URL}/checkout/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const createdOrderId = result.maDonHang;

      // 🌟 LUỒNG XỬ LÝ: NẾU KHÁCH CHỌN CHUYỂN KHOẢN NGÂN HÀNG / QR
      if (
        paymentMethod === "CHUYEN_KHOAN" ||
        paymentMethod === "BANK_TRANSFER"
      ) {
        const memo = `HPSTORE DH${createdOrderId}`;
        const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.jpg?amount=${finalTotalMoney}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

        Swal.fire({
          title: "Thanh Toán Chuyển Khoản QR",
          html: `
            <div class="text-center">
              <p class="text-muted small mb-2">Vui lòng quét mã QR dưới đây bằng ứng dụng Ngân hàng (Banking) để thanh toán đơn hàng.</p>
              <div class="p-2 border rounded bg-light d-inline-block mb-3">
                <img src="${qrUrl}" alt="Mã QR Thanh Toán" style="max-width: 240px; width: 100%; height: auto;">
              </div>
              <div class="text-start px-3 py-2 border rounded bg-light" style="font-size: 0.9rem;">
                <div class="mb-1"><b>Ngân hàng:</b> ${BANK_CONFIG.bankId.toUpperCase()}</div>
                <div class="mb-1"><b>Số tài khoản:</b> <span class="text-primary fw-bold">${BANK_CONFIG.accountNo}</span></div>
                <div class="mb-1"><b>Số tiền:</b> <span class="text-danger fw-bold">${finalTotalMoney.toLocaleString("vi-VN")} đ</span></div>
                <div><b>Nội dung chuyển:</b> <span class="text-success fw-bold">${memo}</span></div>
              </div>
              <p class="text-warning small mt-2 mb-0"><i class="fa fa-info-circle"></i> Hệ thống sẽ xác nhận đơn hàng sau khi nhận được tiền.</p>
            </div>
          `,
          showCancelButton: false,
          confirmButtonColor: "#10b981",
          confirmButtonText: "Tôi đã chuyển khoản thành công",
          allowOutsideClick: false,
        }).then((invoiceResult) => {
          if (invoiceResult.isConfirmed) {
            clearCartAndRedirect(cartKey);
          }
        });
      } else {
        // 🌟 LUỒNG XỬ LÝ: NẾU KHÁCH CHỌN COD
        Swal.fire({
          icon: "success",
          title: "Đặt hàng thành công!",
          html: `Cảm ơn bạn đã mua sắm tại HP STORE.<br>Mã đơn hàng của bạn là: <b>${createdOrderId}</b>`,
          confirmButtonColor: "#6366f1",
          confirmButtonText: "Quay lại trang chủ",
        }).then(() => {
          clearCartAndRedirect(cartKey);
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Quá trình đặt hàng thất bại",
        text: result.message || "Có lỗi ngoài ý muốn xảy ra, vui lòng thử lại.",
        confirmButtonColor: "#ef4444",
      });
    }
  } catch (error) {
    console.error("Lỗi API Gửi dữ liệu Checkout:", error);
    Swal.fire({
      icon: "error",
      title: "Lỗi kết nối máy chủ",
      text: "Đường truyền mạng bị gián đoạn, vui lòng thử lại sau!",
      confirmButtonColor: "#ef4444",
    });
  }
}

function clearCartAndRedirect(cartKey) {
  localStorage.removeItem(cartKey);
  const badge = document.getElementById("cart-count");
  if (badge) badge.innerText = "0";

  window.location.href = "/";
}
