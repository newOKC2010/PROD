// เพิ่ม import ฟังก์ชัน checkAuthStatus จากไฟล์ script.js หลัก
//import { checkAuthStatus } from '/assets/common/script.js';

export function setupChartClickEvents() {
  // เพิ่ม event listener ให้กับทุกกราฟใน dashboard
  document.querySelectorAll(".chart-container canvas").forEach((canvas) => {
    canvas.addEventListener("click", handleChartClick);
  });
}

// ฟังก์ชันสำหรับแสดง loading indicator
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

// ฟังก์ชันสำหรับซ่อน loading indicator
function hideLoading() {
  const loadingEl = document.getElementById("loading-indicator");
  if (loadingEl) {
    loadingEl.style.display = "none";
  }
}

// ฟังก์ชันแสดง error modal
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

// ฟังก์ชันแปลงชื่ออุปกรณ์เป็นภาษาไทย
function getEquipmentThaiName(statusType) {
  switch (statusType) {
    case "treatment":
      return "ระบบบำบัด";
    case "pump":
      return "เครื่องสูบน้ำ";
    case "aerator":
      return "เครื่องเติมอากาศ";
    case "mixer":
      return "เครื่องกวนน้ำเสีย";
    case "chem-mixer":
      return "เครื่องกวนสารเคมี";
    case "sludge-pump":
      return "เครื่องสูบตะกอน";
    default:
      return "อุปกรณ์";
  }
}

// ฟังก์ชันแปลงรูปแบบวันที่เป็นไทย (รองรับหลายรูปแบบ)
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

// ฟังก์ชันจัดการเมื่อคลิกที่กราฟ
async function handleChartClick(event) {
  console.log("เกิดการคลิกที่กราฟ");

  try {
    // ตรวจสอบสถานะการเข้าสู่ระบบก่อนแสดงรายละเอียด
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

    // หาตำแหน่งที่คลิกและข้อมูลที่เกี่ยวข้อง
    const elements = chartInstance.getElementsAtEventForMode(event, "nearest", { intersect: true }, false);

    if (!elements || elements.length === 0) {
      console.log("ไม่พบข้อมูลที่ตำแหน่งที่คลิก");
      return;
    }

    // ดึงข้อมูลจากจุดที่คลิก
    const clickedElement = elements[0];
    const datasetIndex = clickedElement.datasetIndex;
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
      // อาจต้องปรับตามรูปแบบข้อมูลจริง
      const date = new Date();
      year = date.getFullYear().toString();
      month = (date.getMonth() + 1).toString().padStart(2, "0");
    }

    // ดึงชื่อ dataset และข้อมูลอื่นๆ ที่เกี่ยวข้อง
    const datasetLabel =
      datasetIndex >= 0 && chartInstance.data.datasets[datasetIndex]
        ? chartInstance.data.datasets[datasetIndex].label || ""
        : "";

    // ตรวจสอบว่าเป็นการคลิกที่กราฟสถานะหรือไม่
    let statusType = null;
    let statusCategory = null;

    if (chartId.includes("status")) {
      // ดึงชื่ออุปกรณ์จาก chartId (เช่น treatment-status-chart)
      statusType = chartId.replace("-status-chart", "");

      // ดึงประเภทสถานะจากตำแหน่งที่คลิก
      statusCategory = label;
      console.log(`คลิกที่สถานะ: ${statusType} - ${statusCategory}`);
    }

    // ดึงช่วงวันที่จากตัวกรอง
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    // ตรวจสอบว่าเป็นกราฟวงกลมหรือไม่
    const isPieChart = chartInstance.config.type === "pie" || chartInstance.config.type === "doughnut";

    if (isPieChart && chartId.includes("status")) {
      // สำหรับกราฟวงกลมสถานะอุปกรณ์ ใช้ช่วงวันที่ทั้งหมดที่เลือกในแดชบอร์ด
      showDataDetailModalRange(chartId, datasetLabel, datasetIndex, statusType, statusCategory);
    } else {
      // เรียกฟังก์ชันแสดงข้อมูลรายวันโดยส่งช่วงวันที่ที่กรองด้วย
      showDataDetailModalFiltered(year, month, chartId, datasetLabel, datasetIndex, startDate, endDate);
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการจัดการการคลิกกราฟ:", error);
  }
}

// ฟังก์ชันใหม่สำหรับแสดง Modal รายละเอียดข้อมูลแบบกรองตามช่วงวันที่
async function showDataDetailModalFiltered(year, month, sourceChartId, datasetLabel, datasetIndex, startDate, endDate) {
  try {
    // แสดง loading indicator
    showLoading();

    // สร้างวันที่เริ่มต้นของเดือนที่เลือก
    const selectedMonthStart = `${year}-${month}-01`;

    // สร้างวันที่สิ้นสุดของเดือนที่เลือก (วันสุดท้ายของเดือน)
    const lastDay = new Date(year, month, 0).getDate(); // วันสุดท้ายของเดือน
    const selectedMonthEnd = `${year}-${month}-${lastDay}`;

    // เปรียบเทียบและหาช่วงวันที่ที่ทับซ้อนกัน
    const effectiveStart = compareDates(selectedMonthStart, startDate) > 0 ? selectedMonthStart : startDate;
    const effectiveEnd = compareDates(selectedMonthEnd, endDate) < 0 ? selectedMonthEnd : endDate;

    console.log(`กำลังดึงข้อมูลรายวันสำหรับเดือน ${month}/${year} ในช่วง ${effectiveStart} ถึง ${effectiveEnd}`);

    // ดึงข้อมูลรายวันจาก API สำหรับช่วงวันที่ที่กรอง
    const response = await fetch(
      `/api/dashboard-data/daily-data-range?startDate=${effectiveStart}&endDate=${effectiveEnd}`
    );
    const data = await response.json();

    // ซ่อน loading indicator
    hideLoading();

    if (data.noData || !data.dailyData || data.dailyData.length === 0) {
      showErrorModal("ไม่พบข้อมูลรายวันในช่วงที่เลือก");
      return;
    }

    // สร้าง modal content ตามประเภทของกราฟที่คลิก
    let modalTitle = "";

    // กำหนดหัวข้อให้เฉพาะเจาะจงตามชุดข้อมูลที่เลือก
    if (sourceChartId.includes("wastewater")) {
      if (datasetLabel.includes("เข้าระบบ")) {
        modalTitle = "รายละเอียดน้ำเสียเข้าระบบรายวัน";
      } else if (datasetLabel.includes("ออกจากระบบ")) {
        modalTitle = "รายละเอียดน้ำออกจากระบบรายวัน";
      } else {
        modalTitle = "รายละเอียดปริมาณน้ำเสียรายวัน";
      }
    } else {
      // กำหนดหัวข้อตาม chart ID
      if (sourceChartId.includes("electricity")) {
        modalTitle = "รายละเอียดการใช้ไฟฟ้ารายวัน";
      } else if (sourceChartId.includes("water")) {
        modalTitle = "รายละเอียดการใช้น้ำรายวัน";
      } else if (sourceChartId.includes("chemical")) {
        modalTitle = "รายละเอียดการใช้สารเคมีรายวัน";
      } else if (sourceChartId.includes("ph")) {
        modalTitle = "รายละเอียดค่า pH รายวัน";
      } else if (sourceChartId.includes("chlorine")) {
        modalTitle = "รายละเอียดค่าคลอรีนตกค้างรายวัน";
      } else if (sourceChartId.includes("sludge")) {
        modalTitle = "รายละเอียดปริมาณตะกอนรายวัน";
      } else if (sourceChartId.includes("status")) {
        modalTitle = "รายละเอียดสถานะอุปกรณ์รายวัน";
      }
    }

    // เพิ่มข้อมูลช่วงวันที่ในหัวข้อ
    modalTitle += ` (${formatDateThai(effectiveStart)} - ${formatDateThai(effectiveEnd)})`;

    // สร้างตารางข้อมูลรายวัน
    const modalContent = createDailyDataTable(data.dailyData, sourceChartId, datasetLabel, datasetIndex);

    // แสดง modal
    showModal(modalTitle, modalContent);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายวัน:", error);
    hideLoading();
    showErrorModal("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
}

// ฟังก์ชันสำหรับแสดง Modal รายละเอียดข้อมูลแบบกรองตามช่วงวันที่และสถานะ
async function showDataDetailModalRange(chartId, datasetLabel, datasetIndex, statusType, statusCategory) {
  try {
    // แสดง loading indicator
    showLoading();

    // ดึงช่วงวันที่จากฟอร์มกรอง
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    console.log(`กำลังดึงข้อมูลรายวันระหว่าง ${startDate} ถึง ${endDate}`);

    // เรียก API สำหรับช่วงวันที่
    const response = await fetch(`/api/dashboard-data/daily-data-range?startDate=${startDate}&endDate=${endDate}`);
    const data = await response.json();

    // ซ่อน loading indicator
    hideLoading();

    if (data.noData || !data.dailyData || data.dailyData.length === 0) {
      showErrorModal("ไม่พบข้อมูลรายวันในช่วงเวลาที่เลือก");
      return;
    }

    // สร้าง modal content ตามประเภทของกราฟที่คลิก
    let modalTitle = "";

    // กำหนดหัวข้อสำหรับกราฟสถานะ
    if (chartId.includes("status")) {
      let equipmentName = "";

      // แปลงชื่ออุปกรณ์เป็นภาษาไทย
      equipmentName = getEquipmentThaiName(statusType);

      modalTitle = `รายละเอียดวันที่${equipmentName}มีสถานะ "${statusCategory}"`;
    } else {
      // กำหนดหัวข้อตาม chart ID
      if (chartId.includes("electricity")) {
        modalTitle = "รายละเอียดการใช้ไฟฟ้ารายวัน";
      } else if (chartId.includes("water")) {
        modalTitle = "รายละเอียดการใช้น้ำรายวัน";
      } else if (chartId.includes("wastewater")) {
        modalTitle = "รายละเอียดปริมาณน้ำเสียรายวัน";
      } else if (chartId.includes("chemical")) {
        modalTitle = "รายละเอียดการใช้สารเคมีรายวัน";
      } else if (chartId.includes("ph")) {
        modalTitle = "รายละเอียดค่า pH รายวัน";
      } else if (chartId.includes("chlorine")) {
        modalTitle = "รายละเอียดค่าคลอรีนตกค้างรายวัน";
      } else if (chartId.includes("sludge")) {
        modalTitle = "รายละเอียดปริมาณตะกอนรายวัน";
      }
    }

    // เพิ่มช่วงวันที่ในหัวข้อ
    modalTitle += ` (${formatDateThai(startDate)} - ${formatDateThai(endDate)})`;

    // สร้างตารางข้อมูลรายวัน
    const modalContent = createDailyDataTable(
      data.dailyData,
      chartId,
      datasetLabel,
      datasetIndex,
      statusType,
      statusCategory
    );

    // แสดง modal
    showModal(modalTitle, modalContent);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายวัน:", error);
    hideLoading();
    showErrorModal("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
}

// เพิ่ม Link ไปยัง CSS สำหรับ Modal
document.addEventListener("DOMContentLoaded", function () {
  // เพิ่ม Mitr font จาก Google Fonts
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Mitr:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(fontLink);

  // เพิ่ม link ไปยัง modal.css
  const cssLink = document.createElement("link");
  cssLink.rel = "stylesheet";
  cssLink.href = "/main/water-treat/water-treat-dashboard-css/modal.css";
  document.head.appendChild(cssLink);
});

// ฟังก์ชันเดิมที่ไม่ใช้แล้ว (เก็บไว้เพื่อการอ้างอิง แต่ไม่มีการเรียกใช้)
async function showDataDetailModal(year, month, sourceChartId, datasetLabel, datasetIndex) {
  try {
    // แสดง loading indicator
    showLoading();

    // ดึงข้อมูลรายวันจาก API
    const response = await fetch(`/api/dashboard-data/daily-data/${year}/${month}`);
    const data = await response.json();

    // ซ่อน loading indicator
    hideLoading();

    if (data.noData || !data.dailyData || data.dailyData.length === 0) {
      showErrorModal("ไม่พบข้อมูลรายวันในเดือนที่เลือก");
      return;
    }

    // สร้าง modal content ตามประเภทของกราฟที่คลิก
    let modalTitle = "";
    let modalContent = "";

    // กำหนดหัวข้อให้เฉพาะเจาะจงตามชุดข้อมูลที่เลือก
    if (sourceChartId.includes("wastewater")) {
      if (datasetLabel.includes("เข้าระบบ")) {
        modalTitle = "รายละเอียดน้ำเสียเข้าระบบรายวัน";
      } else if (datasetLabel.includes("ออกจากระบบ")) {
        modalTitle = "รายละเอียดน้ำออกจากระบบรายวัน";
      } else {
        modalTitle = "รายละเอียดปริมาณน้ำเสียรายวัน";
      }
    } else {
      // กำหนดหัวข้อตาม chart ที่คลิก
      if (sourceChartId.includes("electricity")) {
        modalTitle = "รายละเอียดการใช้ไฟฟ้ารายวัน";
      } else if (sourceChartId.includes("water")) {
        modalTitle = "รายละเอียดการใช้น้ำรายวัน";
      } else if (sourceChartId.includes("chemical")) {
        modalTitle = "รายละเอียดการใช้สารเคมีรายวัน";
      } else if (sourceChartId.includes("ph")) {
        modalTitle = "รายละเอียดค่า pH รายวัน";
      } else if (sourceChartId.includes("chlorine")) {
        modalTitle = "รายละเอียดค่าคลอรีนตกค้างรายวัน";
      } else if (sourceChartId.includes("sludge")) {
        modalTitle = "รายละเอียดปริมาณตะกอนรายวัน";
      } else if (sourceChartId.includes("status")) {
        modalTitle = "รายละเอียดสถานะอุปกรณ์รายวัน";
      }
    }

    // สร้างตารางข้อมูลรายวันพร้อมส่งข้อมูลเพิ่มเติม
    modalContent = createDailyDataTable(data.dailyData, sourceChartId, datasetLabel, datasetIndex);

    // แสดง modal
    showModal(modalTitle, modalContent);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรายวัน:", error);
    hideLoading();
    showErrorModal("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
}

// สร้างตารางข้อมูลรายวันตามประเภทของกราฟ
function createDailyDataTable(dailyData, sourceChartId, datasetLabel, datasetIndex, statusType, statusCategory) {
  let tableContent = '<div class="daily-data-table-container">';

  // กรองข้อมูลเฉพาะสถานะที่เลือก (ถ้ามีการเลือก)
  let filteredData = dailyData;
  if (sourceChartId.includes("status") && statusType && statusCategory) {
    const fieldName = getEquipmentThaiName(statusType);
    // กรองเฉพาะข้อมูลที่มีสถานะตรงกับที่เลือก
    filteredData = dailyData.filter((day) => day.สถานะ && day.สถานะ[fieldName] === statusCategory);

    // เพิ่มข้อมูลจำนวนรายการที่แสดง
    tableContent += `<div class="data-count">จำนวนข้อมูลทั้งหมด: ${filteredData.length} รายการ จากทั้งหมด ${dailyData.length} รายการ</div>`;
  } else {
    // เพิ่มข้อมูลจำนวนรายการที่แสดง
    tableContent += `<div class="data-count">จำนวนข้อมูลทั้งหมด: ${dailyData.length} รายการ</div>`;
  }

  tableContent += '<table class="daily-data-table">';
  tableContent += "<thead><tr><th>วันที่</th><th>เวลา</th>";

  // กำหนดคอลัมน์ตามประเภทของกราฟและชุดข้อมูลที่เลือก
  if (sourceChartId.includes("status")) {
    if (statusType && statusCategory) {
      // แสดงเฉพาะคอลัมน์อุปกรณ์ที่เลือก
      tableContent += `<th>สถานะ ${getEquipmentThaiName(statusType)}</th>`;
    } else {
      // แสดงสถานะทั้งหมด
      tableContent += "<th>สถานะระบบบำบัด</th>";
      tableContent += "<th>สถานะเครื่องสูบน้ำ</th>";
      tableContent += "<th>สถานะเครื่องเติมอากาศ</th>";
      tableContent += "<th>สถานะเครื่องกวนน้ำเสีย</th>";
      tableContent += "<th>สถานะเครื่องกวนสารเคมี</th>";
      tableContent += "<th>สถานะเครื่องสูบตะกอน</th>";
    }
  } else if (sourceChartId.includes("wastewater")) {
    if (datasetLabel && datasetLabel.includes("เข้าระบบ")) {
      tableContent += "<th>น้ำเสียเข้าระบบ (ลบ.ม.)</th>";
    } else if (datasetLabel && datasetLabel.includes("ออกจากระบบ")) {
      tableContent += "<th>น้ำออกจากระบบ (ลบ.ม.)</th>";
    } else {
      tableContent += "<th>น้ำเสียเข้าระบบ (ลบ.ม.)</th><th>น้ำออกจากระบบ (ลบ.ม.)</th>";
    }
  } else if (sourceChartId.includes("electricity")) {
    tableContent += "<th>การใช้ไฟฟ้า (kWh)</th>";
  } else if (sourceChartId.includes("water")) {
    tableContent += "<th>การใช้น้ำ (ลบ.ม.)</th>";
  } else if (sourceChartId.includes("chemical")) {
    tableContent += "<th>การใช้สารเคมี (กก.)</th>";
  } else if (sourceChartId.includes("ph")) {
    tableContent += "<th>ค่า pH</th>";
  } else if (sourceChartId.includes("chlorine")) {
    tableContent += "<th>คลอรีนตกค้าง (มก./ล.)</th>";
  } else if (sourceChartId.includes("sludge")) {
    tableContent += "<th>ปริมาณตะกอน (ลบ.ม.)</th>";
  }

  tableContent += "</tr></thead><tbody>";

  // เพิ่มข้อมูลแต่ละวัน
  filteredData.forEach((day) => {
    // แยกวันที่และเวลา
    const dateTimeParts = day.วันที่.split(" ");
    const dateStr = dateTimeParts[0];
    let time = "-";

    // แปลงรูปแบบวันที่ให้เป็นแบบไทย
    const formattedDate = formatDateThai(dateStr);

    // ถ้ามีเวลา (มีอย่างน้อย 2 ส่วน)
    if (dateTimeParts.length >= 2) {
      time = dateTimeParts[1];
      // ถ้ามีส่วนที่ 3 ขึ้นไป (เช่น น., AM, PM) ให้เพิ่มเข้าไปด้วย
      if (dateTimeParts.length > 2) {
        time += " " + dateTimeParts.slice(2).join(" ");
      }
    }

    tableContent += `<tr><td>${formattedDate}</td><td>${time}</td>`;

    if (sourceChartId.includes("status")) {
      if (statusType && statusCategory) {
        // แสดงเฉพาะสถานะของอุปกรณ์ที่เลือก
        const fieldName = getEquipmentThaiName(statusType);
        const statusValue = day.สถานะ && day.สถานะ[fieldName] !== null && day.สถานะ[fieldName] !== undefined ? day.สถานะ[fieldName] : "-";
        tableContent += `<td class="status ${getStatusClass(statusValue)}">${statusValue}</td>`;
      } else {
        // แสดงสถานะทั้งหมด
        const statusTreatment = day.สถานะ && day.สถานะ.ระบบบำบัด !== null && day.สถานะ.ระบบบำบัด !== undefined ? day.สถานะ.ระบบบำบัด : "-";
        const statusPump = day.สถานะ && day.สถานะ.เครื่องสูบน้ำ !== null && day.สถานะ.เครื่องสูบน้ำ !== undefined ? day.สถานะ.เครื่องสูบน้ำ : "-";
        const statusAerator = day.สถานะ && day.สถานะ.เครื่องเติมอากาศ !== null && day.สถานะ.เครื่องเติมอากาศ !== undefined ? day.สถานะ.เครื่องเติมอากาศ : "-";
        const statusMixer = day.สถานะ && day.สถานะ.เครื่องกวนน้ำเสีย !== null && day.สถานะ.เครื่องกวนน้ำเสีย !== undefined ? day.สถานะ.เครื่องกวนน้ำเสีย : "-";
        const statusChemMixer = day.สถานะ && day.สถานะ.เครื่องกวนสารเคมี !== null && day.สถานะ.เครื่องกวนสารเคมี !== undefined ? day.สถานะ.เครื่องกวนสารเคมี : "-";
        const statusSludgePump = day.สถานะ && day.สถานะ.เครื่องสูบตะกอน !== null && day.สถานะ.เครื่องสูบตะกอน !== undefined ? day.สถานะ.เครื่องสูบตะกอน : "-";
        
        tableContent += `<td class="status ${getStatusClass(statusTreatment)}">${statusTreatment}</td>`;
        tableContent += `<td class="status ${getStatusClass(statusPump)}">${statusPump}</td>`;
        tableContent += `<td class="status ${getStatusClass(statusAerator)}">${statusAerator}</td>`;
        tableContent += `<td class="status ${getStatusClass(statusMixer)}">${statusMixer}</td>`;
        tableContent += `<td class="status ${getStatusClass(statusChemMixer)}">${statusChemMixer}</td>`;
        tableContent += `<td class="status ${getStatusClass(statusSludgePump)}">${statusSludgePump}</td>`;
      }
    } else if (sourceChartId.includes("wastewater")) {
      if (datasetLabel && datasetLabel.includes("เข้าระบบ")) {
        const wastewaterIn = day.น้ำเสียเข้าระบบ !== null && day.น้ำเสียเข้าระบบ !== undefined ? day.น้ำเสียเข้าระบบ.replace(" ลบ.ม.", "") : "-";
        tableContent += `<td>${wastewaterIn}</td>`;
      } else if (datasetLabel && datasetLabel.includes("ออกจากระบบ")) {
        const wastewaterOut = day.น้ำออกจากระบบ !== null && day.น้ำออกจากระบบ !== undefined ? day.น้ำออกจากระบบ.replace(" ลบ.ม.", "") : "-";
        tableContent += `<td>${wastewaterOut}</td>`;
      } else {
        const wastewaterIn = day.น้ำเสียเข้าระบบ !== null && day.น้ำเสียเข้าระบบ !== undefined ? day.น้ำเสียเข้าระบบ.replace(" ลบ.ม.", "") : "-";
        const wastewaterOut = day.น้ำออกจากระบบ !== null && day.น้ำออกจากระบบ !== undefined ? day.น้ำออกจากระบบ.replace(" ลบ.ม.", "") : "-";
        tableContent += `<td>${wastewaterIn}</td>`;
        tableContent += `<td>${wastewaterOut}</td>`;
      }
    } else if (sourceChartId.includes("electricity")) {
      const electricity = day.การใช้ไฟฟ้า !== null && day.การใช้ไฟฟ้า !== undefined ? day.การใช้ไฟฟ้า.replace(" kWh", "") : "-";
      tableContent += `<td>${electricity}</td>`;
    } else if (sourceChartId.includes("water")) {
      const water = day.การใช้น้ำ !== null && day.การใช้น้ำ !== undefined ? day.การใช้น้ำ.replace(" ลบ.ม.", "") : "-";
      tableContent += `<td>${water}</td>`;
    } else if (sourceChartId.includes("chemical")) {
      const chemical = day.การใช้สารเคมี !== null && day.การใช้สารเคมี !== undefined ? day.การใช้สารเคมี.replace(" กก.", "") : "-";
      tableContent += `<td>${chemical}</td>`;
    } else if (sourceChartId.includes("ph")) {
      const ph = day.ค่า_pH !== null && day.ค่า_pH !== undefined ? day.ค่า_pH : "-";
      tableContent += `<td>${ph}</td>`;
    } else if (sourceChartId.includes("chlorine")) {
      const chlorine = day.คลอรีนตกค้าง !== null && day.คลอรีนตกค้าง !== undefined ? day.คลอรีนตกค้าง.replace(" มก./ล.", "") : "-";
      tableContent += `<td>${chlorine}</td>`;
    } else if (sourceChartId.includes("sludge")) {
      const sludge = day.ปริมาณตะกอน !== null && day.ปริมาณตะกอน !== undefined ? day.ปริมาณตะกอน.replace(" ลบ.ม.", "") : "-";
      tableContent += `<td>${sludge}</td>`;
    }

    tableContent += "</tr>";
  });

  // ถ้าไม่มีข้อมูลหลังจากกรอง
  if (filteredData.length === 0) {
    const colspan =
      sourceChartId.includes("status") && statusType
        ? 3
        : sourceChartId.includes("status")
        ? 8
        : sourceChartId.includes("wastewater") && !datasetLabel
        ? 4
        : 3;

    tableContent += `<tr><td colspan="${colspan}" class="no-data">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</td></tr>`;
  }

  tableContent += "</tbody></table></div>";
  return tableContent;
}

// ฟังก์ชันเปรียบเทียบวันที่ (ส่งค่ากลับเป็น -1, 0, 1)
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

// ฟังก์ชันช่วยแปลงสถานะเป็น class สำหรับ CSS
function getStatusClass(status) {
  switch (status) {
    case "ปกติ":
      return "status-normal";
    case "ผิดปกติ":
      return "status-abnormal";
    case "ซ่อมบำรุง":
      return "status-maintenance";
    case "ไม่ใช้งาน":
      return "status-inactive";
    default:
      return "status-unknown";
  }
}

// ฟังก์ชันแสดง Modal
function showModal(title, content) {
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
            <div class="modal-header">
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
