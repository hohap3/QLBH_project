// src/JS/pages/kho-hang.js
import axios from "axios";
import Swal from "sweetalert2";

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

  await loadProductsToSelect();
  await fetchWarehouseLogs();

  // Đăng ký các sự kiện tương tác giao diện
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
}

// 1. Tải toàn bộ danh sách lịch sử kho từ API
async function fetchWarehouseLogs() {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/warehouse/transactions",
    );
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

// 2. Render danh sách ra bảng HTML
function renderTable(data) {
  const tbody = document.getElementById("warehouseDataBody");
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Không tìm thấy giao dịch nào phù hợp.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((item) => {
      const isNhap = item.LoaiGD === 1;
      const badgeClass = isNhap
        ? "bg-success-subtle text-success"
        : "bg-danger-subtle text-danger";
      const badgeText = isNhap ? "Nhập kho" : "Xuất kho";
      const prefix = isNhap ? "+" : "-";

      return `
            <tr>
                <td class="fw-bold text-secondary">${item.MaGD}</td>
                <td>
                    <div class="fw-semibold">${item.TenSP}</div>
                    <small class="text-muted">Mã: ${item.MaSP}</small>
                </td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td class="text-end fw-bold ${isNhap ? "text-success" : "text-danger"}">${prefix}${item.SoLuong} ${item.DonViTinh || "Cái"}</td>
                <td class="text-end text-muted">${item.TonTruoc}</td>
                <td class="text-end fw-semibold text-dark">${item.TonSau}</td>
                <td>${new Date(item.NgayGD).toLocaleString("vi-VN")}</td>
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
    const matchesSearch =
      item.MaGD.toLowerCase().includes(searchVal) ||
      item.TenSP.toLowerCase().includes(searchVal) ||
      item.MaSP.toLowerCase().includes(searchVal);
    const matchesLoai =
      filterLoai === "" || item.LoaiGD === parseInt(filterLoai);
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
    const response = await axios.get("http://localhost:3000/api/products"); // Giả định endpoint lấy toàn bộ SP của bạn
    const products = response.data.data || response.data;
    select.innerHTML = products
      .map(
        (p) =>
          `<option value="${p.MaSP}">${p.TenSP} (Hiện tồn: ${p.SoLuongTon})</option>`,
      )
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
  const loaiGD = document.querySelector(
    'input[name="radioLoaiGD"]:checked',
  ).value;
  const soLuong = document.getElementById("numSoLuong").value;

  try {
    const response = await axios.post(
      "http://localhost:3000/api/warehouse/transaction",
      { maGD, maSP, loaiGD, soLuong },
    );
    if (response.data.success) {
      Swal.fire("Thành công", response.data.message, "success");
      document.getElementById("formWarehouseTransaction").reset();
      // Đóng modal thủ công
      const modalEl = document.getElementById("modalTransaction");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
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

  // Định dạng cấu trúc dữ liệu xuất file trực quan cho doanh nghiệp
  const excelData = warehouseList.map((item, index) => ({
    STT: index + 1,
    "Mã Giao Dịch": item.MaGD,
    "Mã Sản Phẩm": item.MaSP,
    "Tên Sản Phẩm": item.TenSP,
    "Loại Giao Dịch": item.LoaiGD === 1 ? "Nhập kho" : "Xuất kho",
    "Số Lượng": item.SoLuong,
    "Đơn Vị Tính": item.DonViTinh || "Cái",
    "Tồn Trước Biến Động": item.TonTruoc,
    "Tồn Sau Biến Động": item.TonSau,
    "Thời Gian Thực Hiện": new Date(item.NgayGD).toLocaleString("vi-VN"),
  }));

  // Tạo một Workbook mới
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo Kho HP STORE");

  // Tự động căn chỉnh chiều rộng của các cột dữ liệu tránh bị khuất chữ
  const max_author = excelData.reduce(
    (w, r) => Math.max(w, r["Tên Sản Phẩm"].length),
    15,
  );
  worksheet["!cols"] = [
    { wch: 6 }, // STT
    { wch: 15 }, // Mã GD
    { wch: 20 }, // Mã SP
    { wch: max_author }, // Tên SP (Co giãn theo độ dài tên dài nhất)
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
