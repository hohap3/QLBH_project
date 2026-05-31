import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // 🟢 Thêm base path để đảm bảo các file asset (.js, .css) tìm đúng đường dẫn tương đối sau khi build
  base: "./",

  // 1. Cấu hình Server cho môi trường Development (npm run dev)
  server: {
    // Ép server Vite trả về đúng file HTML tương ứng khi bạn gõ URL sạch trên trình duyệt (ví dụ: http://localhost:5173/cart)
    historyApiFallback: {
      rewrites: [
        { from: /^\/login$/, to: "/src/pages/login.html" },
        { from: /^\/register$/, to: "/src/pages/register.html" },
        { from: /^\/dashboard$/, to: "/src/pages/dashboard.html" },
        { from: /^\/cart$/, to: "/src/pages/cart.html" },
        { from: /^\/checkout$/, to: "/src/pages/checkout.html" },
        { from: /^\/danh-muc$/, to: "/src/pages/danh-muc.html" },
        { from: /^\/don-hang$/, to: "/src/pages/don-hang.html" },
        { from: /^\/order-history$/, to: "/src/pages/order-history.html" },
        { from: /^\/product-detail$/, to: "/src/pages/product-detail.html" },
        { from: /^\/hoso$/, to: "/src/pages/hoso.html" },
        { from: /^\/khach-hang$/, to: "/src/pages/khach-hang.html" },
        { from: /^\/nha-cung-cap$/, to: "/src/pages/nha-cung-cap.html" },
        { from: /^\/quanly-khohang$/, to: "/src/pages/quanly-khohang.html" },
        { from: /^\/quanly-nhanvien$/, to: "/src/pages/quanly-nhanvien.html" },
        { from: /^\/employeeManager$/, to: "/src/pages/employeeManager.html" },
        { from: /^\/san-pham$/, to: "/src/pages/san-pham.html" },
        { from: /^\/tong-quan$/, to: "/src/pages/tong-quan.html" },
        { from: /^\/update-pass$/, to: "/src/pages/update-pass.html" },
        { from: /^\/cai-dat$/, to: "/src/pages/cai-dat.html" },
      ],
    },
  },

  // 2. Cấu hình cho môi trường Production (npm run build)
  build: {
    // 🟢 KHAI BÁO ĐẦY ĐỦ: Buộc Rollup phải quét và biên dịch toàn bộ các trang HTML này vào thư mục "dist"
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src/pages/login.html"),
        register: resolve(__dirname, "src/pages/register.html"),
        dashboard: resolve(__dirname, "src/pages/dashboard.html"),
        cart: resolve(__dirname, "src/pages/cart.html"),
        checkout: resolve(__dirname, "src/pages/checkout.html"),
        danhMuc: resolve(__dirname, "src/pages/danh-muc.html"),
        donHang: resolve(__dirname, "src/pages/don-hang.html"),
        orderHistory: resolve(__dirname, "src/pages/order-history.html"),
        productDetail: resolve(__dirname, "src/pages/product-detail.html"),
        hoso: resolve(__dirname, "src/pages/hoso.html"),
        khachHang: resolve(__dirname, "src/pages/khach-hang.html"),
        nhaCungCap: resolve(__dirname, "src/pages/nha-cung-cap.html"),
        quanlyKhoHang: resolve(__dirname, "src/pages/quanly-khohang.html"),
        quanlyNhanVien: resolve(__dirname, "src/pages/quanly-nhanvien.html"),
        employeeManager: resolve(__dirname, "src/pages/employeeManager.html"),
        sanPham: resolve(__dirname, "src/pages/san-pham.html"),
        tongQuan: resolve(__dirname, "src/pages/tong-quan.html"),
        updatePass: resolve(__dirname, "src/pages/update-pass.html"),
        caiDat: resolve(__dirname, "src/pages/cai-dat.html"),
      },
    },
  },
});
