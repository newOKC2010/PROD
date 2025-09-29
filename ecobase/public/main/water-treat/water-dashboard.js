import { fetchDashboardData } from "/assets/water/water-treat-dashboard-js/dashboardApi.js";
import { destroyAllCharts } from "/assets/water/water-treat-dashboard-js/charts.js";
import {
  renderResourceCards,
  renderStatusCards,
  renderQualityCards,
} from "/assets/water/water-treat-dashboard-js/cardRenderer.js";
import { showLoading, hideLoading } from "/assets/water/water-treat-dashboard-js/utilities.js";
import { loadSummaryData } from "/assets/water/water-treat-dashboard-js/summaryRenderer.js";
import { setupChartClickEvents } from "/assets/water/water-treat-dashboard-js/modal.js";

// ลงทะเบียน Chart.js plugin
if (window.ChartDataLabels) {
  Chart.register(ChartDataLabels);
  // ตั้งค่าเริ่มต้นเป็น false เพื่อปิดการแสดงลาเบลบนทุกกราฟ
  Chart.defaults.plugins.datalabels = {
    display: false,
  };
}

// ตัวแปรสำหรับเก็บข้อมูล
let dashboardData = null;
let startDate = null;
let endDate = null;

// ฟังก์ชันเริ่มต้น
async function initDashboard() {
  console.log("กำลังเริ่มต้น Dashboard ระบบบำบัดน้ำเสีย...");

  // ตั้งค่าวันที่เริ่มต้นเป็นวันที่ 1 มกราคม ของปีปัจจุบัน
  const today = new Date();
  const currentYear = today.getFullYear();

  // วันที่เริ่มต้น: 1 มกราคม ปีปัจจุบัน
  const firstDay = new Date(currentYear, 0, 1); // 0 คือเดือนมกราคม (มกราคม = 0, ธันวาคม = 11)

  // วันที่สิ้นสุด: 31 ธันวาคม ปีปัจจุบัน
  const lastDay = new Date(currentYear, 11, 31); // 11 คือเดือนธันวาคม

  startDate = firstDay.toISOString().split("T")[0];
  endDate = lastDay.toISOString().split("T")[0];

  // ตั้งค่าค่าเริ่มต้นให้กับช่องกรอง
  document.getElementById("start-date").value = startDate;
  document.getElementById("end-date").value = endDate;

  // ตั้งค่า event listeners
  setupEventListeners();

  // โหลดข้อมูล
  await loadDashboardData();

  // เพิ่ม event listener สำหรับปุ่มจัดการข้อมูล
  setupManageButtonEvent();
}

// ฟังก์ชันสำหรับตั้งค่า event listeners
function setupEventListeners() {
  // ปุ่มกรองข้อมูล
  document.getElementById("filter-btn").addEventListener("click", handleFilter);

  // ปุ่มรีเซ็ต
  document.getElementById("reset-filter-btn").addEventListener("click", handleResetFilter);

  // เพิ่ม event listener สำหรับการเปลี่ยนแปลงขนาดหน้าจอ
  window.addEventListener("resize", handleWindowResize);
}

// ฟังก์ชันสำหรับจัดการการกรองข้อมูล
async function handleFilter() {
  startDate = document.getElementById("start-date").value;
  endDate = document.getElementById("end-date").value;

  if (!startDate || !endDate) {
    alert("กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด");
    return;
  }

  await loadDashboardData();
}

// ฟังก์ชันสำหรับรีเซ็ตตัวกรอง
async function handleResetFilter() {
  const today = new Date();
  const currentYear = today.getFullYear();

  // วันที่เริ่มต้น: 1 มกราคม ปีปัจจุบัน
  const firstDay = new Date(currentYear, 0, 1); // 0 คือเดือนมกราคม

  // วันที่สิ้นสุด: 31 ธันวาคม ปีปัจจุบัน
  const lastDay = new Date(currentYear, 11, 31); // 11 คือเดือนธันวาคม

  // กำหนดค่าวันที่สำหรับใช้ในการโหลดข้อมูล แต่ไม่แสดงให้ผู้ใช้เห็น
  startDate = firstDay.toISOString().split("T")[0];
  endDate = lastDay.toISOString().split("T")[0];

  // ล้างการแสดงผลวันที่ให้เป็น "เลือกวันที่"
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  // กำหนดค่าให้ input แต่ไม่แสดงให้ผู้ใช้เห็น
  startDateInput.value = startDate;
  endDateInput.value = endDate;

  // อัปเดตการแสดงผลของ custom datepicker
  const startDateContainer = startDateInput.parentNode.querySelector(".thai-date-display");
  const endDateContainer = endDateInput.parentNode.querySelector(".thai-date-display");

  if (startDateContainer) {
    startDateContainer.textContent = "เลือกวันที่";
  }

  if (endDateContainer) {
    endDateContainer.textContent = "เลือกวันที่";
  }

  await loadDashboardData();
}

// ฟังก์ชันสำหรับจัดการการเปลี่ยนแปลงขนาดหน้าจอ
function handleWindowResize() {
  if (dashboardData) {
    // ทำลายกราฟเดิมและสร้างใหม่เพื่อให้ปรับขนาดได้ถูกต้อง
    destroyAllCharts();
    renderDashboardContent(dashboardData);

    // เพิ่มการเรียกใช้ setupChartClickEvents หลังจากสร้างกราฟใหม่
    setTimeout(() => {
      setupChartClickEvents();
    }, 500);
  }
}

// ฟังก์ชันสำหรับโหลดข้อมูล Dashboard
async function loadDashboardData() {
  try {
    console.log("กำลังโหลดข้อมูล Dashboard...");
    showLoading();

    // ทำลายกราฟเก่า (ถ้ามี)
    destroyAllCharts();

    // โหลดข้อมูลสรุปก่อน
    await loadSummaryData(startDate, endDate, "summary-card-grid");

    // เรียกข้อมูลจาก API
    dashboardData = await fetchDashboardData(startDate, endDate);

    // อัปเดตเวลาล่าสุด
    //document.getElementById('last-update-time').textContent = formatDate(new Date());

    // แสดงข้อมูล
    renderDashboardContent(dashboardData);

    // เรียกใช้ setupChartClickEvents หลังจากสร้างกราฟเสร็จแล้ว
    setTimeout(() => {
      setupChartClickEvents();
    }, 500);

    hideLoading();
    console.log("โหลดข้อมูล Dashboard สำเร็จ");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard:", error);
    hideLoading();

    // แสดงข้อความผิดพลาด
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
  }
}

// ฟังก์ชันสำหรับแสดงข้อมูล Dashboard
function renderDashboardContent(data) {
  // ถ้าไม่มีข้อมูล หรือมี flag noData ให้แสดงข้อความไม่มีข้อมูล
  if (!data || data.noData) {
    showNoDataMessage();
    return;
  }

  // สร้างการ์ดสำหรับการใช้ทรัพยากร
  renderResourceCards(data.monthlySummary);

  // สร้างการ์ดสำหรับสถานะอุปกรณ์
  renderStatusCards(data.statusSummary);

  // สร้างการ์ดสำหรับคุณภาพน้ำและตะกอน
  renderQualityCards(data.monthlySummary);

  // เพิ่มการเรียกใช้ setupChartClickEvents หลังจากสร้าง chart ทั้งหมดเสร็จ
  setTimeout(() => {
    setupChartClickEvents();
    console.log("ติดตั้ง event listeners หลังจากสร้าง chart เสร็จ");
  }, 500);
}

// เพิ่มฟังก์ชันแสดงข้อความไม่มีข้อมูล
function showNoDataMessage() {
  const sections = ["resource-card-grid", "status-card-grid", "quality-card-grid"];

  sections.forEach((sectionId) => {
    const container = document.getElementById(sectionId);
    container.innerHTML = "";

    const noDataMessage = document.createElement("div");
    noDataMessage.className = "no-data-message";
    noDataMessage.innerHTML = `
      <div class="no-data-icon">📊</div>
      <h3>ไม่พบข้อมูลในช่วงเวลาที่เลือก</h3>
      <p>กรุณาเลือกช่วงเวลาอื่น หรือตรวจสอบการเชื่อมต่อฐานข้อมูล</p>
    `;

    container.appendChild(noDataMessage);
  });
}

// ฟังก์ชันตั้งค่า event สำหรับปุ่มจัดการข้อมูล
function setupManageButtonEvent() {
  const manageButton = document.getElementById("water-treat-manage-button");
  if (manageButton) {
    manageButton.addEventListener("click", async function (e) {
      e.preventDefault(); // ป้องกันการนำทางตามลิงก์ทันที
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }
      // ถ้ายังไม่หมดอายุให้นำทางไปยังหน้าจัดการข้อมูล
      window.location.href = "/water-manage";
    });

    console.log("ตั้งค่า event listener สำหรับปุ่มจัดการข้อมูลเรียบร้อย");
  } else {
    console.warn("ไม่พบปุ่มจัดการข้อมูล");
  }
}

// เริ่มต้นเมื่อโหลดหน้าเสร็จ
document.addEventListener("DOMContentLoaded", initDashboard);
