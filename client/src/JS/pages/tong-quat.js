import axios from "axios";
import Chart from "chart.js/auto";
import { BASE_URL } from "/src/JS/common/header";

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
    // 🟢 FIX CÚ PHÁP: Xóa dấu } thừa ở ${BASE_URL}
    const response = await axios.get(`${BASE_URL}/thongke/san-pham-danh-muc`);
    const stats = response.data.data;

    // PostgreSQL trả về trường viết thường hoặc object tùy biến, hỗ trợ cả hai kiểu label/value
    const labels = stats.map((item) => item.label || item.tendanhmuc);
    const dataValues = stats.map((item) => parseInt(item.value) || 0);

    const dynamicColors = generateRandomColors(stats.length);
    const canvasElement = document.getElementById("categoryPieChart");
    if (!canvasElement) return;

    const ctx = canvasElement.getContext("2d");
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
      existingChart.destroy();
    }

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: dynamicColors,
            hoverOffset: 15,
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1500,
          easing: "easeOutQuart",
        },
        plugins: {
          legend: {
            position: "right",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: { size: 13, family: "'Segoe UI', Roboto, sans-serif" },
            },
          },
          tooltip: {
            backgroundColor: "rgba(26, 28, 46, 0.9)",
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 14, weight: "bold" },
            bodyFont: { size: 13 },
            callbacks: {
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
    const response = await axios.get(`${BASE_URL}/thongke/top-products`);
    const products = response.data.data;

    let html = "";
    products.forEach((item, index) => {
      // 🟢 ĐỒNG BỘ ĐỌC TRƯỜNG: Hỗ trợ cả totalRevenue/totalrevenue viết thường của Postgres
      const revenue = parseFloat(item.totalRevenue || item.totalrevenue) || 0;
      const qty = parseInt(item.totalQty || item.totalqty) || 0;

      const formattedRevenue = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(revenue);

      html += `
                <div class="top-item d-flex align-items-center p-3 rounded-4 mb-3" 
                     style="background: #fdfdff; border: 1px solid #f0f0f5;">
                    <div class="rank-badge me-3">#${index + 1}</div>
                    <div class="flex-grow-1">
                        <div class="product-name mb-0" style="font-weight: 600; color: #1a1c2e;">
                            ${item.label}
                        </div>
                        <small class="text-muted">${qty} sản phẩm đã bán</small>
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

// 3. GRAPH 1: Biểu đồ ĐƯỜNG - Doanh thu theo tháng
async function renderMonthlyRevenueChart() {
  try {
    const response = await axios.get(`${BASE_URL}/thongke/monthly-revenue`);
    const stats = response.data.data;

    const labels = stats.map((item) => item.label);
    const dataValues = stats.map((item) => parseFloat(item.value) || 0);

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
            tension: 0.4,
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

// 4. GRAPH 2: Biểu đồ CỘT - Số lượng đơn hàng theo tháng
async function renderMonthlyOrdersChart() {
  try {
    const response = await axios.get(`${BASE_URL}/thongke/monthly-orders`);
    const stats = response.data.data;

    // 🟢 FIX LỖI: Đồng bộ mapping với dữ liệu đã được Backend chuẩn hóa kiểu mới { label, value }
    const labels = stats.map((item) => item.label);
    const dataValues = stats.map((item) => parseInt(item.value) || 0);

    const canvasElement = document.getElementById("monthlyOrdersChart");
    if (!canvasElement) return;

    const ctx = canvasElement.getContext("2d");
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Số đơn",
            data: dataValues,
            backgroundColor: "#9333ea",
            borderRadius: 5,
            barThickness: 30,
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
            ticks: { color: "#64748b" },
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
    const resStats = await axios.get(`${BASE_URL}/thongke/overview`);
    const stats = resStats.data.data;

    // 🟢 FIX LINH HOẠT: Hỗ trợ đọc cả thuộc tính chữ Hoa hoặc chữ thường trả từ database Postgres
    const doanhThu =
      stats.DoanhThu !== undefined ? stats.DoanhThu : stats.doanhthu || 0;
    const tongDonHang =
      stats.TongDonHang !== undefined
        ? stats.TongDonHang
        : stats.tongdonhang || 0;
    const tongKhachHang =
      stats.TongKhachHang !== undefined
        ? stats.TongKhachHang
        : stats.tongkhachhang || 0;

    const revenueEl = document.getElementById("totalRevenue");
    const ordersEl = document.getElementById("totalOrders");
    const customersEl = document.getElementById("totalCustomers");

    if (revenueEl) {
      revenueEl.innerText = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(parseFloat(doanhThu) || 0);
    }
    if (ordersEl) ordersEl.innerText = tongDonHang;
    if (customersEl) customersEl.innerText = tongKhachHang;

    // Kích hoạt đồng thời cả 4 đồ thị và danh sách riêng biệt
    renderCategoryChart();
    renderTopSellingList();
    renderMonthlyRevenueChart();
    renderMonthlyOrdersChart();
  } catch (err) {
    console.error("Lỗi cập nhật Dashboard tổng quan:", err);
  }
}
