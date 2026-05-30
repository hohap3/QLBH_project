import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";
import * as bootstrap from "bootstrap";

// Mảng chứa dữ liệu gốc từ API để phục vụ việc lọc và xuất file Excel
let warehouseList = [];

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

  document
    .getElementById("searchWarehouse")
    ?.addEventListener("input", applyFilters);
  document
    .getElementById("filterLoaiGD")
    ?.addEventListener("change", applyFilters);
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
  await fetchWarehouseLogs();
}

// 1. Tải toàn bộ danh sách lịch sử kho từ API
async function fetchWarehouseLogs() {
  try {
    const response = await axios.get(`${BASE_URL}/warehouse/transactions`);
    if (response.data.success) {
      warehouseList = response.data.data;
      renderTable(warehouseList);
    }
  } catch (error) {
    console.error("Lỗi lấy dữ liệu kho:", error);
    document.getElementById("warehouseDataBody").innerHTML = `
            <tr><td colspan="7" class="text-center text-danger">Không thể tải dữ liệu lịch sử kho.</td></tr>
        `;
  }
}

// 2. Render danh sách ra bảng HTML (Đã tối ưu badge và style cho đồng bộ)
function renderTable(data) {
  const tbody = document.getElementById("warehouseDataBody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Không tìm thấy giao dịch nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((item) => {
      // 🟢 Đồng bộ chữ thường theo Postgres: item.loaigd
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
                <td class="text-end fw-bold align-middle ${isNhap ? "text-success" : "text-danger"}">${prefix}${item.soluong} ${item.donvitinh || "Cái"}</td>
                <td class="text-end text-muted align-middle">${item.tontruoc}</td>
                <td class="text-end fw-bold text-dark align-middle">${item.tonsau}</td>
                <td class="align-middle text-muted">${item.ngaygd ? new Date(item.ngaygd).toLocaleString("vi-VN") : "---"}</td>
            </tr>
        `;
    })
    .join("");
}

// 3. Xử lý bộ lọc (Lọc theo tên/mã SP hoặc Loại GD)
function applyFilters() {
  const searchVal = document
    .getElementById("searchWarehouse")
    .value.trim()
    .toLowerCase();
  const filterLoai = document.getElementById("filterLoaiGD").value;

  const filtered = warehouseList.filter((item) => {
    // 🟢 FIX LỖI 1: Chuyển toàn bộ thuộc tính sang chữ thường để đọc đúng dữ liệu Postgres
    const matchesSearch =
      (item.magd && item.magd.toLowerCase().includes(searchVal)) ||
      (item.tensp && item.tensp.toLowerCase().includes(searchVal)) ||
      (item.masp && item.masp.toLowerCase().includes(searchVal));

    const matchesLoai =
      filterLoai === "" || item.loaigd === parseInt(filterLoai);

    return matchesSearch && matchesLoai;
  });

  renderTable(filtered);
}

function resetFilters() {
  document.getElementById("searchWarehouse").value = "";
  document.getElementById("filterLoaiGD").value = "";
  renderTable(warehouseList);
}

// 4. Lấy danh sách sản phẩm đổ vào thẻ Select trong Modal tạo phiếu kho
async function loadProductsToSelect() {
  const select = document.getElementById("selectProduct");
  if (!select) return;
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    const products = response.data.data || response.data;

    // 🟢 FIX LỖI 2: Đảm bảo kiểm tra và map đúng chữ thường/hoa tùy thuộc vào endpoint /products phản hồi
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
  }
}

// 5. Xử lý gửi Form tạo giao dịch kho mới lên API
async function handleCreateTransaction(e) {
  e.preventDefault();
  const maGD = document.getElementById("txtMaGD").value.trim();
  const maSP = document.getElementById("selectProduct").value;
  const loaiGDElement = document.querySelector(
    'input[name="radioLoaiGD"]:checked',
  );
  const soLuong = document.getElementById("numSoLuong").value;

  if (!loaiGDElement) {
    Swal.fire(
      "Thông báo",
      "Vui lòng chọn loại giao dịch (Nhập kho / Xuất kho)!",
      "warning",
    );
    return;
  }

  try {
    const response = await axios.post(`${BASE_URL}/warehouse/transaction`, {
      maGD,
      maSP,
      loaiGD: parseInt(loaiGDElement.value),
      soLuong: parseInt(soLuong),
    });

    if (response.data.success) {
      Swal.fire("Thành công", response.data.message, "success");
      document.getElementById("formWarehouseTransaction").reset();

      // Đóng modal an toàn thông qua Bootstrap Instance
      const modalEl = document.getElementById("modalTransaction");
      if (modalEl) {
        const modal =
          bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
      }

      // Tải lại bảng dữ liệu mới
      await fetchWarehouseLogs();
    }
  } catch (error) {
    Swal.fire(
      "Thao tác lỗi",
      error.response?.data?.message || "Không thể thực hiện giao dịch!",
      "error",
    );
  }
}

// ==========================================
// 🚀 6. LOGIC XUẤT BÁO CÁO FILE EXCEL
// ==========================================
function exportToExcel() {
  if (!window.XLSX) {
    Swal.fire(
      "Thông báo",
      "Thư viện xuất Excel đang được nạp, vui lòng thử lại sau giây lát!",
      "info",
    );
    return;
  }

  if (warehouseList.length === 0) {
    Swal.fire("Cảnh báo", "Không có dữ liệu kho để xuất báo cáo!", "warning");
    return;
  }

  // 🟢 FIX LỖI 3: Chuyển đổi toàn bộ map sang chữ thường để tránh lỗi 'undefined' cột dữ liệu trong Excel
  const excelData = warehouseList.map((item, index) => ({
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

  // Tạo một Workbook mới
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo Kho HP STORE");

  // Tự động căn chỉnh chiều rộng của các cột dữ liệu tránh bị khuất chữ
  const max_len = excelData.reduce(
    (w, r) => Math.max(w, r["Tên Sản Phẩm"] ? r["Tên Sản Phẩm"].length : 15),
    15,
  );

  worksheet["!cols"] = [
    { wch: 6 }, // STT
    { wch: 15 }, // Mã GD
    { wch: 20 }, // Mã SP
    { wch: max_len + 5 }, // Tên SP (Tự động nới rộng thêm 5 khoảng trắng cho đẹp)
    { wch: 15 }, // Loại GD
    { wch: 10 }, // Số lượng
    { wch: 12 }, // Đơn vị tính
    { wch: 20 }, // Tồn Trước
    { wch: 20 }, // Tồn Sau
    { wch: 25 }, // Thời gian
  ];

  // Tiến hành tải file về máy khách hàng
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `BaoCao_KhoHang_HPSTORE_${today}.xlsx`);
}
