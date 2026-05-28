// src/JS/cart.js
import Swal from 'sweetalert2';

// FIX PATH: File trong thư mục public được map thẳng ra root '/'
const DEFAULT_IMAGE = '/img/default.jpg'; 

document.addEventListener('DOMContentLoaded', () => {
    // Kích hoạt vẽ giỏ hàng ngay khi người dùng truy cập trang cart.html
    renderCartPage();
    
    const checkoutBtn = document.getElementById('btn-trigger-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckoutRedirect);
    }
});

// Hàm bổ trợ lấy Key giỏ hàng động dựa theo trạng thái đăng nhập
function getCartKey() {
    const userData = JSON.parse(localStorage.getItem('hpstore_user'));
    if (userData && (userData.MaND || userData.id)) {
        return `hpstore_cart_${userData.MaND || userData.id}`;
    }
    return 'hpstore_cart_guest'; 
}

function updateCartBadgeCount() {
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.SoLuong) || 0), 0);
    
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = totalItems;
    }
}

function renderCartPage() {
    const tableBody = document.getElementById('cart-table-body');
    if (!tableBody) return;

    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (cart.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <i class="fa-solid fa-bag-shopping text-muted mb-3" style="font-size: 3rem; opacity:0.3;"></i>
                    <h6 class="text-secondary fw-semibold">Giỏ hàng của bạn đang trống!</h6>
                    <a href="/index.html" class="btn btn-sm btn-outline-primary mt-2 px-3" style="border-radius:8px;">Quay lại mua sắm</a>
                </td>
            </tr>
        `;
        updateSummary(0);
        return;
    }

    let subTotal = 0;
    
    const htmlRows = cart.map((item) => {
        const giaBan = parseFloat(item.GiaBan) || 0;
        const soLuong = parseInt(item.SoLuong) || 0;
        const itemTotal = giaBan * soLuong;
        
        subTotal += itemTotal;
        
        const imgPath = (item.HinhAnh && item.HinhAnh !== 'NULL') 
            ? `http://localhost:3000/uploads/products/${item.HinhAnh}` 
            : DEFAULT_IMAGE;

        return `
            <tr data-masp="${item.MaSP || ''}">
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <img src="${imgPath}" class="product-cart-img" alt="${item.TenSP || 'Sản phẩm'}" style="width:70px; height:70px; object-fit:contain;" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'">
                        <div>
                            <h6 class="fw-bold text-dark mb-1 text-truncate" style="max-width: 250px;">${item.TenSP || 'Không rõ tên'}</h6>
                            <small class="text-muted d-block">Đơn giá: ${giaBan.toLocaleString('vi-VN')} đ</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex justify-content-center">
                        <div class="quantity-input-group d-flex align-items-center" style="border: 1px solid #ddd; border-radius:5px;">
                            <button type="button" class="btn btn-sm btn-light px-2" onclick="changeQty('${item.MaSP}', -1)">-</button>
                            <input type="text" value="${soLuong}" class="text-center border-0 fw-bold" style="width: 40px;" readonly>
                            <button type="button" class="btn btn-sm btn-light px-2" onclick="changeQty('${item.MaSP}', 1)">+</button>
                        </div>
                    </div>
                </td>
                <td class="text-end fw-bold text-dark">${itemTotal.toLocaleString('vi-VN')} đ</td>
                <td class="text-center">
                    <button class="btn btn-sm text-danger" onclick="removeCartItem('${item.MaSP}')">
                        <i class="fa-regular fa-trash-can fs-5"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = htmlRows;
    updateSummary(subTotal);
    updateCartBadgeCount();
}

function updateSummary(subTotal) {
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    
    if (subtotalEl) subtotalEl.innerText = `${subTotal.toLocaleString('vi-VN')} đ`;
    if (totalEl) totalEl.innerText = `${subTotal.toLocaleString('vi-VN')} đ`;
}

window.changeQty = function(maSP, delta) {
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const itemIndex = cart.findIndex(item => item.MaSP === maSP);

    if (itemIndex > -1) {
        let currentQty = parseInt(cart[itemIndex].SoLuong) || 1;
        currentQty += delta;
        
        if (currentQty <= 0) {
            // 🟢 TÍCH HỢP: Hỏi xác nhận bằng SweetAlert2 khi giảm số lượng về 0
            Swal.fire({
                title: 'Xóa sản phẩm?',
                text: "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#6366f1',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Đúng, xóa đi!',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    cart.splice(itemIndex, 1);
                    localStorage.setItem(cartKey, JSON.stringify(cart));
                    renderCartPage();
                    
                    // Thông báo Toast nhỏ góc màn hình cho mượt
                    Swal.fire({
                        icon: 'success',
                        title: 'Đã xóa sản phẩm',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            });
        } else {
            cart[itemIndex].SoLuong = currentQty;
            localStorage.setItem(cartKey, JSON.stringify(cart));
            renderCartPage();
        }
    }
}

window.removeCartItem = function(maSP) {
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    // 🟢 TÍCH HỢP: Xác nhận khi chủ động bấm vào icon Thùng rác
    Swal.fire({
        title: 'Bỏ sản phẩm này?',
        text: "Sản phẩm sẽ được xóa khỏi danh sách giỏ hàng của bạn.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Giữ lại'
    }).then((result) => {
        if (result.isConfirmed) {
            cart = cart.filter(item => item.MaSP !== maSP);
            localStorage.setItem(cartKey, JSON.stringify(cart));
            renderCartPage();

            Swal.fire({
                icon: 'success',
                title: 'Đã cập nhật giỏ hàng',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500
            });
        }
    });
}

function handleCheckoutRedirect() {
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    if (cart.length === 0) {
        // 🟢 TÍCH HỢP: Thông báo lỗi giỏ hàng trống bằng SweetAlert2
        Swal.fire({
            icon: 'warning',
            title: 'Giỏ hàng trống',
            text: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi tiến hành thanh toán!',
            confirmButtonColor: '#6366f1'
        });
        return;
    }
    // FIX PATH: Điều hướng trang checkout chuẩn từ root
    window.location.href = '/src/pages/checkout.html';
}