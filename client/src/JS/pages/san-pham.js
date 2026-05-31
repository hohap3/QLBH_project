import axios from "axios";
import Swal from "sweetalert2";
import { Modal } from "bootstrap";
import { BASE_URL } from "/src/JS/common/header";

let editModal;
let addModal;

export async function initProductManager() {
  // 1. Khởi tạo Modals
  const editModalEl = document.getElementById("editProductModal");
  const addModalEl = document.getElementById("addProductModal");

  if (editModalEl) editModal = new Modal(editModalEl);
  if (addModalEl) addModal = new Modal(addModalEl);

  // Dom Elements
  const tableBody = document.getElementById("productTableBody");
  const totalCount = document.getElementById("totalProducts");
  const searchInput = document.getElementById("searchProduct");
  const btnAddProduct = document.getElementById("btnAddProduct");

  // Khai báo DOM Elements phục vụ tính năng Excel
  const btnImportExcel = document.getElementById("btnImportExcel");
  const excelFileInput = document.getElementById("excelFileInput");

  // Forms
  const editForm = document.getElementById("editProductForm");
  const addForm = document.getElementById("addProductForm");

  // --- CÁC HÀM BỔ TRỢ (HELPER FUNCTIONS) ---

  // 🟢 HÀM VALIDATE DỮ LIỆU SẢN PHẨM (MỚI CẬP NHẬT)
  const validateProductData = (tenSP, giaNhap, giaBan) => {
    const trimmedTen = tenSP ? tenSP.trim() : "";

    // 1. Kiểm tra tên trống hoặc chỉ có dấu cách
    if (!trimmedTen) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Tên sản phẩm không được để trống!",
        "warning",
      );
      return false;
    }

    // 2. Kiểm tra tên sản phẩm bắt buộc phải có dấu cách phân tách từ
    if (!trimmedTen.includes(" ")) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Tên sản phẩm phải có đầy đủ các từ và cách nhau bằng dấu cách (Ví dụ: Áo sơ mi, Điện thoại...).",
        "warning",
      );
      return false;
    }

    // 3. Kiểm tra giá nhập
    const numGiaNhap = Number(giaNhap);
    if (isNaN(numGiaNhap) || numGiaNhap < 10000) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Giá nhập sản phẩm phải từ 10.000đ trở lên!",
        "warning",
      );
      return false;
    }

    // 4. Kiểm tra giá bán
    const numGiaBan = Number(giaBan);
    if (isNaN(numGiaBan) || numGiaBan < 10000) {
      Swal.fire(
        "Lỗi nhập liệu",
        "Giá bán sản phẩm phải từ 10.000đ trở lên!",
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
                             <img src="${sp.hinhanh ? `https://qlbh-project.onrender.com/uploads/products/${sp.hinhanh}` : "/assets/images/default-product.png"}" 
                                style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div>
                            <div class="fw-bold mb-0">${sp.tensp}</div>
                            <div class="text-muted small">ID: #${sp.masp}</div>
                        </div>
                    </div>
                </td>
                <td class="text-muted">${sp.TenDanhMuc || "Chưa phân loại"}</td>
                <td class="fw-bold">${new Intl.NumberFormat("vi-VN").format(sp.giaban)}đ</td>
                <td><span class="fw-bold text-${themeClass}">${sp.soluongton} sp</span></td>
                <td>
                    <span class="badge bg-${themeClass}-subtle text-${themeClass} px-3 py-2" style="border-radius: 8px;">
                        ${statusText}
                    </span>
                </td>
                <td class="text-end">
                    <button class="btn btn-link text-success p-1 mx-1 btn-edit" data-id="${sp.masp}"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="btn btn-link text-danger p-1 mx-1 btn-delete" data-id="${sp.masp}"><i class="fa-regular fa-trash-can"></i></button>
                </td>
            </tr>`;
      })
      .join("");
    totalCount.innerText = products.length;
  };

  const loadData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      renderProducts(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách sản phẩm:", err);
    }
  };

  // --- XỬ LÝ SỰ KIỆN (EVENT HANDLERS) ---

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
            headers: {
              "Content-Type": "multipart/form-data",
            },
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

  // Mở modal thêm sản phẩm thủ công
  if (btnAddProduct) {
    btnAddProduct.onclick = () => {
      addForm.reset();
      document.getElementById("addImgPreview").src =
        "/assets/images/default-product.png";
      addModal.show();
    };
  }

  // ✅ Xử lý Thêm mới (ĐÃ CẬP NHẬT LOGIC VALIDATE)
  if (addForm) {
    addForm.onsubmit = async (e) => {
      e.preventDefault();

      const tenSP = document.getElementById("addTenSP").value;
      const giaNhap = document.getElementById("addGiaNhap").value;
      const giaBan = document.getElementById("addGiaBan").value;

      // Kích hoạt hàm kiểm tra trước khi gửi API
      if (!validateProductData(tenSP, giaNhap, giaBan)) {
        return; // Dừng lại nếu dữ liệu không đạt yêu cầu
      }

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

  // Xử lý Sửa & Xóa trên bảng
  tableBody.addEventListener("click", async (e) => {
    const target = e.target.closest("button");
    if (!target) return;
    const id = target.getAttribute("data-id");

    // XÓA
    if (target.classList.contains("btn-delete")) {
      const result = await Swal.fire({
        title: "Xác nhận xóa?",
        text: "Dữ liệu sẽ không thể khôi phục!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa ngay",
      });

      if (result.isConfirmed) {
        try {
          await axios.delete(`${BASE_URL}/products/delete/${id}`);
          Swal.fire("Đã xóa!", "", "success");
          loadData();
        } catch (err) {
          Swal.fire("Lỗi", "Không thể xóa sản phẩm", "error");
        }
      }
    }

    // ĐỔ DỮ LIỆU VÀO MODAL SỬA
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
            ? `https://qlbh-project.onrender.com/uploads/products/${sp.hinhanh}`
            : "/assets/images/default-product.png";

          editModal.show();
        }
      } catch (err) {
        Swal.fire("Lỗi", "Lỗi lấy dữ liệu chi tiết", "error");
      }
    }
  });

  // ✅ Xử lý Cập nhật (ĐÃ CẬP NHẬT LOGIC VALIDATE)
  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();

      const maSP = document.getElementById("editMaSP").value;
      const tenSP = document.getElementById("editTenSP").value;
      const giaNhap = document.getElementById("editGiaNhap").value;
      const giaBan = document.getElementById("editGiaBan").value;

      // Kích hoạt hàm kiểm tra trước khi gửi API sửa
      if (!validateProductData(tenSP, giaNhap, giaBan)) {
        return;
      }

      const formData = new FormData(editForm);
      const fileInput = document.getElementById("editFileHinhAnh");

      formData.delete("HinhAnhFile");
      formData.delete("editFileHinhAnh");
      formData.delete("HinhAnh");

      if (!fileInput.files[0]) {
        formData.append(
          "HinhAnh",
          document.getElementById("editHinhAnhCu").value,
        );
      } else {
        formData.append("HinhAnh", fileInput.files[0]);
      }

      try {
        await axios.put(`${BASE_URL}/products/update/${maSP}`, formData);
        editModal.hide();
        Swal.fire("Thành công", "Đã cập nhật sản phẩm", "success");
        loadData();
      } catch (err) {
        console.error("Lỗi cập nhật:", err);
        Swal.fire(
          "Lỗi",
          err.response?.data?.message || "Không thể cập nhật sản phẩm",
          "error",
        );
      }
    };
  }

  // Xử lý tìm kiếm
  searchInput.oninput = (e) => {
    const val = e.target.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      row.style.display = row.innerText.toLowerCase().includes(val)
        ? ""
        : "none";
    });
  };

  // --- KHỞI CHẠY ---
  setupImagePreview("editFileHinhAnh", "editImagePreview");
  setupImagePreview("addFileHinhAnh", "addImgPreview");
  await loadDropdowns();
  await loadData();
}
