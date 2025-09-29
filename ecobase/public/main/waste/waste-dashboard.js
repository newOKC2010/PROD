/**
 * ไฟล์หลักสำหรับแดชบอร์ดระบบจัดการขยะ
 */

import { fetchMonthlyWasteData, fetchComparisonWasteData } from "./waste-dashboard-js/api.js";
import { createMonthlyLineChart, createComparisonLineChart, getWasteTypeIcon } from "./waste-dashboard-js/chart.js";
import { formatNumber, showLoading, showNoData } from "./waste-dashboard-js/utilities.js";
import { setupChartClickEvents } from "./waste-dashboard-js/modal.js";

// เก็บค่าวันที่ปัจจุบันสำหรับกรอกในฟอร์มกรอง
const currentYear = new Date().getFullYear();
const defaultStartDate = `${currentYear}-01-01`;
const defaultEndDate = `${currentYear}-12-31`;

// รายการประเภทขยะที่ต้องการแสดง
const wasteTypes = [
  { id: 1, name: "ขยะทั่วไป", icon: "delete" },
  { id: 2, name: "ขยะรีไซเคิล", icon: "recycling" },
  { id: 3, name: "ขยะอันตราย", icon: "warning" },
  { id: 4, name: "ขยะติดเชื้อ", icon: "local_hospital" },
];

// ตั้งค่าเริ่มต้น
document.addEventListener("DOMContentLoaded", () => {
  initDateFilters();
  setupEventListeners();
  createDashboardCards();
  createComparisonCard();
  loadAllWasteData();

  // ปรับขนาดกราฟเมื่อขนาดหน้าจอเปลี่ยน
  window.addEventListener("resize", handleResize);
});

/**
 * ตั้งค่าเริ่มต้นสำหรับตัวกรองวันที่
 */
function initDateFilters() {
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  startDateInput.value = defaultStartDate;
  endDateInput.value = defaultEndDate;
}

/**
 * ตั้งค่า event listeners
 */
function setupEventListeners() {
  // ปุ่มกรองข้อมูล
  document.getElementById("filter-btn").addEventListener("click", () => {
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    // ตรวจสอบว่าวันที่ถูกต้อง
    if (!startDate || !endDate) {
      alert("กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด");
      return;
    }

    // โหลดข้อมูลใหม่ตามช่วงวันที่
    loadAllWasteData(startDate, endDate);
  });

  // ปุ่มรีเซ็ต
  document.getElementById("reset-filter-btn").addEventListener("click", () => {
    // ล้างค่า input แบบปกติ
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    
    // เก็บค่าวันที่เริ่มต้นและสิ้นสุดเดิมไว้เพื่อโหลดข้อมูลใหม่
    const oldStartDate = defaultStartDate;
    const oldEndDate = defaultEndDate;
    
    // ล้างค่า input
    startDateInput.value = "";
    endDateInput.value = "";

    // รีเซ็ต custom datepicker display (ถ้ามี)
    const startDateContainer = startDateInput.parentNode.querySelector(".thai-date-display");
    const endDateContainer = endDateInput.parentNode.querySelector(".thai-date-display");

    if (startDateContainer) {
      startDateContainer.textContent = "เลือกวันที่";
    }

    if (endDateContainer) {
      endDateContainer.textContent = "เลือกวันที่";
    }

    // โหลดข้อมูลใหม่ด้วยค่าเริ่มต้น
    loadAllWasteData(oldStartDate, oldEndDate);
  });
}

/**
 * สร้างการ์ดสำหรับแสดงกราฟแต่ละประเภทขยะ
 */
function createDashboardCards() {
  const dashboardSection = document.getElementById("dashboard-sections");
  dashboardSection.innerHTML = "";

  // สร้างการ์ดสำหรับแต่ละประเภทขยะ
  wasteTypes.forEach((wasteType) => {
    const card = document.createElement("div");
    card.className = `waste-card type-${wasteType.id}`;
    card.id = `waste-card-${wasteType.id}`;

    // สร้างข้อความตามประเภทขยะ
    let typeText = "";

    switch (wasteType.id) {
      case 1:
        typeText = "ขยะทั่วไป";
        break;
      case 2:
        typeText = "ขยะรีไซเคิล";
        break;
      case 3:
        typeText = "ขยะอันตราย";
        break;
      case 4:
        typeText = "ขยะติดเชื้อ";
        break;
    }

    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">
          <i class="material-icons">${getWasteTypeIcon(wasteType.id)}</i>
          ${typeText}
        </h3>
        <div class="card-total">
          ปริมาณรวม: <span class="value" id="waste-total-${wasteType.id}">0.00</span> กก.
        </div>
      </div>
      <div class="card-content">
        <div class="chart-scroll-container" id="chart-container-${wasteType.id}">
          <div class="chart-inner-container">
            <canvas id="waste-chart-${wasteType.id}"></canvas>
          </div>
        </div>
      </div>
      <div class="card-footer" id="card-footer-${wasteType.id}"></div>
    `;

    dashboardSection.appendChild(card);

    // แสดงข้อความกำลังโหลด
    const chartContainer = document.getElementById(`chart-container-${wasteType.id}`);
    showLoading(chartContainer);
  });
}

/**
 * สร้างการ์ดสำหรับกราฟเปรียบเทียบขยะแต่ละประเภท
 */
function createComparisonCard() {
  const dashboardSection = document.getElementById("dashboard-sections");
  
  // สร้างการ์ดเปรียบเทียบขยะแต่ละประเภท
  const comparisonCard = document.createElement("div");
  comparisonCard.className = "waste-card comparison-card";
  comparisonCard.id = "waste-comparison-card";
  comparisonCard.style.gridColumn = "1 / -1"; // ให้การ์ดกินพื้นที่เต็มความกว้าง

  comparisonCard.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">
        <i class="material-icons">bar_chart</i>
        เปรียบเทียบปริมาณขยะแต่ละประเภท
      </h3>
    </div>
    <div class="card-content">
      <div class="chart-scroll-container comparison-chart-container" id="comparison-chart-container">
        <div class="chart-inner-container">
          <canvas id="waste-comparison-chart"></canvas>
        </div>
      </div>
    </div>
    <div class="card-footer" id="comparison-card-footer"></div>
  `;

  dashboardSection.appendChild(comparisonCard);

  // แสดงข้อความกำลังโหลด
  const chartContainer = document.getElementById("comparison-chart-container");
  showLoading(chartContainer);
}

/**
 * โหลดข้อมูลทั้งหมดสำหรับทุกประเภทขยะ
 * @param {string} startDate - วันที่เริ่มต้น
 * @param {string} endDate - วันที่สิ้นสุด
 */
async function loadAllWasteData(startDate = defaultStartDate, endDate = defaultEndDate) {
  try {
    // โหลดข้อมูลสำหรับแต่ละประเภทขยะ
    for (const wasteType of wasteTypes) {
      await loadWasteTypeData(wasteType.id, startDate, endDate);
    }
    
    // โหลดข้อมูลเปรียบเทียบขยะทุกประเภท
    await loadComparisonData(startDate, endDate);

    // รอให้การสร้างกราฟเสร็จสมบูรณ์ แล้วค่อยตั้งค่า click events
    setTimeout(() => {
      console.log("กำลังตั้งค่า click events หลังจากสร้างกราฟเสร็จ...");
      setupChartClickEvents();
    }, 1000);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
  }
}

/**
 * โหลดข้อมูลตามประเภทขยะและสร้างกราฟ
 * @param {number} wasteTypeId - รหัสประเภทขยะ
 * @param {string} startDate - วันที่เริ่มต้น
 * @param {string} endDate - วันที่สิ้นสุด
 */
async function loadWasteTypeData(wasteTypeId, startDate, endDate) {
  // แสดงข้อความกำลังโหลด
  const chartContainer = document.getElementById(`chart-container-${wasteTypeId}`);
  showLoading(chartContainer);

  try {
    // เรียกข้อมูลจาก API
    const response = await fetchMonthlyWasteData(wasteTypeId, startDate, endDate);

    if (!response.success) {
      throw new Error("ไม่สามารถดึงข้อมูลได้");
    }

    const { monthlyData, totalAmount } = response.data;

    // อัพเดตยอดรวม
    updateTotalAmount(wasteTypeId, totalAmount);

    // อัพเดตข้อความในส่วนท้ายการ์ด
    updateCardFooter(wasteTypeId, startDate, endDate);

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!monthlyData || monthlyData.length === 0) {
      showNoData(chartContainer);
      return;
    }

    // เตรียมข้อมูลสำหรับกราฟ
    const labels = monthlyData.map((item) => item.month_label);
    const data = monthlyData.map((item) => item.amount);

    // ล้าง chart container และสร้าง canvas ใหม่ให้สมบูรณ์
    chartContainer.innerHTML = "";

    // สร้างกราฟสำหรับกราฟ
    const chartInnerContainer = document.createElement("div");
    chartInnerContainer.className = "chart-inner-container";

    // กำหนดความกว้างตามจำนวนข้อมูล
    // ปรับปรุงการคำนวณความกว้าง: อย่างน้อย 500px และเพิ่มอีก 80px ต่อข้อมูลแต่ละตัว
    const minWidth = 500;
    const widthPerPoint = 100;
    const pointCount = labels.length;
    const calculatedWidth = Math.max(minWidth, pointCount * widthPerPoint);

    chartInnerContainer.style.width = `${calculatedWidth}px`;

    // สร้าง canvas สำหรับกราฟ
    const canvas = document.createElement("canvas");
    canvas.id = `waste-chart-${wasteTypeId}`;

    // เพิ่ม canvas เข้าไปใน container
    chartInnerContainer.appendChild(canvas);
    chartContainer.appendChild(chartInnerContainer);

    // รอให้ DOM อัพเดตก่อนสร้างกราฟ
    setTimeout(() => {
      try {
        // สร้างกราฟ
        createMonthlyLineChart(`waste-chart-${wasteTypeId}`, labels, data, wasteTypeId);
      } catch (err) {
        console.error(`เกิดข้อผิดพลาดในการสร้างกราฟ:`, err);
        showNoData(chartContainer, "เกิดข้อผิดพลาดในการสร้างกราฟ");
      }
    }, 0);
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการโหลดข้อมูลขยะประเภท ${wasteTypeId}:`, error);
    showNoData(chartContainer, "เกิดข้อผิดพลาดในการโหลดข้อมูล");
  }
}

/**
 * อัพเดตยอดรวมในการ์ด
 * @param {number} wasteTypeId - รหัสประเภทขยะ
 * @param {number} totalAmount - ปริมาณรวม
 */
function updateTotalAmount(wasteTypeId, totalAmount) {
  const totalElement = document.getElementById(`waste-total-${wasteTypeId}`);
  if (totalElement) {
    totalElement.textContent = formatNumber(totalAmount);
  }
}

/**
 * อัพเดตข้อความในส่วนท้ายการ์ด
 * @param {number} wasteTypeId - รหัสประเภทขยะ
 * @param {string} startDate - วันที่เริ่มต้น
 * @param {string} endDate - วันที่สิ้นสุด
 */
function updateCardFooter(wasteTypeId, startDate, endDate) {
  const footerElement = document.getElementById(`card-footer-${wasteTypeId}`);
  if (footerElement) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const startMonth = startDateObj.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
    const endMonth = endDateObj.toLocaleDateString("th-TH", { month: "short", year: "numeric" });

    footerElement.textContent = `ข้อมูลตั้งแต่ ${startMonth} ถึง ${endMonth}`;
  }
}

/**
 * โหลดข้อมูลเปรียบเทียบขยะทุกประเภทและสร้างกราฟ
 * @param {string} startDate - วันที่เริ่มต้น
 * @param {string} endDate - วันที่สิ้นสุด
 */
async function loadComparisonData(startDate, endDate) {
  // แสดงข้อความกำลังโหลด
  const chartContainer = document.getElementById("comparison-chart-container");
  showLoading(chartContainer);

  try {
    // เรียกข้อมูลจาก API
    const response = await fetchComparisonWasteData(startDate, endDate);

    if (!response.success) {
      throw new Error("ไม่สามารถดึงข้อมูลเปรียบเทียบได้");
    }

    const { monthLabels, datasets } = response.data;

    // อัพเดตข้อความในส่วนท้ายการ์ด
    updateComparisonCardFooter(startDate, endDate);

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!datasets || datasets.length === 0 || !monthLabels || monthLabels.length === 0) {
      showNoData(chartContainer);
      return;
    }

    // ล้าง chart container และสร้าง canvas ใหม่ให้สมบูรณ์
    chartContainer.innerHTML = "";

    // สร้างกราฟสำหรับกราฟ
    const chartInnerContainer = document.createElement("div");
    chartInnerContainer.className = "chart-inner-container";

    // กำหนดความกว้างตามจำนวนข้อมูล (มากกว่ากราฟปกติเพราะมีหลายชุดข้อมูล)
    const minWidth = 800; // เพิ่มความกว้างขั้นต่ำจาก 600px เป็น 800px
    const widthPerPoint = 220; // ลดจาก 220px เป็น 180px เพื่อให้แท่งกราฟมีขนาดใหญ่ขึ้น
    const pointCount = monthLabels.length;
    const calculatedWidth = Math.max(minWidth, pointCount * widthPerPoint);

    chartInnerContainer.style.width = `${calculatedWidth}px`;

    // สร้าง canvas สำหรับกราฟ
    const canvas = document.createElement("canvas");
    canvas.id = "waste-comparison-chart";

    // เพิ่ม canvas เข้าไปใน container
    chartInnerContainer.appendChild(canvas);
    chartContainer.appendChild(chartInnerContainer);

    // รอให้ DOM อัพเดตก่อนสร้างกราฟ
    setTimeout(() => {
      try {
        // สร้างกราฟเส้นเปรียบเทียบ
        createComparisonLineChart("waste-comparison-chart", monthLabels, datasets);
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการสร้างกราฟเปรียบเทียบ:", err);
        showNoData(chartContainer, "เกิดข้อผิดพลาดในการสร้างกราฟเปรียบเทียบ");
      }
    }, 0);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลเปรียบเทียบ:", error);
    showNoData(chartContainer, "เกิดข้อผิดพลาดในการโหลดข้อมูลเปรียบเทียบ");
  }
}

/**
 * อัพเดตข้อความในส่วนท้ายการ์ดเปรียบเทียบ
 * @param {string} startDate - วันที่เริ่มต้น
 * @param {string} endDate - วันที่สิ้นสุด
 */
function updateComparisonCardFooter(startDate, endDate) {
  const footerElement = document.getElementById("comparison-card-footer");
  if (footerElement) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    const startMonth = startDateObj.toLocaleDateString("th-TH", { month: "short", year: "numeric" });
    const endMonth = endDateObj.toLocaleDateString("th-TH", { month: "short", year: "numeric" });

    footerElement.textContent = `ข้อมูลตั้งแต่ ${startMonth} ถึง ${endMonth}`;
  }
}

/**
 * จัดการเมื่อมีการปรับขนาดหน้าจอ
 */
function handleResize() {
  // ปรับขนาดกราฟ
  wasteTypes.forEach((wasteType) => {
    const chartContainer = document.getElementById(`chart-container-${wasteType.id}`);
    if (chartContainer) {
      const canvas = document.getElementById(`waste-chart-${wasteType.id}`);
      if (canvas) {
        canvas.style.height = "100%";
      }
    }
  });
}
