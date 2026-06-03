import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";
import * as bootstrap from "bootstrap";

// Mảng chứa dữ liệu của TRANG HIỆN TẠI để phục vụ việc lọc và xuất file Excel tại chỗ
let currentTableData = [];

// 🟢 BỔ SUNG: Biến quản lý trạng thái phân trang cục bộ
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

  // 🟢 CẬP NHẬT: Kích hoạt mặc định lấy dữ liệu ở Trang 1 khi khởi tạo
  await fetchWarehouseLogs(1);
}

// 1. Tải danh sách lịch sử kho từ API (Hỗ trợ tham số phân trang page)
async function fetchWarehouseLogs(page = 1) {
  try {
    const response = await axios.get(
      `${BASE_URL}/warehouse/transactions?page=${page}`,
    );

    if (response.data.success) {
      // 🟢 CẬP NHẬT: Đọc cấu trúc metadata phân trang mới từ Controller trả về
      const {
        data,
        currentPage: resPage,
        totalPages: resTotalPages,
      } = response.data;

      currentPage = resPage;
      totalPages = resTotalPages;
      currentTableData = data; // 10 bản ghi giao dịch kho của trang này

      renderTable(currentTableData);
      renderPagination(); // Vẽ các nút chuyển trang ra màn hình
    }
  } catch (error) {
    console.error("Lỗi lấy dữ liệu kho:", error);
    document.getElementById("warehouseDataBody").innerHTML = `
        <tr><td colspan="7" class="text-center text-danger">Không thể tải dữ liệu lịch sử kho.</td></tr>
    `;
  }
}

// 2. Render danh sách ra bảng HTML (Giữ nguyên cấu trúc giao diện của bạn)
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
                <td class="text-end fw-bold align-middle ${isNhap ? "text-success" : "text-danger"}">${prefix}${item.soluong} ${item.donvitinh || "Cái"}</td>
                <td class="text-end text-muted align-middle">${item.tontruoc}</td>
                <td class="text-end fw-bold text-dark align-middle">${item.tonsau}</td>
                <td class="align-middle text-muted">${item.ngaygd ? new Date(item.ngaygd).toLocaleString("vi-VN") : "---"}</td>
            </tr>
        `;
    })
    .join("");
}

// 🟢 BỔ SUNG: Hàm render các nút bấm phân trang bằng CSS Bootstrap 5
function renderPagination() {
  const paginationContainer = document.getElementById(
    "warehousePaginationContainer",
  );
  if (!paginationContainer) return;

  // Nếu tổng số trang nhỏ hơn hoặc bằng 1 thì ẩn thanh phân trang đi
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

  // Gắn sự kiện click lắng nghe chuyển trang cho các nút bấm
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

// 3. Xử lý bộ lọc (Lọc cục bộ dựa trên dữ liệu 10 dòng của trang hiện tại)
function applyFilters() {
  const searchVal = document
    .getElementById("searchWarehouse")
    .value.trim()
    .toLowerCase();
  const filterLoai = document.getElementById("filterLoaiGD").value;

  const filtered = currentTableData.filter((item) => {
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
  renderTable(currentTableData);
}

// 4. Lấy danh sách sản phẩm đổ vào thẻ Select trong Modal tạo phiếu kho
async function loadProductsToSelect() {
  const select = document.getElementById("selectProduct");
  if (!select) return;
  try {
    const response = await axios.get(`${BASE_URL}/products`);

    // 🟢 SỬA TẠI ĐÂY: Kiểm tra và trích xuất mảng an toàn tuyệt đối
    let products = [];

    if (response.data && Array.isArray(response.data.data)) {
      // Trường hợp API trả về cấu trúc: { success: true, data: [...] } hoặc có phân trang { data: [...] }
      products = response.data.data;
    } else if (Array.isArray(response.data)) {
      // Trường hợp API trả về thẳng một mảng: [ ... ]
      products = response.data;
    } else if (response.data && typeof response.data === "object") {
      // Đề phòng trường hợp mảng nằm ở một attribute khác hoặc phải ép kiểu
      products = response.data.products || [];
    }

    // Nếu cuối cùng vẫn không tìm thấy mảng hoặc mảng rỗng
    if (products.length === 0) {
      select.innerHTML = `<option value="">-- Không có sản phẩm nào --</option>`;
      return;
    }

    // Tiến hành render khi đã chắc chắn products là một Mảng (Array)
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

// 5. Xử lý gửi Form tạo giao dịch kho mới lên API
async function handleCreateTransaction(e) {
  e.preventDefault();
  const maGD = document.getElementById("txtMaGD").value.trim();
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
    const response = await axios.post(`${BASE_URL}/warehouse/transaction`, {
      maGD,
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

      // 🟢 CẬP NHẬT: Tải lại đúng vị trí trang hiện tại để cập nhật bảng dữ liệu thực tế
      await fetchWarehouseLogs(currentPage);
    }
  } catch (error) {
    Swal.fire(
      "Thao tác lỗi",
      error.response?.data?.message || "Không thể thực hiện giao dịch!",
      "error",
    );
  }
}

// 6. LOGIC XUẤT BÁO CÁO FILE EXCEL (Xuất dữ liệu hiển thị hiện tại của trang đang xem)
function exportToExcel() {
  if (!window.XLSX) {
    Swal.fire(
      "Thông báo",
      "Thư viện xuất Excel đang được nạp, vui lòng thử lại sau giây lát!",
      "info",
    );
    return;
  }

  if (currentTableData.length === 0) {
    Swal.fire("Cảnh báo", "Không có dữ liệu kho để xuất báo cáo!", "warning");
    return;
  }

  // 🟢 CẬP NHẬT: Đọc dữ liệu từ mảng currentTableData của trang này để ghi nhận ra Excel
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
    { wch: 6 }, // STT
    { wch: 15 }, // Mã GD
    { wch: 20 }, // Mã SP
    { wch: max_len + 5 }, // Tên SP
    { wch: 15 }, // Loại GD
    { wch: 10 }, // Số lượng
    { wch: 12 }, // Đơn vị tính
    { wch: 20 }, // Tồn Trước
    { wch: 20 }, // Tồn Sau
    { wch: 25 }, // Thời gian
  ];

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(
    workbook,
    `BaoCao_KhoHang_HPSTORE_Trang${currentPage}_${today}.xlsx`,
  );
}
