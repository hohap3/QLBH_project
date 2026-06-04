import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";
import * as bootstrap from "bootstrap";

// Mảng chứa dữ liệu của TRANG HIỆN TẠI để phục vụ việc xuất file Excel tại chỗ
let currentTableData = [];

// Biến quản lý trạng thái phân trang cục bộ
let currentPage = 1;
let totalPages = 1;

export async function initWarehouseManager() {
  // Tự động tải thư viện SheetJS phục vụ xuất Excel nếu chưa được nạp vào trang
  if (!window.XLSX) {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
    document.head.appendChild(script);
  }

  document
    .getElementById("btnOpenTransactionModal")
    ?.addEventListener("click", () => {
      const modalEl = document.getElementById("modalTransaction");
      if (modalEl) {
        const modal =
          bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
      }
    });

  // 🟢 CẬP NHẬT: Khi đổi bộ lọc sẽ fetch lại từ API thay vì lọc cục bộ 10 dòng
  document
    .getElementById("searchWarehouse")
    ?.addEventListener("input", () => fetchWarehouseLogs(1));
  document
    .getElementById("filterLoaiGD")
    ?.addEventListener("change", () => fetchWarehouseLogs(1));

  document
    .getElementById("btnResetFilter")
    ?.addEventListener("click", resetFilters);
  document
    .getElementById("formWarehouseTransaction")
    ?.addEventListener("submit", handleCreateTransaction);
  document
    .getElementById("btnExportExcel")
    ?.addEventListener("click", exportToExcel);

  await loadProductsToSelect();

  // Kích hoạt mặc định lấy dữ liệu ở Trang 1 khi khởi tạo
  await fetchWarehouseLogs(1);
}

// 1. Tải danh sách lịch sử kho từ API (Hỗ trợ phân trang + Tích hợp bộ lọc loaiGD gửi lên Backend)
async function fetchWarehouseLogs(page = 1) {
  try {
    const filterLoai = document.getElementById("filterLoaiGD")?.value || "";

    // Tạo đường dẫn API động gửi kèm cả page và loaiGD cho Backend xử lý
    let url = `${BASE_URL}/warehouse/transactions?page=${page}`;
    if (filterLoai !== "") {
      url += `&loaiGD=${filterLoai}`;
    }

    const response = await axios.get(url);

    if (response.data.success) {
      const {
        data,
        currentPage: resPage,
        totalPages: resTotalPages,
      } = response.data;

      currentPage = resPage;
      totalPages = resTotalPages;
      currentTableData = data;

      // 🟢 CẬP NHẬT: Áp dụng thanh tìm kiếm (Client-side) trên tập dữ liệu sạch trả về từ API
      const searchVal =
        document
          .getElementById("searchWarehouse")
          ?.value.trim()
          .toLowerCase() || "";
      const displayData = currentTableData.filter((item) => {
        return (
          !searchVal ||
          (item.magd && item.magd.toLowerCase().includes(searchVal)) ||
          (item.tensp && item.tensp.toLowerCase().includes(searchVal)) ||
          (item.masp && item.masp.toLowerCase().includes(searchVal))
        );
      });

      renderTable(displayData);
      renderPagination();
    }
  } catch (error) {
    console.error("Lỗi lấy dữ liệu kho:", error);
    document.getElementById("warehouseDataBody").innerHTML = `
        <tr><td colspan="7" class="text-center text-danger">Không thể tải dữ liệu lịch sử kho.</td></tr>
    `;
  }
}

// 2. Render danh sách ra bảng HTML
function renderTable(data) {
  const tbody = document.getElementById("warehouseDataBody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy giao dịch nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((item) => {
      const isNhap = item.loaigd === 1;
      const badgeClass = isNhap
        ? "bg-success text-white rounded-pill px-3 py-1 fw-semibold"
        : "bg-danger text-white rounded-pill px-3 py-1 fw-semibold";
      const badgeText = isNhap ? "Nhập kho" : "Xuất kho";
      const prefix = isNhap ? "+" : "-";

      return `
            <tr>
                <td class="fw-bold text-secondary align-middle">${item.magd}</td>
                <td class="align-middle">
                    <div class="fw-semibold text-dark">${item.tensp}</div>
                    <small class="text-muted">Mã: ${item.masp}</small>
                </td>
                <td class="align-middle"><span class="badge ${badgeClass}" style="white-space: nowrap;">${badgeText}</span></td>
                <td class="text-end fw-bold align-middle ${isNhap ? "text-success" : "text-danger"}">${prefix}${item.soluong}</td>
                <td class="text-end text-muted align-middle">${item.donvitinh}</td>
                <td class="text-end text-muted align-middle">${item.tontruoc}</td>
                <td class="text-end fw-bold text-dark align-middle">${item.tonsau}</td>
                <td class="align-middle text-muted">${item.ngaygd ? new Date(item.ngaygd).toLocaleString("vi-VN") : "---"}</td>
            </tr>
        `;
    })
    .join("");
}

// 3. Render các nút bấm phân trang Bootstrap 5
function renderPagination() {
  const paginationContainer = document.getElementById(
    "warehousePaginationContainer",
  );
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let html = `<nav><ul class="pagination pagination-sm mb-0">`;

  // Nút Quay lại (Previous)
  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <button class="page-link" data-page="${currentPage - 1}" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </button>
    </li>
  `;

  // Các nút số trang
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${currentPage === i ? "active" : ""}">
        <button class="page-link" data-page="${i}">${i}</button>
      </li>
    `;
  }

  // Nút Tiếp theo (Next)
  html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <button class="page-link" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </button>
    </li>
  `;

  html += `</ul></nav>`;
  paginationContainer.innerHTML = html;

  // Lắng nghe sự kiện click chuyển trang
  paginationContainer.querySelectorAll(".page-link").forEach((button) => {
    button.addEventListener("click", (e) => {
      const targetPage = parseInt(
        e.currentTarget.getAttribute("data-page"),
        10,
      );
      if (
        targetPage &&
        targetPage !== currentPage &&
        targetPage >= 1 &&
        targetPage <= totalPages
      ) {
        fetchWarehouseLogs(targetPage);
      }
    });
  });
}

// 4. Reset bộ lọc
function resetFilters() {
  document.getElementById("searchWarehouse").value = "";
  document.getElementById("filterLoaiGD").value = "";
  fetchWarehouseLogs(1); // Quay về trang 1 với dữ liệu gốc
}

// 5. Lấy danh sách sản phẩm đổ vào thẻ Select trong Modal
async function loadProductsToSelect() {
  const select = document.getElementById("selectProduct");
  if (!select) return;
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    let products = [];

    if (response.data && Array.isArray(response.data.data)) {
      products = response.data.data;
    } else if (Array.isArray(response.data)) {
      products = response.data;
    } else if (response.data && response.data.products) {
      products = response.data.products;
    }

    if (products.length === 0) {
      select.innerHTML = `<option value="">-- Không có sản phẩm nào --</option>`;
      return;
    }

    select.innerHTML = products
      .map((p) => {
        const maSP = p.masp || p.MaSP;
        const tenSP = p.tensp || p.TenSP;
        const soLuongTon =
          p.soluongton !== undefined ? p.soluongton : p.SoLuongTon || 0;
        return `<option value="${maSP}">${tenSP} (Hiện tồn: ${soLuongTon})</option>`;
      })
      .join("");
  } catch (err) {
    console.error("Không tải được sản phẩm vào ô chọn", err);
    select.innerHTML = `<option value="">-- Lỗi tải danh sách sản phẩm --</option>`;
  }
}

// 6. Xử lý gửi Form tạo giao dịch kho mới (ĐÃ KHỬ BỎ maGD)
async function handleCreateTransaction(e) {
  e.preventDefault();

  // 🟢 ĐÃ XÓA: Dòng bóc tách dữ liệu từ ô nhập txtMaGD cũ!
  const maSP = document.getElementById("selectProduct").value;
  const loaiGDElement = document.querySelector(
    'input[name="radioLoaiGD"]:checked',
  );
  const soLuongRaw = document.getElementById("numSoLuong").value.trim();

  if (!loaiGDElement) {
    Swal.fire(
      "Thông báo",
      "Vui lòng chọn loại giao dịch (Nhập kho / Xuất kho)!",
      "warning",
    );
    return;
  }

  if (soLuongRaw.length > 5) {
    Swal.fire({
      icon: "warning",
      title: "Số lượng quá lớn",
      text: "Số lượng nhập vào vượt quá hạn mức cho phép tối đa (10.000)!",
      confirmButtonColor: "#6138ff",
    });
    return;
  }

  const soLuong = parseInt(soLuongRaw, 10);

  if (isNaN(soLuong) || soLuong <= 0) {
    Swal.fire({
      icon: "warning",
      title: "Lỗi nhập liệu",
      text: "Số lượng giao dịch kho bắt buộc phải là số và lớn hơn 0!",
      confirmButtonColor: "#6138ff",
    });
    return;
  }

  if (soLuong > 10000) {
    Swal.fire({
      icon: "warning",
      title: "Vượt quá hạn mức",
      text: "Số lượng cho mỗi giao dịch không được phép vượt quá 10.000 đơn vị!",
      confirmButtonColor: "#6138ff",
    });
    return;
  }

  try {
    // 🟢 ĐÃ XÓA: Trường maGD khỏi phần body gửi đi. Backend sẽ chịu trách nhiệm tự sinh ngẫu nhiên.
    const response = await axios.post(`${BASE_URL}/warehouse/transaction`, {
      maSP,
      loaiGD: parseInt(loaiGDElement.value, 10),
      soLuong: soLuong,
    });

    if (response.data.success) {
      Swal.fire("Thành công", response.data.message, "success");
      document.getElementById("formWarehouseTransaction").reset();

      const modalEl = document.getElementById("modalTransaction");
      if (modalEl) {
        const modal =
          bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
      }

      // Tải lại dữ liệu ở trang 1 để xem phiếu kho mới tinh vừa được sinh ra
      await fetchWarehouseLogs(1);
    }
  } catch (error) {
    Swal.fire(
      "Thao tác lỗi",
      error.response?.data?.message || "Không thể thực hiện giao dịch!",
      "error",
    );
  }
}

// 7. Xuất file Excel
function exportToExcel() {
  if (!window.XLSX) {
    Swal.fire(
      "Thông báo",
      "Thư viện xuất Excel đang được nạp, vui lòng thử lại sau!",
      "info",
    );
    return;
  }

  if (currentTableData.length === 0) {
    Swal.fire("Cảnh báo", "Không có dữ liệu kho để xuất báo cáo!", "warning");
    return;
  }

  const excelData = currentTableData.map((item, index) => ({
    STT: index + 1,
    "Mã Giao Dịch": item.magd,
    "Mã Sản Phẩm": item.masp,
    "Tên Sản Phẩm": item.tensp || "Chưa rõ",
    "Loại Giao Dịch": item.loaigd === 1 ? "Nhập kho" : "Xuất kho",
    "Số Lượng": item.soluong,
    "Đơn Vị Tính": item.donvitinh || "Cái",
    "Tồn Trước Biến Động": item.tontruoc,
    "Tồn Sau Biến Động": item.tonsau,
    "Thời Gian Thực Hiện": item.ngaygd
      ? new Date(item.ngaygd).toLocaleString("vi-VN")
      : "---",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo Kho HP STORE");

  const max_len = excelData.reduce(
    (w, r) => Math.max(w, r["Tên Sản Phẩm"] ? r["Tên Sản Phẩm"].length : 15),
    15,
  );

  worksheet["!cols"] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 20 },
    { wch: max_len + 5 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
  ];

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(
    workbook,
    `BaoCao_KhoHang_HPSTORE_Trang${currentPage}_${today}.xlsx`,
  );
}
