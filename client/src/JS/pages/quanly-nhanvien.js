import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
import { BASE_URL } from "/src/JS/common/header";

let employeeModal;
let currentEditId = null; // null: thêm mới, ngược lại: lưu mã ID đang sửa

document.addEventListener("DOMContentLoaded", () => {
  initEmployeeManager();
});

export async function initEmployeeManager() {
  const tableBody = document.getElementById("employeeTableBody");
  const employeeForm = document.getElementById("employeeForm");
  const modalEl = document.getElementById("employeeModal");
  const modalTitle = document.getElementById("modalTitle");
  const btnAddEmployee = document.getElementById("btnAddEmployee");
  const searchInput = document.getElementById("searchEmployee");
  const filterStatus = document.getElementById("filterStatus");
  const totalCount = document.getElementById("totalEmployees");

  const usernameWrapper = document.getElementById("usernameWrapper");
  // Đã loại bỏ biến passwordWrapper do không còn dùng ô nhập mật khẩu nữa

  if (modalEl) employeeModal = new Modal(modalEl);

  // 1. Hàm Tải danh sách từ API backend
  const loadEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/employees`);
      if (res.data.success) {
        renderTable(res.data.data);
        if (totalCount) totalCount.innerText = res.data.data.length;
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách nhân viên:", err);
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Không thể kết nối API danh sách nhân viên</td></tr>`;
    }
  };

  // 2. Hàm Render bảng dữ liệu nhân viên
  const renderTable = (data) => {
    if (data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có nhân viên nào trong hệ thống</td></tr>`;
      return;
    }

    tableBody.innerHTML = data
      .map((nv) => {
        const dateFormatted = nv.ngaytao
          ? new Date(nv.ngaytao).toLocaleDateString("vi-VN")
          : "N/A";
        return `
                <tr>
                    <td class="ps-4"><strong>${nv.mand}</strong></td>
                    <td><span class="badge bg-light text-dark border">${nv.tendangnhap}</span></td>
                    <td><div class="fw-bold text-dark">${nv.hoten || "<i>Chưa cập nhật</i>"}</div></td>
                    <td>
                        <div class="small"><i class="fa-solid fa-phone me-1 text-muted"></i> ${nv.sdt || "N/A"}</div>
                        <div class="small text-muted"><i class="fa-solid fa-envelope me-1"></i> ${nv.email || "N/A"}</div>
                    </td>
                    <td><small class="text-muted">${dateFormatted}</small></td>
                    <td>
                        ${
                          nv.trangthai
                            ? `<span class="badge rounded-pill bg-success-subtle text-success border border-success px-3 py-2">
                                    <i class="fa-solid fa-circle-check me-1"></i> Đang làm việc
                               </span>`
                            : `<span class="badge rounded-pill bg-danger-subtle text-danger border border-danger px-3 py-2">
                                    <i class="fa-solid fa-circle-xmark me-1"></i> Đang bị khóa
                               </span>`
                        }
                    </td>
                    <td class="text-end pe-4">
                        <div class="d-flex justify-content-end gap-2">
                            <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${nv.mand}">
                                <i class="fa-regular fa-pen-to-square"></i> Sửa
                            </button>
                            <button class="btn btn-sm ${nv.trangthai ? "btn-outline-warning" : "btn-outline-success"} btn-toggle-status" data-id="${nv.mand}" data-status="${nv.trangthai}">
                                <i class="fa-solid ${nv.trangthai ? "fa-user-lock" : "fa-user-check"}"></i> ${nv.trangthai ? "Khóa" : "Mở"}
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join("");
  };

  // 3. Hàm reset form về trạng thái ban đầu
  const resetForm = () => {
    employeeForm.reset();
    currentEditId = null;
    modalTitle.innerText = "Thêm Nhân Viên Mới";

    usernameWrapper.style.display = "block";
    document.getElementById("tenDangNhap").required = true;
  };

  if (btnAddEmployee) {
    btnAddEmployee.onclick = () => {
      resetForm();
      employeeModal.show();
    };
  }

  // 4. Tìm kiếm & Lọc trạng thái trực tiếp trên giao diện
  const handleFilter = () => {
    const searchVal = searchInput.value.toLowerCase().trim();
    const statusVal = filterStatus.value;
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      let statusMatch = false;

      if (statusVal === "") {
        statusMatch = true;
      } else if (statusVal === "1") {
        statusMatch = rowText.includes("đang làm việc");
      } else if (statusVal === "0") {
        statusMatch = rowText.includes("đang bị khóa");
      }

      if (rowText.includes(searchVal) && statusMatch) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  };

  if (searchInput) searchInput.oninput = handleFilter;
  if (filterStatus) filterStatus.onchange = handleFilter;

  // 5. Xử lý sự kiện Submit Form (Thêm / Sửa)
  employeeForm.onsubmit = async (e) => {
    e.preventDefault();

    const hoTen = document.getElementById("hoTen").value.trim();
    const sdt = document.getElementById("sdt").value.trim();
    const email = document.getElementById("email").value.trim();

    const baseData = {
      HoTen: hoTen || null,
      SDT: sdt || null,
      Email: email || null,
    };

    try {
      if (currentEditId) {
        // Cập nhật thông tin nhân viên
        await axios.put(`${BASE_URL}/employees/${currentEditId}`, baseData);
        Swal.fire("Thành công", "Đã cập nhật thông tin nhân viên", "success");
      } else {
        // Thêm mới nhân viên
        const TenDangNhap = document.getElementById("tenDangNhap").value.trim();

        // ĐÃ SỬA: Không đọc từ DOM nữa mà truyền thẳng chuỗi cứng '123456' làm mật khẩu mặc định
        const createData = {
          ...baseData,
          TenDangNhap,
          MatKhau: "123456",
        };

        await axios.post(`${BASE_URL}/employees`, createData);
        Swal.fire("Thành công", "Đã tạo tài khoản nhân viên mới", "success");
      }
      employeeModal.hide();
      loadEmployees();
    } catch (err) {
      console.error("Chi tiết lỗi Axios:", err);
      let errorMsg = "Không thể kết nối đến máy chủ hệ thống.";

      if (err.response) {
        console.log("Dữ liệu lỗi từ Server:", err.response.data);
        errorMsg =
          err.response.data.message ||
          err.response.data.error ||
          err.response.data.msg ||
          `Lỗi Server (${err.response.status}): ${err.response.statusText}`;
      } else if (err.request) {
        errorMsg =
          "Hệ thống không nhận được phản hồi từ server. Vui lòng kiểm tra lại Node.js backend!";
      }

      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: errorMsg,
        footer:
          '<small class="text-muted">Mẹo: Nhấn F12, xem tab Console/Network để biết chi tiết câu lệnh lỗi.</small>',
      });
    }
  };

  // 6. Xử lý click sự kiện trên bảng (Sửa & Khóa/Mở tài khoản)
  tableBody.onclick = async (e) => {
    const btnEdit = e.target.closest(".btn-edit");
    const btnToggle = e.target.closest(".btn-toggle-status");

    if (btnEdit) {
      const id = btnEdit.getAttribute("data-id");
      try {
        const res = await axios.get(`${BASE_URL}/employees/${id}`);
        if (res.data.success) {
          const nv = res.data.data;
          currentEditId = nv.mand;

          modalTitle.innerText = `Chỉnh Sửa Nhân Viên: ${nv.mand}`;
          usernameWrapper.style.display = "none";

          document.getElementById("tenDangNhap").required = false;
          // ĐÃ XÓA: dòng set required cho matKhau để tránh lỗi null value

          document.getElementById("hoTen").value = nv.hoten || "";
          document.getElementById("sdt").value = nv.sdt || "";
          document.getElementById("email").value = nv.email || "";

          employeeModal.show();
        }
      } catch (err) {
        Swal.fire("Lỗi", "Không thể lấy thông tin chi tiết nhân viên", "error");
      }
    }

    if (btnToggle) {
      const id = btnToggle.getAttribute("data-id");
      const isCurrentActive =
        btnToggle.getAttribute("data-status") === "true" ||
        btnToggle.getAttribute("data-status") === "1";
      const targetStatus = !isCurrentActive;

      const confirmResult = await Swal.fire({
        title: isCurrentActive
          ? "Xác nhận khóa tài khoản?"
          : "Kích hoạt lại tài khoản?",
        text: isCurrentActive
          ? "Nhân viên bị khóa sẽ không thể đăng nhập vào hệ thống!"
          : "Nhân viên sẽ được khôi phục quyền thao tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: targetStatus ? "#198754" : "#dc3545",
        confirmButtonText: isCurrentActive ? "Đồng ý khóa" : "Đồng ý mở lại",
        cancelButtonText: "Hủy bỏ",
      });

      if (confirmResult.isConfirmed) {
        try {
          await axios.patch(`${BASE_URL}/employees/${id}/toggle-status`, {
            TrangThai: targetStatus,
          });
          Swal.fire(
            "Thành công!",
            targetStatus
              ? "Đã kích hoạt lại tài khoản."
              : "Đã khóa tài khoản thành công.",
            "success",
          );
          loadEmployees();
        } catch (err) {
          Swal.fire(
            "Thất bại",
            err.response?.data?.message || "Không thể thực thi lệnh",
            "error",
          );
        }
      }
    }
  };

  loadEmployees();
}
