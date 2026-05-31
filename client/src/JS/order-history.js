import axios from "axios";
import { BASE_URL } from "./common/header";
import Swal from "sweetalert2";

const DEFAULT_IMAGE = "/img/default.jpg";
let globalOrdersArray = [];

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("hpstore_user"));

  if (!userData || !userData.token) {
    Swal.fire({
      title: "Quyền truy cập!",
      text: "Bạn cần đăng nhập hệ thống để xem lịch sử đơn hàng.",
      icon: "warning",
      confirmButtonColor: "#6f42c1",
    }).then(() => {
      window.location.href = "/src/pages/login.html";
    });
    return;
  }

  if (userData.name) {
    document.getElementById("sidebar-user-name").innerText = userData.name;
  }

  // Khởi động tiến trình gọi API
  loadOrderHistoryFromServer(userData.token);
  setupFilterEvents();
});

// Hiệu ứng Skeleton Loading giúp giao diện mượt mà hơn
function showSkeletonLoading() {
  const listContainer = document.getElementById("order-history-list");
  listContainer.innerHTML = Array(2)
    .fill(0)
    .map(
      () => `
    <div class="card mb-3 border-0 shadow-sm placeholder-glow" style="border-radius: 16px;">
      <div class="card-header bg-light p-3 d-flex justify-content-between align-items-center">
        <div class="col-3 placeholder bg-secondary opacity-20 py-2 rounded"></div>
        <div class="col-2 placeholder bg-secondary opacity-20 py-2 rounded"></div>
      </div>
      <div class="card-body p-3">
        <div class="d-flex align-items-center gap-3">
          <div class="placeholder bg-secondary opacity-20 rounded" style="width: 65px; height: 65px;"></div>
          <div class="w-70">
            <div class="col-6 placeholder bg-secondary opacity-20 py-2 mb-2 rounded"></div>
            <div class="col-4 placeholder bg-secondary opacity-20 py-1 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

// Hàm chính lấy danh sách hóa đơn từ Server
async function loadOrderHistoryFromServer(token) {
  showSkeletonLoading(); // Kích hoạt loading ngay khi gọi hàm

  try {
    const response = await axios.get(`${BASE_URL}/orderHistory/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = response.data;

    if (!result.success) {
      throw new Error(result.message || "Lỗi kết nối API máy chủ.");
    }

    globalOrdersArray = result.data || [];

    updateSidebarCounters(globalOrdersArray);
    renderOrdersToUI(globalOrdersArray);
  } catch (error) {
    console.error("Lỗi:", error);
    document.getElementById("order-history-list").innerHTML = `
      <div class="alert alert-danger border-0 shadow-sm p-4 rounded-4" role="alert">
          <i class="fa-solid fa-triangle-exclamation me-2 fs-5"></i>
          Có lỗi xảy ra trong quá trình kết nối dữ liệu hóa đơn. Vui lòng tải lại trang!
      </div>
    `;
  }
}

function updateSidebarCounters(orders) {
  document.getElementById("count-all").innerText = orders.length;
  document.getElementById("count-pending").innerText = orders.filter(
    (o) => o.trangthai === "Chờ xác nhận",
  ).length;
  document.getElementById("count-processing").innerText = orders.filter(
    (o) => o.trangthai === "Đang xử lý",
  ).length;
  document.getElementById("count-shipping").innerText = orders.filter(
    (o) => o.trangthai === "Đang giao",
  ).length;
  document.getElementById("count-success").innerText = orders.filter(
    (o) => o.trangthai === "Thành công",
  ).length;
  document.getElementById("count-canceled").innerText = orders.filter(
    (o) => o.trangthai === "Đã hủy",
  ).length;
}

function setupFilterEvents() {
  const filterItems = document.querySelectorAll(
    "#status-filter-group .filter-link-item",
  );

  filterItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      filterItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      const selectedStatus = item.getAttribute("data-status");

      if (selectedStatus === "Tất cả") {
        renderOrdersToUI(globalOrdersArray);
      } else {
        const statusToFilter =
          selectedStatus === "Đã giao" ? "Thành công" : selectedStatus;
        const filtered = globalOrdersArray.filter(
          (order) => order.trangthai === statusToFilter,
        );
        renderOrdersToUI(filtered);
      }
    });
  });
}

// Hàm duyệt mảng dữ liệu và tạo cấu trúc HTML
function renderOrdersToUI(ordersList) {
  const listContainer = document.getElementById("order-history-list");
  const textTotal = document.getElementById("total-display-text");

  textTotal.innerText = `Tìm thấy ${ordersList.length} đơn hàng tương ứng`;

  if (ordersList.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-5 bg-white rounded-4 shadow-sm border-0">
          <i class="fa-solid fa-receipt text-muted mb-3" style="font-size: 3.5rem; opacity: 0.4;"></i>
          <h5 class="text-secondary fw-semibold">Không tìm thấy đơn hàng nào!</h5>
          <p class="text-muted small">Trạng thái này hiện tại chưa phát sinh dữ liệu mua sắm của bạn.</p>
          <a href="/" class="btn text-white mt-2 px-4 py-2" style="background-color: #6f42c1; border-radius: 10px;">Tiếp tục mua sắm</a>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = ordersList
    .map((order) => {
      const formatNgay = new Date(order.ngaydat).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      let statusBadgeHTML = "";

      // 🟢 ĐÃ THAY ĐỔI: Khởi tạo chuỗi rỗng mặc định cho khu vực nút hành động
      let actionButtonsHTML = "";

      switch (order.trangthai) {
        case "Chờ xác nhận":
          statusBadgeHTML = `<span class="badge-status status-pending" style="background-color: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem;"><i class="fa-solid fa-clock-rotate-left"></i> Chờ xác nhận</span>`;
          break;
        case "Đang xử lý":
          statusBadgeHTML = `<span class="badge-status status-processing" style="background-color: #e1f5fe; color: #0288d1; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý</span>`;
          break;
        case "Đang giao":
          statusBadgeHTML = `<span class="badge-status status-shipping" style="background-color: #e3f2fd; color: #0d6efd; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem;"><i class="fa-solid fa-truck-fast"></i> Đang giao hàng</span>`;
          break;
        case "Thành công":
          statusBadgeHTML = `<span class="badge-status status-success" style="background-color: #e8f5e9; color: #1b5e20; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem;"><i class="fa-solid fa-circle-check"></i> Thành công</span>`;
          // Chỉ giữ lại nút Xuất hóa đơn cho đơn hàng thành công
          actionButtonsHTML = `
            <button class="btn btn-success px-3 text-white" style="border-radius: 8px;" onclick="viewInvoice('${order.madonhang}')">
                <i class="fa-solid fa-file-invoice me-1"></i> Xuất hóa đơn
            </button>
          `;
          break;
        case "Đã hủy":
          statusBadgeHTML = `<span class="badge-status status-canceled" style="background-color: #ffebee; color: #c62828; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem;"><i class="fa-solid fa-circle-xmark"></i> Đã hủy bỏ</span>`;
          break;
        default:
          statusBadgeHTML = `<span class="badge-status bg-secondary text-white">${order.trangthai}</span>`;
      }

      const productsHTML = (order.sanpham || [])
        .map((item) => {
          const hasValidImg =
            item.hinhanh &&
            item.hinhanh.trim() !== "" &&
            item.hinhanh !== "NULL";
          const pathImg = hasValidImg
            ? `https://qlbh-project.onrender.com/uploads/products/${item.hinhanh}`
            : DEFAULT_IMAGE;

          const priceFormatted = (Number(item.giaban) || 0).toLocaleString(
            "vi-VN",
          );

          return `
          <div class="row align-items-center py-3 mx-0 border-bottom last-border-none">
              <div class="col-auto">
                  <img src="${pathImg}" class="product-thumbnail" alt="product" style="width:65px; height:65px; object-fit:contain;" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}';">
              </div>
              <div class="col">
                  <h6 class="fw-bold text-dark mb-1">${item.tensp || "Sản phẩm không rõ tên"}</h6>
                  <div class="d-flex align-items-center gap-3 text-muted small">
                      <span>Mã SP: <strong class="text-secondary">${item.masp}</strong></span>
                      <span>Số lượng: <strong class="text-dark">${item.soluong}</strong></span>
                  </div>
              </div>
              <div class="col-auto text-end">
                  <span class="fw-bold text-dark">${priceFormatted} đ</span>
              </div>
          </div>
        `;
        })
        .join("");

      const hopLeGhiChu =
        order.ghichu && order.ghichu !== "NULL" && order.ghichu.trim() !== "";
      const totalAmountFormatted = (Number(order.tongtien) || 0).toLocaleString(
        "vi-VN",
      );

      return `
        <div class="card order-container-card mb-3 shadow-sm border-0" style="border-radius: 14px; overflow: hidden;">
            <div class="order-card-header d-flex flex-wrap justify-content-between align-items-center gap-2 p-3 bg-light">
                <div>
                    <span class="text-muted small d-block">MÃ ĐƠN HÀNG</span>
                    <h6 class="fw-bold text-primary mb-0">${order.madonhang}</h6>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="text-md-end">
                        <span class="text-muted small d-block">NGÀY ĐẶT</span>
                        <small class="fw-medium text-dark">${formatNgay}</small>
                    </div>
                    ${statusBadgeHTML}
                </div>
            </div>

            <div class="p-2 bg-white">
                ${productsHTML}
            </div>

            <div class="order-card-footer d-flex flex-wrap justify-content-between align-items-center gap-3 p-3 bg-light border-top">
                <div class="text-muted small">
                    ${hopLeGhiChu ? `<i class="fa-regular fa-comment-dots me-1"></i> Ghi chú: ${order.ghichu}` : ""}
                </div>
                <div class="d-flex align-items-center gap-4">
                    <div class="text-end">
                        <span class="text-muted small d-block">TỔNG SỐ TIỀN</span>
                        <span class="fs-4 fw-bold text-danger">${totalAmountFormatted} đ</span>
                    </div>
                    <div class="d-flex align-items-center">
                        ${actionButtonsHTML}
                    </div>
                </div>
            </div>
        </div>
      `;
    })
    .join("");
}

// HÀM XỬ LÝ BẬT POPUP XEM HÓA ĐƠN ĐIỆN TỬ
window.viewInvoice = function (maDonHang) {
  const order = globalOrdersArray.find((o) => o.madonhang === maDonHang);
  if (!order) return;

  const modalBody = document.getElementById("invoice-modal-body");

  modalBody.innerHTML = `
    <div id="invoice-print-area" class="p-4" style="font-family: 'Segoe UI', Roboto, sans-serif; background: #fff;">
      <div class="text-center mb-4">
        <h4 class="fw-bold text-uppercase tracking-wide m-0" style="color: #6f42c1;">HP STORE</h4>
        <small class="text-muted">Đẳng cấp công nghệ - Trải nghiệm đỉnh cao</small>
        <hr class="my-3 opacity-50">
      </div>
      
      <div class="row g-2 small mb-4 text-dark">
        <div class="col-6"><strong>Mã hóa đơn:</strong> HD-${order.madonhang}</div>
        <div class="col-6 text-end"><strong>Ngày xuất:</strong> ${new Date().toLocaleDateString("vi-VN")}</div>
        <div class="col-12"><strong>Mã đơn hàng liên kết:</strong> ${order.madonhang}</div>
        <div class="col-12"><strong>Trạng thái giao dịch:</strong> <span class="text-success fw-bold"><i class="fa-solid fa-shield-check"></i> Đã thanh toán</span></div>
      </div>

      <table class="table table-sm table-borderless small mb-4">
        <thead>
          <tr class="border-bottom text-muted">
            <th>Tên sản phẩm</th>
            <th class="text-center">SL</th>
            <th class="text-end">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(order.sanpham || [])
            .map(
              (item) => `
            <tr class="border-bottom-subtle">
              <td style="padding: 8px 0;">${item.tensp}</td>
              <td class="text-center" style="padding: 8px 0;">${item.soluong}</td>
              <td class="text-end fw-medium" style="padding: 8px 0;">${(Number(item.giaban) || 0).toLocaleString("vi-VN")} đ</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="border-top pt-3 text-end">
        <span class="text-muted small d-block">TỔNG TIỀN THANH TOÁN</span>
        <h3 class="fw-bold text-danger m-0">${(Number(order.tongtien) || 0).toLocaleString("vi-VN")} đ</h3>
      </div>
      
      <div class="text-center mt-5 text-muted small">
        <p class="fst-italic mb-1">Cảm ơn quý khách đã tin tưởng và mua sắm tại HP STORE!</p>
        <small style="font-size: 10px;">(Hóa đơn điện tử được khởi tạo tự động dựa trên giao dịch hợp lệ)</small>
      </div>
    </div>
  `;

  const btnDownload = document.getElementById("btn-download-pdf");
  btnDownload.onclick = function () {
    const element = document.getElementById("invoice-print-area");

    const options = {
      margin: 10,
      filename: `HoaDon_HPSTORE_${order.madonhang}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(options).from(element).save();
  };

  const invoiceModal = new bootstrap.Modal(
    document.getElementById("invoiceModal"),
  );
  invoiceModal.show();
};
