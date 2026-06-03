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
    if (!data || data.length === 0) {
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

  // 5. Xử lý sự kiện Submit Form (Thêm / Sửa kèm Validation đã tối ưu)
  employeeForm.onsubmit = async (e) => {
    e.preventDefault();

    const inputHoTen = document.getElementById("hoTen");
    const inputSdt = document.getElementById("sdt");
    const inputEmail = document.getElementById("email");
    const inputTenDangNhap = document.getElementById("tenDangNhap");

    const hoTen = inputHoTen.value.trim();
    const sdt = inputSdt.value.trim();
    const email = inputEmail.value.trim();
    let tenDangNhap = "";

    if (!currentEditId) {
      tenDangNhap = inputTenDangNhap.value.trim();
    }

    // --- 🟢 KIỂM TRA RÀNG BUỘC (VALIDATION) ---

    // Điều kiện 1: Kiểm tra rỗng
    if (!currentEditId) {
      if (!tenDangNhap || !hoTen || !sdt || !email) {
        Swal.fire(
          "Cảnh báo",
          "Vui lòng nhập đầy đủ tất cả các trường dữ liệu!",
          "warning",
        );
        return;
      }

      // Tên đăng nhập không được bắt đầu bằng số
      const usernameRegex = /^[^0-9]/;
      if (!usernameRegex.test(tenDangNhap)) {
        Swal.fire(
          "Định dạng sai",
          "Tên đăng nhập không được phép bắt đầu bằng ký tự số!",
          "warning",
        ).then(() => {
          inputTenDangNhap.focus();
          inputTenDangNhap.select();
        });
        return;
      }
    } else {
      if (!hoTen || !sdt || !email) {
        Swal.fire(
          "Cảnh báo",
          "Họ tên, Số điện thoại và Email không được để trống!",
          "warning",
        );
        return;
      }
    }

    // Điều kiện 2: Họ tên chỉ chứa chữ cái tiếng Việt (Sử dụng flag /u cho Unicode chuẩn toàn cầu)
    const nameRegex = /^[\p{L}\s]+$/u;
    if (!nameRegex.test(hoTen)) {
      Swal.fire(
        "Định dạng sai",
        "Họ tên chỉ được điền chữ cái, không chứa số hay ký tự đặc biệt!",
        "warning",
      ).then(() => {
        inputHoTen.focus();
        inputHoTen.select();
      });
      return;
    }

    // Điều kiện 3: Số điện thoại chuẩn 10 chữ số
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(sdt)) {
      Swal.fire(
        "Định dạng sai",
        "Số điện thoại bắt buộc phải bao gồm đúng 10 chữ số!",
        "warning",
      ).then(() => {
        inputSdt.focus();
        inputSdt.select();
      });
      return;
    }

    // Điều kiện 4: Định dạng Email chuẩn quốc tế
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Swal.fire(
        "Định dạng sai",
        "Email không đúng định dạng chuẩn (Ví dụ: abc@gmail.com)!",
        "warning",
      ).then(() => {
        inputEmail.focus();
        inputEmail.select();
      });
      return;
    }

    // --- 🟢 KẾT THÚC KIỂM TRA VALIDATION ---

    const baseData = {
      HoTen: hoTen,
      SDT: sdt,
      Email: email,
    };

    try {
      if (currentEditId) {
        await axios.put(`${BASE_URL}/employees/${currentEditId}`, baseData);
        Swal.fire("Thành công", "Đã cập nhật thông tin nhân viên", "success");
      } else {
        const createData = {
          ...baseData,
          TenDangNhap: tenDangNhap,
          MatKhau: "123456",
        };
        await axios.post(`${BASE_URL}/employees`, createData);
        Swal.fire(
          "Thành công",
          "Đã tạo tài khoản nhân viên mới thành công!",
          "success",
        );
      }
      employeeModal.hide();
      loadEmployees();
    } catch (err) {
      console.error("Chi tiết lỗi Axios:", err);
      let errorMsg = "Không thể kết nối đến máy chủ hệ thống.";
      if (err.response) {
        errorMsg =
          err.response.data.message ||
          err.response.data.error ||
          "Lỗi xử lý nghiệp vụ từ Server.";
      }
      Swal.fire({ icon: "error", title: "Thất bại", text: errorMsg });
    }
  };

  // 6. Xử lý click sự kiện trên bảng (Đã sửa lỗi chống bọt sự kiện lặp lại)
  tableBody.onclick = async (e) => {
    const btnEdit = e.target.closest(".btn-edit");
    const btnToggle = e.target.closest(".btn-toggle-status");

    if (btnEdit) {
      e.stopPropagation(); // 🟢 Sửa lỗi kích hoạt kép hành động
      const id = btnEdit.getAttribute("data-id");
      try {
        const res = await axios.get(`${BASE_URL}/employees/${id}`);
        if (res.data.success) {
          const nv = res.data.data;
          currentEditId = nv.mand;

          modalTitle.innerText = `Chỉnh Sửa Nhân Viên: ${nv.mand}`;
          usernameWrapper.style.display = "none";
          document.getElementById("tenDangNhap").required = false;

          document.getElementById("hoTen").value = nv.hoten || "";
          document.getElementById("sdt").value = nv.sdt || "";
          document.getElementById("email").value = nv.email || "";

          employeeModal.show();
        }
      } catch (err) {
        Swal.fire("Lỗi", "Không thể lấy thông tin chi tiết nhân viên", "error");
      }
      return; // Ngắt luồng xử lý
    }

    if (btnToggle) {
      e.stopPropagation(); // 🟢 Sửa lỗi kích hoạt kép hành động
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
