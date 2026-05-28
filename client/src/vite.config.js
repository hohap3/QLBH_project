import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  // 1. Cấu hình Server cho môi trường Development (npm run dev)
  server: {
    proxy: {
      // Nếu bạn muốn giữ URL sạch, Vite sẽ hiểu và điều hướng ngầm
    },
    // Rewrite đường dẫn để khi gõ /dashboard nó trỏ đúng vào file html
    historyApiFallback: {
      rewrites: [
        { from: /^\/login$/, to: "/src/pages/login.html" },
        { from: /^\/register$/, to: "/src/pages/register.html" },
        { from: /^\/dashboard$/, to: "/src/pages/dashboard.html" },
      ],
    },
  },

  // 2. Cấu hình cho môi trường Production (npm run build)
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src/pages/login.html"),
        register: resolve(__dirname, "src/pages/register.html"),
        dashboard: resolve(__dirname, "src/pages/dashboard.html"),
      },
    },
  },
});
