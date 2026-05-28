// src/JS/footer.js

export async function loadFooter() {
    const footerContainer = document.getElementById('footer-shared');
    if (!footerContainer) return;

    try {
        // 🟢 1. Tự động kiểm tra và tiêm file CSS của Footer vào <head> nếu chưa có
        if (!document.getElementById('footer-css-pack')) {
            const cssLink = document.createElement('link');
            cssLink.id = 'footer-css-pack';
            cssLink.rel = 'stylesheet';
            cssLink.href = '/src/css/footer.css'; // Đường dẫn đến file CSS riêng của bạn
            document.head.appendChild(cssLink);
        }

        // 🔵 2. Gọi file HTML tĩnh của footer về trang
        const response = await fetch('/src/pages/common/footer.html');
        if (!response.ok) throw new Error('Không thể tải file footer.html');
        
        const footerHtml = await response.text();
        footerContainer.innerHTML = footerHtml;
    } catch (error) {
        console.error('Lỗi khi tải component Footer kèm CSS:', error);
    }
}