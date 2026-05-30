import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { saveAs } from "file-saver";
import { BASE_URL } from "/src/JS/common/header";

document.addEventListener("DOMContentLoaded", () => {
  initOrderManager();
});

export async function initOrderManager() {
  const orderTableBody = document.getElementById("orderTableBody");
  const orderCountSpan = document.getElementById("orderCount");
  const searchInput = document.querySelector(".search-input");
  const filterSelect = document.querySelector(".filter-select");
  const btnExport = document.querySelector(".btn-export");

  let allOrders = [];

  /**
   * 1. Tải danh sách đơn hàng từ API
   */
  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/orders`);
      allOrders = response.data;

      renderTable(allOrders);
      orderCountSpan.innerText = allOrders.length;
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối",
        text: "Không thể tải danh sách đơn hàng từ máy chủ.",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  /**
   * 2. Hàm render bảng dữ liệu
   */
  const renderTable = (orders) => {
    if (!orders || orders.length === 0) {
      orderTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-5 text-muted">Không tìm thấy đơn hàng nào</td></tr>`;
      return;
    }

    orderTableBody.innerHTML = orders
      .map((order) => {
        // 🟢 SỬA TẠI ĐÂY: Thay thế hoàn toàn bằng hệ thống màu sắc chuẩn Bootstrap 5 + chống vỡ dòng
        let statusBadge = "";
        switch (order.trangthai) {
          case "Chờ xác nhận":
            statusBadge = `<span class="badge bg-warning text-dark rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;">Chờ xác nhận</span>`;
            break;
          case "Đang xử lý":
            statusBadge = `<span class="badge bg-info text-dark rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;">Đang xử lý</span>`;
            break;
          case "Đang giao":
            statusBadge = `<span class="badge bg-primary text-white rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;">Đang giao</span>`;
            break;
          case "Đã giao":
            statusBadge = `<span class="badge bg-success text-white rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;">Đã giao</span>`;
            break;
          case "Thành công":
            statusBadge = `<span class="badge bg-success text-white rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;"><i class="fa-solid fa-circle-check me-1"></i>Thành công</span>`;
            break;
          case "Đã hủy":
            statusBadge = `<span class="badge bg-danger text-white rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;">Đã hủy</span>`;
            break;
          default:
            statusBadge = `<span class="badge bg-secondary text-white rounded-pill px-3 py-2 fw-semibold" style="white-space: nowrap;">${order.trangthai || "Chưa rõ"}</span>`;
        }

        const formattedTotal =
          new Intl.NumberFormat("vi-VN").format(order.tongtien) + "đ";

        const orderDate = order.ngaydat
          ? new Date(order.ngaydat).toISOString().split("T")[0]
          : "---";

        return `
                <tr>
                    <td><a href="#" class="order-id fw-bold text-decoration-none" onclick="viewOrderDetails('${order.madonhang}')">${order.madonhang}</a></td>
                    <td>
                        <div class="fw-bold">${order.tenkhachhang || "Khách vãng lai"}</div>
                        <div class="small text-muted">${order.emailkhachhang || ""}</div>
                    </td>
                    <td class="text-muted">${orderDate}</td>
                    <td>${order.soluongsanpham || 0} sản phẩm</td>
                    <td class="fw-bold text-dark">${formattedTotal}</td>
                    <td class="align-middle">${statusBadge}</td>
                    <td class="text-center">
                        <button class="btn-view" onclick="viewOrderDetails('${order.madonhang}')">
                            <i class="fa-regular fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  };

  /**
   * 3. Xử lý Lọc (Filter) và Tìm kiếm
   */
  const filterData = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const statusTerm = filterSelect.value;

    const filtered = allOrders.filter((order) => {
      const matchSearch =
        order.madonhang.toLowerCase().includes(searchTerm) ||
        (order.tenkhachhang &&
          order.tenkhachhang.toLowerCase().includes(searchTerm));

      const matchStatus =
        statusTerm === "Tất cả" || statusTerm.includes(order.trangthai);

      return matchSearch && matchStatus;
    });

    renderTable(filtered);
  };

  searchInput.addEventListener("input", filterData);
  filterSelect.addEventListener("change", filterData);

  const handleUpdateStatus = async (maDonHang, trangThaiMoi) => {
    let actionText = "";
    let confirmColor = "#0d6efd";

    switch (trangThaiMoi) {
      case "Đang xử lý":
        actionText = "XÁC NHẬN đơn hàng này";
        confirmColor = "#ffc107";
        break;
      case "Đang giao":
        actionText = "duyệt đơn hàng và chuyển sang GIAO HÀNG";
        break;
      case "Đã giao":
        actionText = "xác nhận đơn hàng đã GIAO THÀNH CÔNG đến khách";
        confirmColor = "#198754";
        break;
      case "Thành công":
        actionText =
          "HOÀN THÀNH đơn hàng (Hệ thống sẽ tự động chốt toán và cộng điểm tích lũy)";
        confirmColor = "#198754";
        break;
      case "Đã hủy":
        actionText = "HỦY đơn hàng này";
        confirmColor = "#dc3545";
        break;
      default:
        actionText = `chuyển trạng thái sang ${trangThaiMoi}`;
    }

    const confirmResult = await Swal.fire({
      title: "Xác nhận hành động?",
      text: `Bạn có chắc chắn muốn ${actionText}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Bỏ qua",
    });

    if (!confirmResult.isConfirmed) return;

    Swal.fire({
      title: "Đang xử lý...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.put(`${BASE_URL}/orders/status/${maDonHang}`, {
        TrangThai: trangThaiMoi,
      });

      await Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: `Đơn hàng ${maDonHang} đã chuyển sang trạng thái: ${trangThaiMoi}.`,
        confirmButtonColor: "#0d6efd",
      });

      const currentModal = Modal.getInstance(
        document.getElementById("orderDetailModal"),
      );
      if (currentModal) currentModal.hide();

      fetchOrders();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text:
          error.response?.data?.message ||
          "Không thể cập nhật trạng thái đơn hàng.",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  window.handleUpdateStatus = handleUpdateStatus;

  /**
   * 4. Xem chi tiết đơn hàng
   */
  window.viewOrderDetails = async (maDonHang) => {
    Swal.fire({
      title: "Đang tải...",
      text: `Đang lấy thông tin đơn hàng ${maDonHang}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await axios.get(`${BASE_URL}/orders/${maDonHang}`);
      const order = response.data;
      Swal.close();

      // 🟢 FIX 2: Ở tầng Controller mình đã giữ cấu trúc Object bọc ngoài là chữ hoa (MaDonHang, NgayDat,...)
      // Tuy nhiên ở đây bạn viết nhầm order.ngaydat (chữ thường) khiến hàm Date sập tiếp. Sửa thành order.NgayDat!
      document.getElementById("modalMaDonHang").innerText = order.MaDonHang;
      document.getElementById("modalNgayDat").innerText = order.NgayDat
        ? new Date(order.NgayDat).toISOString().split("T")[0]
        : "---";
      document.getElementById("modalTrangThai").innerText = order.TrangThai;
      document.getElementById("modalGhiChu").innerText =
        order.GhiChu || "Không có";
      document.getElementById("modalTongTien").innerText =
        new Intl.NumberFormat("vi-VN").format(order.TongTien) + "đ";

      // Đổ thông tin khách hàng (Dữ liệu bọc ngoài theo cấu trúc Controller phản hồi)
      document.getElementById("modalKhachHang").innerText =
        order.KhachHang.HoTen || "Khách vãng lai";
      document.getElementById("modalSDT").innerText =
        order.KhachHang.SDT || "---";
      document.getElementById("modalEmail").innerText =
        order.KhachHang.Email || "---";
      document.getElementById("modalDiaChi").innerText =
        order.KhachHang.DiaChi || "---";
      document.getElementById("modalTenDangNhap").innerText =
        order.KhachHang.TenDangNhap || "Không có tài khoản";

      // Đổ danh sách sản phẩm
      const modalProductItems = document.getElementById("modalProductItems");
      if (
        !order.Items ||
        order.Items.length === 0 ||
        order.Items[0].MaSP === null
      ) {
        modalProductItems.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-muted">Đơn hàng không có sản phẩm nào</td></tr>`;
      } else {
        modalProductItems.innerHTML = order.Items.map((item) => {
          // 🟢 FIX 3: Map đúng thuộc tính chữ Hoa của mảng Items từ Controller định nghĩa (MaSP, GiaBan, SoLuong, GiamGia)
          const price = Number(item.GiaBan || 0);
          const quantity = Number(item.SoLuong || 0);
          const discount = Number(item.GiamGia || 0);
          const subTotal = price * quantity - discount;

          return `
                        <tr>
                            <td class="fw-bold text-secondary">${item.MaSP}</td>
                            <td class="text-center fw-bold">${quantity}</td>
                            <td class="text-end">${new Intl.NumberFormat("vi-VN").format(price)}đ</td>
                            <td class="text-end text-success">-${new Intl.NumberFormat("vi-VN").format(discount)}đ</td>
                            <td class="text-end fw-bold text-dark">${new Intl.NumberFormat("vi-VN").format(subTotal)}đ</td>
                        </tr>
                    `;
        }).join("");
      }

      // 5. Điều hướng nút bấm hành động dựa trên trạng thái
      const modalActionButtons = document.getElementById("modalActionButtons");

      switch (
        order.TrangThai // 🟢 FIX 4: Sửa sang order.TrangThai đồng bộ
      ) {
        case "Chờ xác nhận":
          modalActionButtons.innerHTML = `
                        <button class="btn btn-warning text-dark me-2 px-3 fw-bold" onclick="handleUpdateStatus('${order.MaDonHang}', 'Đang xử lý')">
                            <i class="fa-solid fa-bell-concierge me-1"></i> Xác nhận đơn hàng
                        </button>
                        <button class="btn btn-danger px-3" onclick="handleUpdateStatus('${order.MaDonHang}', 'Đã hủy')">
                            <i class="fa-solid fa-xmark me-1"></i> Hủy đơn hàng
                        </button>
                    `;
          break;

        case "Đang xử lý":
          modalActionButtons.innerHTML = `
                        <button class="btn btn-primary me-2 px-3 fw-bold" onclick="handleUpdateStatus('${order.MaDonHang}', 'Đang giao')">
                            <i class="fa-solid fa-truck-fast me-1"></i> Duyệt đơn (Giao hàng)
                        </button>
                        <button class="btn btn-danger px-3" onclick="handleUpdateStatus('${order.MaDonHang}', 'Đã hủy')">
                            <i class="fa-solid fa-xmark me-1"></i> Hủy đơn hàng
                        </button>
                    `;
          break;

        case "Đang giao":
          modalActionButtons.innerHTML = `
                        <button class="btn btn-success me-2 px-3 fw-bold" onclick="handleUpdateStatus('${order.MaDonHang}', 'Đã giao')">
                            <i class="fa-solid fa-box-open me-1"></i> Đã giao hàng
                        </button>
                        <button class="btn btn-danger px-3" onclick="handleUpdateStatus('${order.MaDonHang}', 'Đã hủy')">
                            <i class="fa-solid fa-xmark me-1"></i> Khách hoàn/Hủy đơn
                        </button>
                    `;
          break;

        case "Đã giao":
          modalActionButtons.innerHTML = `
                        <button class="btn btn-success me-2 px-3 fw-bold" style="background-color: #198754;" onclick="handleUpdateStatus('${order.MaDonHang}', 'Thành công')">
                            <i class="fa-solid fa-circle-check me-1"></i> Hoàn thành (Tích điểm)
                        </button>
                    `;
          break;

        default:
          modalActionButtons.innerHTML = "";
          break;
      }

      const myModal = new Modal(document.getElementById("orderDetailModal"));
      myModal.show();
    } catch (error) {
      console.error("Lỗi lấy chi tiết:", error);
      Swal.fire({
        icon: "error",
        title: "Thất bại",
        text: "Không thể lấy thông tin chi tiết đơn hàng.",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  const exportToExcel = async (data) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách đơn hàng");

    worksheet.columns = [
      { header: "Mã đơn hàng", key: "MaDonHang", width: 20 },
      { header: "Khách hàng", key: "TenKhachHang", width: 25 },
      { header: "Email", key: "EmailKhachHang", width: 25 },
      { header: "Ngày đặt", key: "NgayDat", width: 15 },
      { header: "Số lượng SP", key: "SoLuongSanPham", width: 12 },
      { header: "Tổng tiền (VNĐ)", key: "TongTien", width: 15 },
      { header: "Trạng thái", key: "TrangThai", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      name: "Segoe UI",
      bold: true,
      color: { argb: "FFFFFF" },
    };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "00B050" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    data.forEach((order) => {
      // 🟢 FIX 5: Xuất file Excel đọc từ mảng danh sách (Dữ liệu thô từ hàm getAll của Model viết thường hoàn toàn)
      worksheet.addRow({
        MaDonHang: order.madonhang,
        TenKhachHang: order.tenkhachhang || "Khách vãng lai",
        EmailKhachHang: order.emailkhachhang || "",
        NgayDat: order.ngaydat
          ? new Date(order.ngaydat).toISOString().split("T")[0]
          : "",
        SoLuongSanPham: order.soluongsanpham,
        TongTien: order.tongtien,
        TrangThai: order.trangthai,
      });
    });

    worksheet.getColumn("TongTien").numFmt = '#,##0"đ"';

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        if (rowNumber > 1) {
          cell.font = { name: "Segoe UI", size: 11 };
          cell.alignment = { vertical: "middle" };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Bao_cao_don_hang_${new Date().getTime()}.xlsx`);
  };

  /**
   * 5. Xuất báo cáo
   */
  btnExport.onclick = async () => {
    if (allOrders.length === 0) {
      Swal.fire("Thông báo", "Không có dữ liệu để xuất báo cáo!", "info");
      return;
    }

    const result = await Swal.fire({
      title: "Xác nhận xuất báo cáo?",
      text: `Tải xuống file Excel chứa ${allOrders.length} đơn hàng.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00b050",
      confirmButtonText: "Tải xuống",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Đang xử lý...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      try {
        await exportToExcel(allOrders);
        Swal.fire(
          "Thành công!",
          "File đã được lưu vào máy tính của bạn.",
          "success",
        );
      } catch (error) {
        console.error(error);
        Swal.fire("Lỗi", "Có lỗi xảy ra khi tạo file Excel.", "error");
      }
    }
  };

  fetchOrders();
}
