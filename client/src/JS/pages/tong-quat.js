import axios from "axios";
import Chart from "chart.js/auto";

function generateRandomColors(count) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * (360 / count)) % 360;
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  return colors;
}

// 1. Biểu đồ hình tròn: Phân bổ sản phẩm theo danh mục
async function renderCategoryChart() {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/thongke/san-pham-danh-muc",
    );
    const stats = response.data.data;

    const labels = stats.map((item) => item.label);
    const dataValues = stats.map((item) => item.value);

    // Tự động tạo mảng màu dựa trên số lượng danh mục thực tế
    const dynamicColors = generateRandomColors(stats.length);

    const canvasElement = document.getElementById("categoryPieChart");
    if (!canvasElement) return; // Bảo vệ code nếu không tìm thấy canvas

    const ctx = canvasElement.getContext("2d");

    // Xóa biểu đồ cũ nếu đã tồn tại để tránh lỗi đè
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(ctx, {
      type: "pie", // Biểu đồ hình tròn
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: dynamicColors, // Sử dụng màu động
            hoverOffset: 15, // Hiệu ứng nổi bật khi di chuột vào (tăng một chút cho rõ)
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        // 🌟 MỤC THÊM MỚI: Cấu hình Animation cho biểu đồ hình tròn
        animation: {
          animateRotate: true, // 🌟 Bật hiệu ứng xoay từ tâm khi xuất hiện
          animateScale: true, // 🌟 Bật hiệu ứng phóng to từ tâm khi xuất hiện
          duration: 1500, // Thời gian chạy animation (ms) - 1.5 giây cho mượt
          easing: "easeOutQuart", // 🌟 Kiểu lướt: Nhanh ban đầu và chậm dần về cuối trông rất chuyên nghiệp
        },

        plugins: {
          legend: {
            position: "right", // Chú thích nằm bên phải
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: { size: 13, family: "'Segoe UI', Roboto, sans-serif" },
            },
          },
          tooltip: {
            backgroundColor: "rgba(26, 28, 46, 0.9)", // Định dạng lại tooltip cho đẹp
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            callbacks: {
              // Bổ sung thêm ký tự "sản phẩm" vào sau con số hiển thị
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed || 0;
                return ` ${label}: ${value.toLocaleString("vi-VN")} sản phẩm`;
              },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("Lỗi khi vẽ biểu đồ danh mục:", err);
  }
}

// 2. Danh sách Top 5 sản phẩm bán chạy
async function renderTopSellingList() {
  const listContainer = document.getElementById("topSellingList");
  if (!listContainer) return;
  try {
    const response = await axios.get(
      "http://localhost:3000/api/thongke/top-products",
    );
    const products = response.data.data;

    let html = "";
    products.forEach((item, index) => {
      const formattedRevenue = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(item.totalRevenue);

      html += `
                <div class="top-item d-flex align-items-center p-3 rounded-4 mb-3" 
                     style="background: #fdfdff; border: 1px solid #f0f0f5;">
                    <div class="rank-badge me-3">#${index + 1}</div>
                    <div class="flex-grow-1">
                        <div class="product-name mb-0" style="font-weight: 600; color: #1a1c2e;">
                            ${item.label}
                        </div>
                        <small class="text-muted">${item.totalQty} sản phẩm đã bán</small>
                    </div>
                    <div class="product-revenue text-end" style="font-weight: 700; color: #2563eb;">
                        ${formattedRevenue}
                    </div>
                </div>
            `;
    });
    listContainer.innerHTML = html;
  } catch (err) {
    listContainer.innerHTML =
      '<p class="text-danger">Không thể tải danh sách sản phẩm.</p>';
    console.error(err);
  }
}

// 3. GRAPH 1: Biểu đồ ĐƯỜNG - Doanh thu theo tháng (Mới thêm)
async function renderMonthlyRevenueChart() {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/thongke/monthly-revenue",
    );
    const stats = response.data.data;

    const labels = stats.map((item) => item.label);
    const dataValues = stats.map((item) => item.value);

    const canvasElement = document.getElementById("monthlyRevenueChart");
    if (!canvasElement) return;

    const ctx = canvasElement.getContext("2d");
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Doanh thu",
            data: dataValues,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.04)",
            borderWidth: 3,
            tension: 0.4, // Đường cong lượn sóng mượt
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#3b82f6",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#eef0f3", drawBorder: false, borderDash: [5, 5] },
            ticks: {
              font: { size: 12 },
              color: "#64748b",
              callback: function (value) {
                if (value === 0) return "0";
                return value >= 1000000
                  ? value / 1000000 + "M"
                  : value.toLocaleString("vi-VN");
              },
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 12, weight: "500" }, color: "#64748b" },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, pointStyle: "circle", padding: 20 },
          },
        },
      },
    });
  } catch (err) {
    console.error("Lỗi vẽ biểu đồ đường doanh thu tháng:", err);
  }
}

// 4. GRAPH 2: Biểu đồ CỘT - Số lượng đơn hàng theo tháng (Giữ lại ban đầu)
async function renderMonthlyOrdersChart() {
  try {
    const response = await axios.get(
      "http://localhost:3000/api/thongke/monthly-orders",
    );
    const stats = response.data.data;

    // Biểu đồ cũ trả về mảng có key là { month, orderCount }
    const labels = stats.map((item) => `T${item.month}`);
    const dataValues = stats.map((item) => item.orderCount);

    const canvasElement = document.getElementById("monthlyOrdersChart");
    if (!canvasElement) return;

    const ctx = canvasElement.getContext("2d");
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: "bar", // Dạng cột
      data: {
        labels: labels,
        datasets: [
          {
            label: "Số đơn",
            data: dataValues,
            backgroundColor: "#9333ea", // Màu tím theo đúng hình monthly.jpg của bạn
            borderRadius: 5,
            barThickness: 30, // Điều chỉnh độ rộng cột gọn lại để cân xứng giao diện
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { drawBorder: false, color: "#f0f0f0" },
            ticks: { stepSize: 90, color: "#64748b" },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#64748b" },
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, padding: 20 },
          },
        },
      },
    });
  } catch (err) {
    console.error("Lỗi vẽ biểu đồ cột số đơn:", err);
  }
}

// Hàm khởi tạo tổng hợp toàn bộ Dashboard Admin
export async function initTongQuan() {
  try {
    // Gọi lấy số liệu 3 thẻ thống kê nhanh phía trên
    const resStats = await axios.get(
      "http://localhost:3000/api/thongke/overview",
    );
    const stats = resStats.data.data;

    document.getElementById("totalRevenue").innerText = new Intl.NumberFormat(
      "vi-VN",
      { style: "currency", currency: "VND" },
    ).format(stats.DoanhThu || 0);
    document.getElementById("totalOrders").innerText = stats.TongDonHang || 0;
    document.getElementById("totalCustomers").innerText =
      stats.TongKhachHang || 0;

    // 🌟 Kích hoạt đồng thời cả 2 đồ thị riêng biệt
    renderCategoryChart();
    renderTopSellingList();

    renderMonthlyRevenueChart(); // Chạy Graph Đường (Doanh thu)
    renderMonthlyOrdersChart(); // Chạy Graph Cột (Số đơn)
  } catch (err) {
    console.error("Lỗi cập nhật Dashboard tổng quan:", err);
  }
}
