// import จาก api.js
import { fetchDailyWasteData } from './api.js';
import { parseThaiDate } from './utilities.js'
 
/**
 * ตั้งค่าเหตุการณ์คลิกที่กราฟทั้งหมด
 */
export function setupChartClickEvents() {
//  console.log("กำลังตั้งค่า event click สำหรับกราฟ...");
  
  // เลือก canvas ทั้งหมดในหน้า
  const canvasElements = document.querySelectorAll("canvas");
 // console.log(`พบ canvas ทั้งหมด ${canvasElements.length} อัน`);
  
  // เพิ่ม event listener ให้กับทุกกราฟที่มี ID ที่เกี่ยวข้องกับขยะ
  canvasElements.forEach((canvas) => {
    if (canvas.id && canvas.id.includes("waste-chart")) {
     // console.log(`เพิ่ม click event ให้กับ canvas ID: ${canvas.id}`);
      canvas.addEventListener("click", handleChartClick);
      
      // เพิ่ม style cursor: pointer เพื่อให้รู้ว่าสามารถคลิกได้
      canvas.style.cursor = "pointer";
    }
  });
}

/**
 * ฟังก์ชันจัดการเมื่อคลิกที่กราฟ
 * @param {Event} event - เหตุการณ์คลิก
 */
async function handleChartClick(event) {
  console.log("เกิดการคลิกที่กราฟ", event.target.id);
  
  try {

    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบก่อนดูรายละเอียดรายวัน");
      return;
    }
    // หา chart instance จาก canvas ที่ถูกคลิก
    const chartId = event.target.id;
    if (!chartId) {
      console.error("ไม่พบ ID ของ canvas");
      return;
    }

    const chartInstance = Chart.getChart(chartId);
    if (!chartInstance) {
      console.error(`ไม่พบ chart instance สำหรับ ID: ${chartId}`);
      return;
    }

    console.log(`พบ chart instance: ${chartId}`);

    // ตรวจสอบว่าเป็นกราฟประเภทขยะหรือไม่ (ไม่ใช่กราฟเปรียบเทียบ)
    const isComparisonChart = chartId === "waste-comparison-chart";
    if (isComparisonChart) {
      console.log("เป็นกราฟเปรียบเทียบ ไม่แสดง modal");
      return;
    }

    // หาตำแหน่งที่คลิกและข้อมูลที่เกี่ยวข้อง
    const elements = chartInstance.getElementsAtEventForMode(
      event,
      "nearest",
      { intersect: true },
      false
    );

    if (!elements || elements.length === 0) {
      console.log("ไม่พบข้อมูลที่ตำแหน่งที่คลิก");
      return;
    }

    // ดึงข้อมูลจากจุดที่คลิก
    const clickedElement = elements[0];
    const dataIndex = clickedElement.index;

    // ดึงข้อมูลเดือนและปีจากจุดที่คลิก
    const label = chartInstance.data.labels[dataIndex];

    // แยกเดือนและปีจาก label (เช่น "ม.ค. 2567")
    const monthMapping = {
      "ม.ค.": "01",
      "ก.พ.": "02",
      "มี.ค.": "03",
      "เม.ย.": "04",
      "พ.ค.": "05",
      "มิ.ย.": "06",
      "ก.ค.": "07",
      "ส.ค.": "08",
      "ก.ย.": "09",
      "ต.ค.": "10",
      "พ.ย.": "11",
      "ธ.ค.": "12",
    };

    let year, month;

    // กรณีที่ label เป็นรูปแบบ "ม.ค. 2567"
    const labelParts = String(label).split(" ");
    if (labelParts.length === 2) {
      month = monthMapping[labelParts[0]];
      year = labelParts[1];

      // แปลง พ.ศ. เป็น ค.ศ.
      if (parseInt(year) > 2400) {
        year = (parseInt(year) - 543).toString();
      }
    } else {
      // กรณีอื่นๆ ให้พยายามแยกจาก format อื่น
      const date = new Date();
      year = date.getFullYear().toString();
      month = (date.getMonth() + 1).toString().padStart(2, "0");
    }

    // ดึงข้อมูลประเภทขยะจาก chartId
    let wasteTypeId = null;
    
    // กราฟของประเภทขยะเดียว ดึงรหัสประเภทขยะจาก ID ของกราฟ
    if (chartId.includes("waste-chart-")) {
      wasteTypeId = parseInt(chartId.replace("waste-chart-", ""));
    }

    if (!wasteTypeId) {
      console.error("ไม่สามารถระบุประเภทขยะได้");
      return;
    }

    // ดึงช่วงวันที่จากตัวกรอง
    const startDateElement = document.getElementById("start-date");
    const endDateElement = document.getElementById("end-date");
    
    if (!startDateElement || !endDateElement) {
      console.error("ไม่พบอิลิเมนต์ input สำหรับวันที่");
      return;
    }
    
    const startDate = startDateElement.value;
    const endDate = endDateElement.value;

    // สร้างวันที่เริ่มต้นของเดือนที่เลือก
    const selectedMonthStart = `${year}-${month}-01`;

    // สร้างวันที่สิ้นสุดของเดือนที่เลือก (วันสุดท้ายของเดือน)
    const lastDay = new Date(year, month, 0).getDate();
    const selectedMonthEnd = `${year}-${month}-${lastDay}`;

    // เปรียบเทียบและหาช่วงวันที่ที่ทับซ้อนกัน
    const effectiveStart = compareDates(selectedMonthStart, startDate) > 0 ? selectedMonthStart : startDate;
    const effectiveEnd = compareDates(selectedMonthEnd, endDate) < 0 ? selectedMonthEnd : endDate;

    console.log(`กำลังดึงข้อมูลรายวันสำหรับเดือน ${month}/${year} ในช่วง ${effectiveStart} ถึง ${effectiveEnd}`);

    // แสดง modal พร้อมข้อมูลรายวัน
    showDataDetailModal(effectiveStart, effectiveEnd, wasteTypeId);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการจัดการการคลิกกราฟ:", error);
    showErrorModal("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
}

/**
 * เปรียบเทียบวันที่ 2 วัน
 * @param {string} date1 - วันที่แรก (YYYY-MM-DD)
 * @param {string} date2 - วันที่สอง (YYYY-MM-DD)
 * @returns {number} -1 ถ้า date1 < date2, 0 ถ้าเท่ากัน, 1 ถ้า date1 > date2
 */
function compareDates(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // ตัดเวลาออกเพื่อเทียบเฉพาะวันที่
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * แสดงข้อมูลรายวันในรูปแบบ modal
 * @param {string} startDate - วันที่เริ่มต้น
 * @param {string} endDate - วันที่สิ้นสุด
 * @param {number} wasteTypeId - รหัสประเภทขยะ
 */
async function showDataDetailModal(startDate, endDate, wasteTypeId) {
  try {
    // แสดง loading indicator
    showLoading();

    // ดึงข้อมูลรายวันจาก API
    const data = await fetchDailyWasteData(startDate, endDate, wasteTypeId);

    // ซ่อน loading indicator
    hideLoading();

    if (data.noData || !data.dailyData || data.dailyData.length === 0) {
      showErrorModal("ไม่พบข้อมูลรายวันในช่วงที่เลือก");
      return;
    }

    // สร้าง modal content ตามประเภทของกราฟที่คลิก
    let modalTitle = "";
    let headerClass = "";

    // กำหนดหัวข้อและสีพื้นหลังตามประเภทขยะ
    switch (wasteTypeId) {
      case 1:
        modalTitle = "รายละเอียดปริมาณขยะทั่วไปรายวัน";
        headerClass = "general-waste";
        break;
      case 2:
        modalTitle = "รายละเอียดปริมาณขยะรีไซเคิลรายวัน";
        headerClass = "recyclable-waste";
        break;
      case 3:
        modalTitle = "รายละเอียดปริมาณขยะอันตรายรายวัน";
        headerClass = "hazardous-waste";
        break;
      case 4:
        modalTitle = "รายละเอียดปริมาณขยะติดเชื้อรายวัน";
        headerClass = "infectious-waste";
        break;
      default:
        modalTitle = "รายละเอียดปริมาณขยะรายวัน";
        headerClass = "comparison";
    }

    // เพิ่มข้อมูลช่วงวันที่ในหัวข้อ
    modalTitle += ` (${formatDateThai(startDate)} - ${formatDateThai(endDate)})`;

    // สร้างตารางข้อมูลรายวัน
    const modalContent = createDailyDataTable(data.dailyData);

    // แสดง modal
    showModal(modalTitle, modalContent, headerClass);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายวัน:", error);
    hideLoading();
    showErrorModal("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
}

/**
 * ฟังก์ชันแปลงรูปแบบวันที่เป็นไทย
 * @param {string} dateStr - วันที่ในรูปแบบ YYYY-MM-DD
 * @returns {string} วันที่ในรูปแบบ dd MMM YYYY แบบไทย
 */
function formatDateThai(dateStr) {
  // ตรวจสอบรูปแบบวันที่
  if (!dateStr) return "-";

  try {
    // กรณีวันที่เป็นรูปแบบ yyyy-mm-dd
    if (dateStr.includes("-")) {
      const dateParts = dateStr.split("-");
      if (dateParts.length !== 3) return dateStr;

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);

      // ชื่อเดือนภาษาไทยแบบย่อ
      const thaiMonthsShort = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];

      // คำนวณปี พ.ศ.
      const thaiYear = year + 543;

      // ใช้ชื่อเดือนแบบย่อ
      return `${day} ${thaiMonthsShort[month - 1]} ${thaiYear}`;
    }
    // กรณีวันที่เป็นรูปแบบ dd/mm/yyyy
    else if (dateStr.includes("/")) {
      const dateParts = dateStr.split("/");
      if (dateParts.length !== 3) return dateStr;

      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10);
      const year = parseInt(dateParts[2], 10);

      // ชื่อเดือนภาษาไทยแบบย่อ
      const thaiMonthsShort = [
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
      ];

      return `${day} ${thaiMonthsShort[month - 1]} ${year}`;
    }

    // กรณีรูปแบบอื่นๆ ส่งคืนค่าเดิม
    return dateStr;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการแปลงวันที่:", error);
    return dateStr;
  }
}

/**
 * สร้างตารางข้อมูลรายวัน
 * @param {Array} dailyData - ข้อมูลรายวัน
 * @returns {string} HTML ของตารางข้อมูล
 */
function createDailyDataTable(dailyData) {
  let tableContent = '<div class="daily-data-table-container">';

  // เพิ่มข้อมูลจำนวนรายการที่แสดง
  tableContent += `<div class="data-count">จำนวนข้อมูลทั้งหมด: ${dailyData.length} รายการ</div>`;

  tableContent += '<table class="daily-data-table">';
  tableContent += "<thead><tr><th>วันที่/เวลา</th><th>ปริมาณ (กก.)</th></tr></thead><tbody>";

  // เรียงข้อมูลตามวันที่จากน้อยไปมาก
  const sortedData = [...dailyData].sort((a, b) => {
    // แปลงรูปแบบวันที่ไทยให้เป็นวัตถุ Date เพื่อเปรียบเทียบ
    const dateA = parseThaiDate(a.วันที่);
    const dateB = parseThaiDate(b.วันที่);
    return dateA - dateB; // เรียงจากเก่าไปใหม่
  });

  // เพิ่มข้อมูลแต่ละวัน
  sortedData.forEach((day) => {
    // แสดงวันที่และเวลาในคอลัมน์เดียวกัน
    const dateTimeStr = day.วันที่;
    
    tableContent += `<tr><td>${dateTimeStr}</td>`;

    // เพิ่มคอลัมน์ปริมาณ
    tableContent += `<td>${day.ปริมาณ.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}</td>`;

    tableContent += "</tr>";
  });

  // ถ้าไม่มีข้อมูล
  if (dailyData.length === 0) {
    tableContent += `<tr><td colspan="2" class="no-data">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>`;
  }

  tableContent += "</tbody></table></div>";
  return tableContent;
}

/**
 * แสดง modal
 * @param {string} title - หัวข้อ modal
 * @param {string} content - เนื้อหา HTML ของ modal
 * @param {string} headerClass - class สำหรับกำหนดสีพื้นหลังของหัวข้อ
 */
function showModal(title, content, headerClass = "") {
  // สร้าง modal ถ้ายังไม่มี
  let modalContainer = document.getElementById("data-detail-modal");

  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "data-detail-modal";
    modalContainer.className = "modal-container";
    document.body.appendChild(modalContainer);
  }

  // สร้าง HTML content สำหรับ modal
  modalContainer.innerHTML = `
    <div class="modal-content">
      <div class="modal-header ${headerClass}">
        <h2>${title}</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        <span class="modal-note">คลิกที่พื้นที่รอบๆ เพื่อปิด</span>
      </div>
    </div>
  `;

  // แสดง modal
  modalContainer.style.display = "flex";

  // เพิ่ม event listener สำหรับปุ่มปิด
  const closeButton = modalContainer.querySelector(".close-modal");
  closeButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
  });

  // ปิด modal เมื่อคลิกพื้นที่ภายนอก
  modalContainer.addEventListener("click", (event) => {
    if (event.target === modalContainer) {
      modalContainer.style.display = "none";
    }
  });

  // ปรับตำแหน่งของ modal ให้อยู่ตรงกลางในกรณีที่เนื้อหายาว
  const modalContent = modalContainer.querySelector(".modal-content");
  const windowHeight = window.innerHeight;
  if (modalContent.offsetHeight > windowHeight * 0.9) {
    modalContent.style.height = `${windowHeight * 0.9}px`;
    modalContent.querySelector(".modal-body").style.overflow = "auto";
  }
}

/**
 * แสดง error modal
 * @param {string} message - ข้อความแสดงข้อผิดพลาด
 */
function showErrorModal(message) {
  let errorContainer = document.getElementById("error-modal");

  if (!errorContainer) {
    errorContainer = document.createElement("div");
    errorContainer.id = "error-modal";
    errorContainer.className = "modal-container";
    document.body.appendChild(errorContainer);
  }

  errorContainer.innerHTML = `
    <div class="modal-content error-content">
      <div class="modal-header">
        <h2>แจ้งเตือน</h2>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p>${message}</p>
      </div>
    </div>
  `;

  errorContainer.style.display = "flex";

  const closeButton = errorContainer.querySelector(".close-modal");
  closeButton.addEventListener("click", () => {
    errorContainer.style.display = "none";
  });

  errorContainer.addEventListener("click", (event) => {
    if (event.target === errorContainer) {
      errorContainer.style.display = "none";
    }
  });
}

/**
 * แสดง loading indicator
 */
function showLoading() {
  let loadingEl = document.getElementById("loading-indicator");

  if (!loadingEl) {
    loadingEl = document.createElement("div");
    loadingEl.id = "loading-indicator";
    loadingEl.className = "loading-container";
    loadingEl.innerHTML = `
      <div class="loading-spinner"></div>
      <p>กำลังโหลดข้อมูล...</p>
    `;
    document.body.appendChild(loadingEl);
  }

  loadingEl.style.display = "flex";
}

/**
 * ซ่อน loading indicator
 */
function hideLoading() {
  const loadingEl = document.getElementById("loading-indicator");
  if (loadingEl) {
    loadingEl.style.display = "none";
  }
}

// เพิ่ม Link ไปยัง CSS สำหรับ Modal เมื่อโหลดหน้า
document.addEventListener("DOMContentLoaded", function () {
  // เพิ่ม Mitr font จาก Google Fonts
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Mitr:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(fontLink);

  // เพิ่ม link ไปยัง modal.css
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = "/main/waste/waste-dashboard-css/modal.css";
  document.head.appendChild(cssLink);
}); 