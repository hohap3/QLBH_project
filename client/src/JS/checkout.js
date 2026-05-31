import axios from "axios"; // Đồng bộ sử dụng axios giống cart.js nếu cần, hoặc dùng fetch chuẩn hóa
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";

const MY_ACCOUNT = "0934135205";
const DEFAULT_IMAGE = "/img/default.jpg";
let baseTotalMoney = 0; // Tổng tiền sản phẩm gốc
let voucherDiscountAmount = 0; // Số tiền được giảm từ đổi điểm

const BANK_CONFIG = {
  bankId: "mbbank",
  accountNo: MY_ACCOUNT,
  accountName: "CONG TY HP STORE",
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
  if (
    userData &&
    (userData.maND || userData.id || userData.MaND || userData.mand)
  ) {
    return `hpstore_cart_${userData.maND || userData.id || userData.MaND || userData.mand}`;
  }
  return "hpstore_cart_guest";
}

async function autofillUserInfo() {
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));
  const maND =
    userData?.maND || userData?.id || userData?.MaND || userData?.mand;

  if (!maND) {
    resetPlaceholdersToGuest();
    return;
  }

  try {
    // 🟢 FIX 1: Đồng bộ đúng API Route `/user/profile` giống như trang cart.js đã chạy ổn định
    const res = await fetch(`${BASE_URL}/user/profile?id=${maND}`);
    const result = await res.json();

    // Hỗ trợ bóc tách linh hoạt cấu trúc data trả về từ server
    const user = result.data || result;

    if (user) {
      // Khớp chính xác các trường chữ thường từ PostgreSQL trả về
      if (user.hoten || user.HoTen) {
        document.getElementById("checkout-fullname").value =
          user.hoten || user.HoTen;
      }
      if (user.sdt || user.SDT) {
        document.getElementById("checkout-phone").value = user.sdt || user.SDT;
      }
      if (user.diachi || user.DiaChi) {
        document.getElementById("checkout-address").value =
          user.diachi || user.DiaChi;
      }

      if (user.diemtichluy !== undefined) {
        localStorage.setItem("hpstore_user_points", user.diemtichluy);
      }
    } else {
      resetPlaceholdersToGuest();
    }
  } catch (error) {
    console.error("Không thể kết nối API lấy thông tin tài khoản:", error);
    resetPlaceholdersToGuest();
  }
}

function resetPlaceholdersToGuest() {
  const nameEl = document.getElementById("checkout-fullname");
  const phoneEl = document.getElementById("checkout-phone");
  if (nameEl) nameEl.placeholder = "Nhập họ tên người nhận...";
  if (phoneEl) phoneEl.placeholder = "Nhập số điện thoại nhận hàng...";
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
    const gia = parseFloat(item.GiaBan || item.giaban) || 0;
    const qty = parseInt(item.SoLuong || item.soluong) || 0;
    return sum + gia * qty;
  }, 0);

  container.innerHTML = cart
    .map((item) => {
      const gia = parseFloat(item.GiaBan || item.giaban) || 0;
      const qty = parseInt(item.SoLuong || item.soluong) || 0;
      const rawImg = item.hinhanh || item.hinhAnh || item.HinhAnh;
      const tenSP = item.tensp || item.TenSP || "Sản phẩm";

      // 🟢 FIX 2: Chuẩn hóa đường dẫn tránh chuỗi "undefined" rác làm lỗi hiển thị ảnh
      const hasValidImg =
        rawImg && rawImg !== "NULL" && rawImg !== "undefined" && rawImg !== "";
      const imgPath = hasValidImg
        ? `https://qlbh-project.onrender.com/uploads/products/${rawImg}`
        : DEFAULT_IMAGE;

      return `
            <div class="d-flex align-items-center gap-3 mb-3">
                <img src="${imgPath}" class="product-checkout-img border" alt="${tenSP}" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';" style="width:50px; height:50px; object-fit:contain; border-radius: 6px;">
                <div class="flex-grow-1 min-w-0">
                    <h6 class="small fw-bold text-dark mb-0 text-truncate" style="max-width: 220px;">${tenSP}</h6>
                    <small class="text-muted">SL: ${qty} x ${gia.toLocaleString("vi-VN")} đ</small>
                </div>
                <span class="small fw-bold text-dark text-end">${(gia * qty).toLocaleString("vi-VN")} đ</span>
            </div>
        `;
    })
    .join("");

  document.getElementById("checkout-subtotal").innerText =
    `${baseTotalMoney.toLocaleString("vi-VN")} đ`;

  const discountInfo = JSON.parse(
    localStorage.getItem("hpstore_checkout_discount"),
  );
  const discountLabelEl = document.getElementById("checkout-discount-fee");

  if (discountInfo && discountInfo.amount > 0) {
    voucherDiscountAmount = discountInfo.amount;
    if (discountLabelEl) {
      discountLabelEl.innerText = `-${voucherDiscountAmount.toLocaleString("vi-VN")} đ (${discountInfo.percent}%)`;
      discountLabelEl.className = "fw-bold text-danger";
    }
  } else {
    voucherDiscountAmount = 0;
    if (discountLabelEl) discountLabelEl.innerText = "0 đ";
  }

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

  const finalTotal = Math.max(
    0,
    baseTotalMoney + shipFee - voucherDiscountAmount,
  );

  const totalEl = document.getElementById("checkout-total");
  if (totalEl) {
    totalEl.innerText = `${finalTotal.toLocaleString("vi-VN")} đ`;
  }
  return finalTotal;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("checkout-fullname").value.trim();
  const phone = document.getElementById("checkout-phone").value.trim();
  const address = document.getElementById("checkout-address").value.trim();
  const note = document.getElementById("checkout-note").value.trim();
  const paymentElement = document.querySelector(
    'input[name="paymentMethod"]:checked',
  );

  if (!paymentElement) {
    Swal.fire("Thông báo", "Vui lòng chọn phương thức thanh toán!", "warning");
    return;
  }
  const paymentMethod = paymentElement.value;

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

  const discountInfo = JSON.parse(
    localStorage.getItem("hpstore_checkout_discount"),
  ) || { percent: 0, amount: 0, pointsToDeduct: 0 };

  const checkoutPayload = {
    MaNguoiDung:
      userData.maND || userData.id || userData.MaND || userData.mand || null,
    GhiChu: note || null,
    NguoiNhan: name,
    SDTNguoiNhan: phone,
    DiaChi: address,
    PhuongThucThanhToan: paymentMethod,
    PointsToDeduct: discountInfo.pointsToDeduct,
    TongGiamGia: discountInfo.amount,
    ChiTiet: cart.map((item) => {
      const giaBan = parseFloat(item.GiaBan || item.giaban) || 0;
      const soLuong = parseInt(item.SoLuong || item.soluong) || 0;

      let itemDiscount = 0;
      if (discountInfo.percent > 0) {
        itemDiscount = Math.round(giaBan * (discountInfo.percent / 100));
      }

      return {
        MaSP: item.MaSP || item.masp,
        SoLuong: soLuong,
        GiaBan: giaBan,
        GiamGia: itemDiscount,
      };
    }),
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

    const response = await fetch(`${BASE_URL}/checkout/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutPayload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      const createdOrderId = result.maDonHang || result.MaDonHang;

      localStorage.removeItem("hpstore_checkout_discount");

      // 🟢 FIX 3: Chuyển đổi .toUpperCase() để tối ưu kiểm tra chuỗi thanh toán không phân biệt hoa thường
      const methodCheck = paymentMethod.toUpperCase();
      if (
        methodCheck === "CHUYEN_KHOAN" ||
        methodCheck === "BANK_TRANSFER" ||
        methodCheck === "CHUYENKHOAN"
      ) {
        const memo = `HPSTORE DH${createdOrderId}`;
        const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact2.jpg?amount=${finalTotalMoney}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

        Swal.fire({
          title: "Thanh Tán Chuyển Khoản QR",
          html: `
            <div class="text-center">
              <p class="text-muted small mb-2">Vui lòng quét mã QR dưới đây bằng ứng dụng Ngân hàng để thanh toán.</p>
              <div class="p-2 border rounded bg-light d-inline-block mb-3">
                <img src="${qrUrl}" alt="Mã QR Thanh Toán" style="max-width: 240px; width: 100%; height: auto;">
              </div>
              <div class="text-start px-3 py-2 border rounded bg-light" style="font-size: 0.9rem;">
                <div class="mb-1"><b>Ngân hàng:</b> ${BANK_CONFIG.bankId.toUpperCase()}</div>
                <div class="mb-1"><b>Số tài khoản:</b> <span class="text-primary fw-bold">${BANK_CONFIG.accountNo}</span></div>
                <div class="mb-1"><b>Số tiền:</b> <span class="text-danger fw-bold">${finalTotalMoney.toLocaleString("vi-VN")} đ</span></div>
                <div><b>Nội dung chuyển:</b> <span class="text-success fw-bold">${memo}</span></div>
              </div>
              <p class="text-warning small mt-2 mb-0"><i class="fa fa-info-circle"></i> Hệ thống sẽ duyệt đơn tự động khi nhận được tiền.</p>
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
