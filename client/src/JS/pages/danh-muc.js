import axios from 'axios';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

let categoryModal;

export async function initCategoryManager() {
    // --- DOM Elements ---
    // Đổi ID từ Table sang Grid
    const categoryGrid = document.getElementById('categoryGrid'); 
    const categoryForm = document.getElementById('categoryForm');
    const modalEl = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const btnAddCategory = document.getElementById('btnAddCategory');
    const searchInput = document.getElementById('searchCategory');
    const totalCount = document.getElementById('totalCategories');

    // Khởi tạo Bootstrap Modal
    if (modalEl) categoryModal = new Modal(modalEl);

    // --- Helper Functions ---

    const loadCategories = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/categories');
            renderGrid(res.data); // Chuyển sang dùng hàm render Grid
            if (totalCount) totalCount.innerText = res.data.length;
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ', 'error');
        }
    };

    const renderGrid = (data) => {
    if (!categoryGrid) return;

    if (data.length === 0) {
        categoryGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" width="80" class="opacity-25 mb-3">
                <p class="text-muted">Chưa có danh mục nào được tạo.</p>
            </div>`;
        return;
    }

    categoryGrid.innerHTML = data.map(dm => `
        <div class="col category-item">
            <div class="card h-100 border-0 shadow-sm category-card">
                <div class="card-body p-4 pb-2">
                    <div class="category-icon-box bg-light text-primary rounded-3 d-flex align-items-center justify-content-center mb-3" style="width: 48px; height: 48px;">
                        <i class="fa-solid fa-box-archive fs-4"></i>
                    </div>
                    <h5 class="fw-bold mb-1">${dm.TenDanhMuc}</h5>
                    <code class="text-uppercase small fw-bold mb-2 d-block text-muted">ID: ${dm.MaDanhMuc}</code>
                    <p class="card-text text-muted small line-clamp-3">
                        ${dm.MoTa || '<i>Không có mô tả cho danh mục này.</i>'}
                    </p>
                </div>
                <div class="card-footer bg-transparent border-0 p-4 pt-2">
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary rounded-pill flex-fill btn-edit" data-id="${dm.MaDanhMuc}">
                            <i class="fa-regular fa-pen-to-square me-1"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-pill flex-fill btn-delete" data-id="${dm.MaDanhMuc}">
                            <i class="fa-regular fa-trash-can me-1"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    };

    const resetForm = () => {
        categoryForm.reset();
        const maInput = document.getElementById('maDanhMuc');
        const tenInput = document.getElementById('tenDanhMuc');
        [maInput, tenInput].forEach(el => el.classList.remove('is-invalid'));
        maInput.readOnly = false;
        maInput.classList.remove('bg-light');
        modalTitle.innerText = "Thêm Danh Mục Mới";
    };

    // --- Event Handlers ---

    if (btnAddCategory) {
        btnAddCategory.onclick = () => {
            resetForm();
            categoryModal.show();
        };
    }

    // Fix Tìm kiếm cho Card Grid
    if (searchInput) {
        searchInput.oninput = (e) => {
            const val = e.target.value.toLowerCase();
            const items = categoryGrid.querySelectorAll('.category-item');
            items.forEach(item => {
                const text = item.innerText.toLowerCase();
                item.classList.toggle('d-none', !text.includes(val));
            });
        };
    }

    // Xử lý Submit
    categoryForm.onsubmit = async (e) => {
        e.preventDefault();
        const maInput = document.getElementById('maDanhMuc');
        const tenInput = document.getElementById('tenDanhMuc');
        const moTaInput = document.getElementById('moTaDanhMuc');

        const maDanhMuc = maInput.value.trim();
        const tenDanhMuc = tenInput.value.trim();
        const moTa = moTaInput.value.trim();
        const isEdit = maInput.readOnly;

        if (!tenDanhMuc || (!isEdit && !maDanhMuc)) {
            if (!tenDanhMuc) tenInput.classList.add('is-invalid');
            if (!isEdit && !maDanhMuc) maInput.classList.add('is-invalid');
            return Swal.fire('Thông báo', 'Vui lòng điền đủ thông tin', 'warning');
        }

        try {
            const data = { MaDanhMuc: maDanhMuc, TenDanhMuc: tenDanhMuc, MoTa: moTa || null };
            if (isEdit) {
                await axios.put(`http://localhost:3000/api/categories/update/${maDanhMuc}`, data);
            } else {
                await axios.post('http://localhost:3000/api/categories/add', data);
            }
            Swal.fire('Thành công', 'Dữ liệu đã được lưu', 'success');
            categoryModal.hide();
            loadCategories();
        } catch (err) {
            Swal.fire('Lỗi', err.response?.data?.message || "Lỗi xử lý", 'error');
        }
    };

    // Fix Sự kiện Click (Sửa/Xóa) cho Card Grid
    categoryGrid.onclick = async (e) => {
        const btnEdit = e.target.closest('.btn-edit');
        const btnDelete = e.target.closest('.btn-delete');

        if (btnDelete) {
            e.preventDefault(); // Tránh bị nhảy link '#'
            const id = btnDelete.getAttribute('data-id');
            const result = await Swal.fire({
                title: 'Xác nhận xóa?',
                text: `Xóa danh mục [${id}]?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Xóa ngay'
            });

            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:3000/api/categories/delete/${id}`);
                    Swal.fire('Đã xóa', '', 'success');
                    loadCategories();
                } catch (err) {
                    Swal.fire('Lỗi', 'Không thể xóa danh mục này', 'error');
                }
            }
        }

        if (btnEdit) {
            e.preventDefault();
            const id = btnEdit.getAttribute('data-id');
            try {
                const res = await axios.get(`http://localhost:3000/api/categories/${id}`);
                const data = res.data;

                const maInput = document.getElementById('maDanhMuc');
                maInput.value = data.MaDanhMuc;
                maInput.readOnly = true;
                maInput.classList.add('bg-light');
                
                document.getElementById('tenDanhMuc').value = data.TenDanhMuc;
                document.getElementById('moTaDanhMuc').value = data.MoTa || '';
                
                modalTitle.innerText = "Cập Nhật Danh Mục";
                categoryModal.show();
            } catch (err) {
                Swal.fire('Lỗi', 'Không lấy được thông tin', 'error');
            }
        }
    };

    loadCategories();
}