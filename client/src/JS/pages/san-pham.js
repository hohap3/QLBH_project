import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
import { BASE_URL } from "/src/JS/common/header";

let editModal;
let addModal;
let viewModal;

// 🔥 Khai báo các biến trạng thái phân trang và tìm kiếm (State)
let currentPage = 1;
const limit = 10;
let currentSearch = "";

export async function initProductManager() {
  // 1. Khởi tạo Modals
  const editModalEl = document.getElementById("editProductModal");
  const addModalEl = document.getElementById("addProductModal");
  const viewModalEl = document.getElementById("viewProductModal");

  if (editModalEl) editModal = new Modal(editModalEl);
  if (addModalEl) addModal = new Modal(addModalEl);
  if (viewModalEl) viewModal = new Modal(viewModalEl);

  // DOM Elements bổ sung hoặc giữ nguyên
  const tableBody = document.getElementById("productTableBody");
  const totalCount = document.getElementById("totalProducts");
  const searchInput = document.getElementById("searchProduct");
  const btnAddProduct = document.getElementById("btnAddProduct");

  // 🔥 DOM Container phục vụ việc hiển thị các nút phân trang (Cần thêm thẻ này ở HTML của bạn nếu chưa có)
  // Ví dụ ở HTML: <nav><ul id="paginationContainer" class="pagination justify-content-end"></ul></nav>
  const paginationContainer = document.getElementById("paginationContainer");

  // Excel Elements
  const btnImportExcel = document.getElementById("btnImportExcel");
  const excelFileInput = document.getElementById("excelFileInput");

  // Forms
  const editForm = document.getElementById("editProductForm");
  const addForm = document.getElementById("addProductForm");

  // --- CÁC HÀM BỔ TRỢ (HELPER FUNCTIONS) ---

  // Ràng buộc dữ liệu đầu vào (Validate Frontend)
  const validateProductData = (tenSP, giaNhap, giaBan) => {
    const trimmedTen = tenSP ? tenSP.trim() : "";

    if (!trimmedTen) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Tên sản phẩm không được để trống!",
        "warning",
      );
      return false;
    }

    if (!trimmedTen.includes(" ")) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Tên sản phẩm phải có đầy đủ các từ và cách nhau bằng dấu cách (Ví dụ: Áo sơ mi, Điện thoại...).",
        "warning",
      );
      return false;
    }

    const numGiaNhap = Number(giaNhap);
    if (isNaN(numGiaNhap) || numGiaNhap < 10000) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Giá nhập sản phẩm phải từ 10.000đ trở lên!",
        "warning",
      );
      return false;
    }

    const numGiaBan = Number(giaBan);
    if (isNaN(numGiaBan) || numGiaBan < 10000) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Giá bán sản phẩm phải từ 10.000đ trở lên!",
        "warning",
      );
      return false;
    }

    if (numGiaBan <= numGiaNhap) {
      Swal.fire(
        "Lỗi chiến lược giá",
        "Giá bán bắt buộc phải lớn hơn giá nhập để đảm bảo lợi nhuận!",
        "warning",
      );
      return false;
    }

    return true;
  };

  // Tải danh mục và nhà cung cấp vào các Select Box
  const loadDropdowns = async () => {
    try {
      const [resDM, resNCC] = await Promise.all([
        axios.get(`${BASE_URL}/categories`),
        axios.get(`${BASE_URL}/suppliers`),
      ]);

      const dmOptions =
        '<option value="" disabled>-- Chọn danh mục --</option>' +
        resDM.data
          .map(
            (dm) => `<option value="${dm.madanhmuc}">${dm.tendanhmuc}</option>`,
          )
          .join("");

      const nccOptions =
        '<option value="" disabled selected>Chọn nhà cung cấp</option>' +
        resNCC.data
          .map((ncc) => `<option value="${ncc.mancc}">${ncc.tenncc}</option>`)
          .join("");

      if (document.getElementById("editMaDanhMuc"))
        document.getElementById("editMaDanhMuc").innerHTML = dmOptions;
      if (document.getElementById("addMaDanhMuc"))
        document.getElementById("addMaDanhMuc").innerHTML = dmOptions;
      if (document.getElementById("addMaNCC"))
        document.getElementById("addMaNCC").innerHTML = nccOptions;
      if (document.getElementById("editMaNCC"))
        document.getElementById("editMaNCC").innerHTML = nccOptions;
    } catch (err) {
      console.error("Lỗi tải dữ liệu danh mục/NCC:", err);
    }
  };

  // Hàm xử lý Preview ảnh
  const setupImagePreview = (fileInputId, imgPreviewId) => {
    const fileInput = document.getElementById(fileInputId);
    const imgPreview = document.getElementById(imgPreviewId);
    if (fileInput && imgPreview) {
      fileInput.onchange = () => {
        const [file] = fileInput.files;
        if (file) {
          imgPreview.src = URL.createObjectURL(file);
        }
      };
    }
  };

  // Render bảng sản phẩm
  const renderProducts = (products) => {
    if (!products || products.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Không tìm thấy sản phẩm nào phù hợp.</td></tr>`;
      return;
    }

    tableBody.innerHTML = products
      .map((sp) => {
        const isOutOfStock = sp.soluongton <= 0;
        const themeClass = !isOutOfStock ? "success" : "danger";
        const statusText = !isOutOfStock ? "Còn hàng" : "Hết hàng";

        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="rounded-3 me-3 d-flex align-items-center justify-content-center bg-light" 
                             style="width: 45px; height: 45px; overflow: hidden; border: 1px solid #eee;">
                            <img src="${sp.hinhanh ? sp.hinhanh : "/assets/images/default-product.png"}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div>
                            <div class="fw-bold mb-0">${sp.tensp}</div>
                            <div class="text-muted small">ID: #${sp.masp}</div>
                        </div>
                    </div>
                </td>
                <td class="text-muted">${sp.tendanhmuc || "Chưa phân loại"}</td>
                <td class="fw-bold">${new Intl.NumberFormat("vi-VN").format(sp.giaban)}đ</td>
                <td><span class="fw-bold text-${themeClass}">${sp.soluongton} sp</span></td>
                <td>
                    <span class="badge bg-${themeClass}-subtle text-${themeClass} px-3 py-2" style="border-radius: 8px;">
                        ${statusText}
                    </span>
                </td>
                <td class="text-end text-nowrap">
                    <button class="btn btn-link text-primary p-1 mx-1 btn-view" data-id="${sp.masp}"><i class="fa-regular fa-eye"></i></button>
                    <button class="btn btn-link text-success p-1 mx-1 btn-edit" data-id="${sp.masp}"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="btn btn-link text-danger p-1 mx-1 btn-delete" data-id="${sp.masp}"><i class="fa-regular fa-trash-can"></i></button>
                </td>
            </tr>`;
      })
      .join("");
  };

  // 🔥 Render thanh phân trang động dựa theo tổng số trang trả về từ Backend
  const renderPagination = (totalPages, currentPage) => {
    if (!paginationContainer) return;
    if (totalPages <= 1) {
      paginationContainer.innerHTML = "";
      return;
    }

    let html = `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <button class="page-link" data-page="${currentPage - 1}">&laquo;</button>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <button class="page-link" data-page="${i}">${i}</button>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <button class="page-link" data-page="${currentPage + 1}">&raquo;</button>
      </li>
    `;

    paginationContainer.innerHTML = html;

    // Lắng nghe sự kiện click chuyển trang
    paginationContainer.querySelectorAll(".page-link").forEach((btn) => {
      btn.onclick = (e) => {
        const targetPage = parseInt(e.target.getAttribute("data-page"));
        if (targetPage && targetPage !== currentPage) {
          currentPage = targetPage;
          loadData();
        }
      };
    });
  };

  // 🔥 Hàm tải dữ liệu đồng bộ cấu trúc phân trang từ Server API
  const loadData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`, {
        params: {
          page: currentPage,
          limit: limit,
          search: currentSearch,
        },
      });

      // Bóc tách cấu trúc mới của API trả về
      const { products, totalItems, totalPages } = res.data;

      renderProducts(products);
      renderPagination(totalPages, currentPage);
      totalCount.innerText = totalItems;
    } catch (err) {
      console.error("Lỗi tải danh sách sản phẩm:", err);
    }
  };

  // --- LẮNG NGHE SỰ KIỆN HỆ THỐNG ---

  // 🔥 Xử lý tìm kiếm Real-time trực tiếp từ Database PostgreSQL bằng chống nhiễu (Debounce) nhẹ
  let searchTimeout;
  searchInput.oninput = (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value;
      currentPage = 1; // Khởi động lại về trang 1 khi lọc từ khóa mới
      loadData();
    }, 400); // Đợi 400ms sau khi dừng gõ phím mới tạo Request để giảm tải server
  };

  // Xử lý sự kiện Import Excel
  if (btnImportExcel && excelFileInput) {
    btnImportExcel.onclick = () => {
      excelFileInput.click();
    };

    excelFileInput.onchange = async () => {
      const file = excelFileInput.files[0];
      if (!file) return;

      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (fileExtension !== "xlsx" && fileExtension !== "xls") {
        Swal.fire(
          "Định dạng không hợp lệ",
          "Vui lòng chọn tệp tin có đuôi định dạng .xlsx hoặc .xls",
          "error",
        );
        excelFileInput.value = "";
        return;
      }

      const formData = new FormData();
      formData.append("excelFile", file);

      try {
        Swal.fire({
          title: "Đang xử lý dữ liệu...",
          text: "Hệ thống đang phân tích dữ liệu từ Excel, vui lòng đợi.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const response = await axios.post(
          `${BASE_URL}/products/import-excel`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        Swal.close();
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: response.data.message || `Đã nhập thành công dữ liệu sản phẩm!`,
          confirmButtonColor: "#198754",
        });

        loadData();
      } catch (err) {
        Swal.close();
        console.error("Lỗi Import file:", err);
        const errMsg =
          err.response?.data?.message ||
          "Không thể phân tích hoặc lưu dữ liệu từ file Excel.";
        Swal.fire("Lỗi đồng bộ", errMsg, "error");
      } finally {
        excelFileInput.value = "";
      }
    };
  }

  // Mở modal thêm sản phẩm
  if (btnAddProduct) {
    btnAddProduct.onclick = () => {
      addForm.reset();
      document.getElementById("addImgPreview").src =
        "/assets/images/default-product.png";
      addModal.show();
    };
  }

  // Xử lý Thêm mới
  if (addForm) {
    addForm.onsubmit = async (e) => {
      e.preventDefault();

      const tenSP = document.getElementById("addTenSP").value;
      const giaNhap = document.getElementById("addGiaNhap").value;
      const giaBan = document.getElementById("addGiaBan").value;

      if (!validateProductData(tenSP, giaNhap, giaBan)) return;

      const formData = new FormData(addForm);

      try {
        await axios.post(`${BASE_URL}/products/add`, formData);
        addModal.hide();
        Swal.fire("Thành công", "Đã thêm sản phẩm mới", "success");
        loadData();
      } catch (err) {
        Swal.fire(
          "Lỗi",
          err.response?.data?.message || "Không thể thêm sản phẩm",
          "error",
        );
      }
    };
  }

  // Xử lý Sửa, Xóa & Xem chi tiết dữ liệu
  tableBody.addEventListener("click", async (e) => {
    const target = e.target.closest("button");
    if (!target) return;
    const id = target.getAttribute("data-id");

    // 1. XEM CHI TIẾT
    if (target.classList.contains("btn-view")) {
      try {
        const res = await axios.get(`${BASE_URL}/products/${id}`);
        const sp = res.data;
        if (sp) {
          document.getElementById("viewMaSP").innerText = sp.masp;
          document.getElementById("viewTenSP").innerText = sp.tensp;
          document.getElementById("viewDanhMuc").innerText =
            sp.tendanhmuc || "Chưa phân loại";
          document.getElementById("viewNhaCungCap").innerText =
            sp.tenncc || "Chưa xác định";
          document.getElementById("viewGiaNhap").innerText =
            new Intl.NumberFormat("vi-VN").format(sp.gianhap) + "đ";
          document.getElementById("viewGiaBan").innerText =
            new Intl.NumberFormat("vi-VN").format(sp.giaban) + "đ";
          document.getElementById("viewSoLuongTon").innerText =
            sp.soluongton + " sản phẩm";
          document.getElementById("viewDonViTinh").innerText =
            sp.donvitinh || "Chưa thiết lập";
          document.getElementById("viewMoTa").innerText =
            sp.mota || "(Không có mô tả sản phẩm)";

          document.getElementById("viewImagePreview").src = sp.hinhanh
            ? sp.hinhanh
            : "/assets/images/default-product.png";

          viewModal.show();
        }
      } catch (err) {
        console.error("Lỗi lấy dữ liệu chi tiết:", err);
        Swal.fire("Lỗi", "Không thể lấy thông tin chi tiết sản phẩm", "error");
      }
    }

    // 2. 🔥 XÓA SẢN PHẨM (Hiển thị thông báo chi tiết trả về từ Backend)
    if (target.classList.contains("btn-delete")) {
      const result = await Swal.fire({
        title: "Xác nhận xóa?",
        text: "Dữ liệu sẽ không thể khôi phục!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Xóa ngay",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        try {
          await axios.delete(`${BASE_URL}/products/delete/${id}`);
          Swal.fire("Đã xóa!", "Sản phẩm đã được gỡ khỏi hệ thống.", "success");
          loadData();
        } catch (err) {
          console.error("Lỗi khi xóa:", err);
          // 🔥 Bóc tách câu thông báo nghiệp vụ chi tiết từ Server phản hồi (Chặn xóa do dính đơn hàng)
          const errorMessage =
            err.response?.data?.message ||
            "Không thể thực hiện lệnh xóa sản phẩm này.";
          Swal.fire("Không thể xóa!", errorMessage, "error");
        }
      }
    }

    // 3. ĐỔ DỮ LIỆU SỬA
    if (target.classList.contains("btn-edit")) {
      try {
        const res = await axios.get(`${BASE_URL}/products/${id}`);
        const sp = res.data;
        if (sp) {
          document.getElementById("editMaSP").value = sp.masp;
          document.getElementById("editMaNCC").value = sp.mancc;
          document.getElementById("editTenSP").value = sp.tensp;
          document.getElementById("editGiaNhap").value = sp.gianhap;
          document.getElementById("editGiaBan").value = sp.giaban;
          document.getElementById("editSoLuongTon").value = sp.soluongton;
          document.getElementById("editMoTa").value = sp.mota || "";
          document.getElementById("editDonViTinh").value = sp.donvitinh || "";
          document.getElementById("editMaDanhMuc").value = sp.madanhmuc;

          document.getElementById("editHinhAnhCu").value = sp.hinhanh || "";
          document.getElementById("editImagePreview").src = sp.hinhanh
            ? sp.hinhanh
            : "/assets/images/default-product.png";

          editModal.show();
        }
      } catch (err) {
        Swal.fire("Lỗi", "Lỗi lấy dữ liệu chi tiết", "error");
      }
    }
  });

  // Xử lý Cập nhật
  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();

      const maSP = document.getElementById("editMaSP").value;
      const tenSP = document.getElementById("editTenSP").value;
      const giaNhap = document.getElementById("editGiaNhap").value;
      const giaBan = document.getElementById("editGiaBan").value;

      if (!validateProductData(tenSP, giaNhap, giaBan)) return;

      // 1. Tạo đối tượng FormData từ chính Form
      const formData = new FormData(editForm);
      const fileInput = document.getElementById("editFileHinhAnh");

      // 2. Kiểm tra xem người dùng có chọn file mới không
      if (!fileInput || !fileInput.files[0]) {
        // Nếu KHÔNG chọn file mới -> Xóa trường file trống đi để tránh lỗi Multer
        formData.delete("HinhAnh");
        // Gửi URL ảnh cũ qua một biến text thường
        formData.append(
          "HinhAnhCu",
          document.getElementById("editHinhAnhCu").value,
        );
      } else {
        // Nếu CÓ chọn file mới -> Đảm bảo key gửi đi là "HinhAnh" trùng khớp với Backend
        formData.delete("HinhAnh"); // Xóa dữ liệu cũ nếu có trùng
        formData.append("HinhAnh", fileInput.files[0]);
      }

      try {
        await axios.put(`${BASE_URL}/products/update/${maSP}`, formData);
        editModal.hide();
        Swal.fire("Thành công", "Đã cập nhật sản phẩm", "success");
        loadData();
      } catch (err) {
        console.error("Lỗi cập nhật frontend:", err);
        // 🔥 Hiện thông báo lỗi chi tiết từ server trả về lên màn hình UI luôn để dễ nhìn
        const serverError =
          err.response?.data?.error || "Không thể cập nhật sản phẩm";
        Swal.fire("Lỗi hệ thống", serverError, "error");
      }
    };
  }

  // --- KHỞI CHẠY LẦN ĐẦU ---
  setupImagePreview("editFileHinhAnh", "editImagePreview");
  setupImagePreview("addFileHinhAnh", "addImgPreview");
  await loadDropdowns();
  await loadData();
}
