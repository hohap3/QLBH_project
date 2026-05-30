import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
import { BASE_URL } from "/src/JS/common/header";

document.addEventListener("DOMContentLoaded", () => {
  initCustomerManager();
});

export async function initCustomerManager() {
  const tableBody = document.getElementById("customerTableBody");
  const totalCountSpan = document.getElementById("totalCount");
  const searchInput = document.getElementById("searchKH");

  const avatarColors = [
    "#7c3aed",
    "#db2777",
    "#2563eb",
    "#059669",
    "#ea580c",
    "#1e293b",
  ];

  /**
   * 1. Tải danh sách khách hàng từ API
   */
  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/customers`);
      const customers = response.data;

      renderTable(customers);
      totalCountSpan.innerText = customers.length;
    } catch (error) {
      console.error("Lỗi fetch:", error);
      Swal.fire("Lỗi", "Không thể tải danh sách khách hàng", "error");
    }
  };

  /**
   * 2. Render dữ liệu ra bảng HTML
   */
  const renderTable = (customers) => {
    if (!customers || customers.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không có dữ liệu khách hàng</td></tr>`;
      return;
    }

    tableBody.innerHTML = customers
      .map((kh, index) => {
        const isVip = kh.DiemTichLuy >= 100;
        const donGanNhat = kh.DonGanNhat
          ? new Date(kh.DonGanNhat).toLocaleDateString("vi-VN")
          : "---";
        const bgColor = avatarColors[index % avatarColors.length];
        const firstLetter = kh.HoTen ? kh.HoTen.charAt(0).toUpperCase() : "?";
        const isActive = kh.TrangThai !== false;

        return `
                <tr style="${!isActive ? "opacity: 0.6; background-color: #f8fafc;" : ""}">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle" style="background-color: ${bgColor}">
                                ${firstLetter}
                            </div>
                            <div>
                                <div class="fw-bold mb-0">${kh.HoTen} ${!isActive ? '<span class="badge bg-danger ms-1" style="font-size: 10px;">Bị khóa</span>' : ""}</div>
                                <small class="text-muted">ID: #${kh.MaKH}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="text-muted small">${kh.Email || "<i>Chưa cập nhật</i>"}</div>
                        <div class="fw-medium small">${kh.SDT}</div>
                    </td>
                    <td>
                        <div class="fw-bold text-dark">${kh.TongDonHang || 0} <small class="text-muted">đơn</small></div>
                        <small class="text-success fw-semibold">🪙 ${kh.DiemTichLuy || 0}đ</small>
                    </td>
                    <td>
                        <span class="text-muted small">${donGanNhat}</span>
                    </td>
                    <td>
                        <span class="badge rounded-pill ${isVip ? "badge-vip" : "badge-normal"}">
                            ${isVip ? '<i class="fa-solid fa-crown me-1"></i> VIP' : "Thường"}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn-action btn-view" onclick="viewDetails('${kh.MaKH}')" title="Xem chi tiết & Lịch sử">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                       
                        <button class="btn-action ${isActive ? "btn-lock text-danger" : "btn-unlock text-success"}" 
                                onclick="toggleCustomerStatus('${kh.MaKH}', ${isActive})" 
                                title="${isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}">
                            <i class="fa-solid ${isActive ? "fa-user-slash" : "fa-user-check"}"></i>
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  };

  /**
   * 3. Tìm kiếm khách hàng trực tiếp trên UI
   */
  searchInput.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach((row) => {
      const content = row.innerText.toLowerCase();
      row.style.display = content.includes(keyword) ? "" : "none";
    });
  });

  /**
   * 4. Khóa / Mở khóa tài khoản khách hàng
   */
  window.toggleCustomerStatus = async (maKH, isActive) => {
    const actionText = isActive ? "KHÓA" : "MỞ KHÓA";
    const confirmColor = isActive ? "#ef4444" : "#10b981";

    const result = await Swal.fire({
      title: `Xác nhận ${actionText}?`,
      text: isActive
        ? "Khách hàng này sẽ không thể đăng nhập mua hàng!"
        : "Khách hàng sẽ được khôi phục quyền mua hàng.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Đồng ý, ${actionText}!`,
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`${BASE_URL}/customers/toggle-status/${maKH}`, {
          trangThai: !isActive,
        });
        Swal.fire(
          "Thành công!",
          `Đã ${actionText} tài khoản khách hàng.`,
          "success",
        );
        fetchCustomers();
      } catch (error) {
        Swal.fire(
          "Lỗi",
          error.response?.data?.message || "Không thể thực hiện thao tác này",
          "error",
        );
      }
    }
  };

  /**
   * 5. ✅ NGHIỆP VỤ MỚI: Chỉ điều chỉnh điểm tích lũy cá nhân
   */
  window.adjustPoints = async (maKH) => {
    try {
      const response = await axios.get(`${BASE_URL}/customers/detail/${maKH}`);
      const kh = response.data;

      const { value: newPoints } = await Swal.fire({
        title: "Chỉnh sửa Điểm Tích Lũy",
        text: `Khách hàng: ${kh.HoTen} (Điểm hiện tại: ${kh.DiemTichLuy})`,
        input: "number",
        inputLabel: "Nhập số điểm tích lũy mới",
        inputValue: kh.DiemTichLuy,
        showCancelButton: true,
        confirmButtonText: "Cập nhật điểm",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#eab308", // Màu vàng xu
        inputValidator: (value) => {
          if (!value || parseInt(value) < 0) {
            return "Điểm tích lũy không được để trống và phải lớn hơn hoặc bằng 0!";
          }
        },
      });

      if (newPoints !== undefined) {
        // Tận dụng lại API update nhưng chỉ truyền lên trường cần sửa
        await axios.put(`${BASE_URL}/customers/update/${maKH}`, {
          HoTen: kh.HoTen, // Giữ nguyên thông tin cũ
          SDT: kh.SDT,
          Email: kh.Email,
          DiaChi: kh.DiaChi,
          DiemTichLuy: parseInt(newPoints), // Chỉ thay đổi giá trị này
        });

        Swal.fire(
          "Thành công",
          "Đã cập nhật lại điểm tích lũy cho khách hàng!",
          "success",
        );
        fetchCustomers();
      }
    } catch (error) {
      Swal.fire("Lỗi", "Không thể điều chỉnh điểm tích lũy", "error");
    }
  };

  /**
   * 6. Xem chi tiết & Lịch sử mua hàng
   */
  window.viewDetails = async (maKH) => {
    try {
      const response = await axios.get(`${BASE_URL}/customers/history/${maKH}`);
      const { customer, orders } = response.data;

      let orderRows = `<tr><td colspan="4" class="text-center text-muted py-3">Khách hàng chưa có lịch sử mua hàng</td></tr>`;

      if (orders && orders.length > 0) {
        orderRows = orders
          .map(
            (order) => `
          <tr>
            <td class="fw-bold text-primary">#${order.MaDonHang}</td>
            <td>${new Date(order.NgayDat).toLocaleDateString("vi-VN")}</td>
            <td class="text-end fw-bold">${parseFloat(order.TongTien).toLocaleString("vi-VN")} đ</td>
            <td>
              <span class="badge ${order.TrangThai === "Thành công" ? "bg-success" : order.TrangThai === "Đang giao" ? "bg-warning" : "bg-secondary"}">
                ${order.TrangThai}
              </span>
            </td>
          </tr>
        `,
          )
          .join("");
      }

      document.getElementById("detailModalContent").innerHTML = `
        <div class="row g-3 mb-4 border-bottom pb-3">
          <div class="col-6">
            <p class="mb-1 text-muted small">Khách hàng</p>
            <h5 class="fw-bold text-dark mb-0">${customer.HoTen}</h5>
            <small class="text-muted">Mã: KH_${customer.MaKH}</small>
          </div>
          <div class="col-6 text-end">
            <p class="mb-1 text-muted small">Hạng tài khoản</p>
            <span class="badge rounded-pill ${customer.DiemTichLuy >= 100 ? "bg-warning text-dark" : "bg-light text-dark border"} fw-bold px-3 py-2">
              ${customer.DiemTichLuy >= 100 ? "👑 THÀNH VIÊN VIP" : "THÀNH VIÊN THƯỜNG"}
            </span>
          </div>
          <div class="col-4"><strong>📞 SĐT:</strong> <br>${customer.SDT}</div>
          <div class="col-4"><strong>📧 Email:</strong> <br>${customer.Email || "---"}</div>
          <div class="col-4"><strong>📍 Địa chỉ:</strong> <br>${customer.DiaChi || "Chưa cập nhật"}</div>
        </div>
        
        <h6 class="fw-bold text-secondary mb-3"><i class="fa-solid fa-clock-history me-1"></i> LỊCH SỬ ĐƠN HÀNG GẦN ĐÂY</h6>
        <div class="table-responsive" style="max-height: 250px;">
          <table class="table table-sm table-hover align-middle" style="font-size: 0.9rem;">
            <thead class="table-light sticky-top">
              <tr>
                <th>Mã Đơn</th>
                <th>Ngày Đặt</th>
                <th class="text-end">Tổng Tiền</th>
                <th>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>
        </div>
      `;

      const myModal = new Modal(document.getElementById("customerDetailModal"));
      myModal.show();
    } catch (error) {
      Swal.fire("Lỗi", "Không thể nạp lịch sử mua sắm của khách hàng", "error");
    }
  };

  fetchCustomers();
}
