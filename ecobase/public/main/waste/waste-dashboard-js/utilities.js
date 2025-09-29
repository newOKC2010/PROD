/**
 * ไฟล์สำหรับฟังก์ชันช่วยเหลือทั่วไป
 */

/**
 * จัดรูปแบบวันที่เป็นข้อความ
 * @param {string|Date} date - วันที่ที่ต้องการจัดรูปแบบ
 * @returns {string} วันที่ในรูปแบบ dd/mm/yyyy
 */
export function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * จัดรูปแบบตัวเลขเป็นข้อความที่มีหน่วย
 * @param {number} value - ค่าที่ต้องการจัดรูปแบบ
 * @returns {string} ตัวเลขที่มีการคั่นหลักพันและมีทศนิยม 2 ตำแหน่ง
 */
export function formatNumber(value) {
  return Number(value).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * สร้าง element และกำหนด attribute
 * @param {string} tag - ชื่อ tag ของ element
 * @param {Object} attributes - attribute ที่ต้องการกำหนด
 * @param {string|Node} content - เนื้อหาของ element
 * @returns {HTMLElement} element ที่สร้างขึ้น
 */
export function createElement(tag, attributes = {}, content = "") {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "className") {
      element.className = value;
    } else {
      element.setAttribute(key, value);
    }
  });

  if (typeof content === "string") {
    element.innerHTML = content;
  } else if (content instanceof Node) {
    element.appendChild(content);
  }

  return element;
}

/**
 * แบ่งข้อมูลตามเดือน
 * @param {Array} data - ข้อมูลที่ต้องการแบ่ง
 * @param {string} dateField - ชื่อฟิลด์ที่เก็บวันที่
 * @returns {Object} ข้อมูลที่แบ่งตามเดือน
 */
export function groupDataByMonth(data, dateField = "recorded_date") {
  const months = {};

  data.forEach((item) => {
    const date = new Date(item[dateField]);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!months[monthKey]) {
      const monthName = new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString("th-TH", {
        month: "short",
        year: "numeric",
      });

      months[monthKey] = {
        key: monthKey,
        label: monthName,
        data: [],
      };
    }

    months[monthKey].data.push(item);
  });

  return Object.values(months).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * คำนวณจำนวนเดือนระหว่างสองวันที่
 * @param {string|Date} startDate - วันที่เริ่มต้น
 * @param {string|Date} endDate - วันที่สิ้นสุด
 * @returns {number} จำนวนเดือน
 */
export function getMonthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
}

/**
 * สร้างรายการเดือนระหว่างช่วงเวลา
 * @param {string|Date} startDate - วันที่เริ่มต้น
 * @param {string|Date} endDate - วันที่สิ้นสุด
 * @returns {Array} รายการเดือนในรูปแบบ { key, label }
 */
export function generateMonthLabels(startDate, endDate) {
  const start = new Date(startDate);
  start.setDate(1); // ตั้งเป็นวันที่ 1 ของเดือน

  const end = new Date(endDate);
  end.setDate(1); // ตั้งเป็นวันที่ 1 ของเดือน

  const months = [];
  const current = new Date(start);

  while (current <= end) {
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    const label = current.toLocaleDateString("th-TH", { month: "short", year: "numeric" });

    months.push({ key, label });

    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

/**
 * แสดงข้อความโหลดข้อมูล
 * @param {HTMLElement} container - element ที่ต้องการแสดงข้อความ
 * @param {string} message - ข้อความที่ต้องการแสดง
 */
export function showLoading(container, message = "กำลังโหลดข้อมูล...") {
  // ตรวจสอบว่ามี chart-inner-container อยู่แล้วหรือไม่
  const chartInnerContainer = container.querySelector(".chart-inner-container");

  if (chartInnerContainer) {
    // ถ้ามีแล้ว เราจะแทรก loading indicator ไว้ข้างใน
    chartInnerContainer.innerHTML = "";

    const loadingElement = createElement(
      "div",
      { className: "loading-indicator" },
      `
      <div class="loading-spinner"></div>
      <div>${message}</div>
    `
    );

    chartInnerContainer.appendChild(loadingElement);
  } else {
    // กรณีไม่มี เราจะล้างและสร้างใหม่
    container.innerHTML = "";

    const loadingElement = createElement(
      "div",
      { className: "loading-indicator" },
      `
      <div class="loading-spinner"></div>
      <div>${message}</div>
    `
    );

    container.appendChild(loadingElement);
  }
}

/**
 * แสดงข้อความเมื่อไม่มีข้อมูล
 * @param {HTMLElement} container - element ที่ต้องการแสดงข้อความ
 * @param {string} message - ข้อความที่ต้องการแสดง
 */
export function showNoData(container, message = "ไม่พบข้อมูล") {
  // ตรวจสอบว่ามี chart-inner-container อยู่แล้วหรือไม่
  const chartInnerContainer = container.querySelector(".chart-inner-container");

  if (chartInnerContainer) {
    // ถ้ามีแล้ว เราจะแทรก no-data message ไว้ข้างใน
    chartInnerContainer.innerHTML = "";

    const noDataElement = createElement(
      "div",
      { className: "no-data-message" },
      `
      <i class="material-icons">info</i>
      <div>${message}</div>
    `
    );

    chartInnerContainer.appendChild(noDataElement);
  } else {
    // กรณีไม่มี เราจะล้างและสร้างใหม่
    container.innerHTML = "";

    const noDataElement = createElement(
      "div",
      { className: "no-data-message" },
      `
      <i class="material-icons">info</i>
      <div>${message}</div>
    `
    );

    container.appendChild(noDataElement);
  }
}

/**
 * กำหนดความกว้างของกราฟตามจำนวนข้อมูล
 * @param {number} dataPoints - จำนวนจุดข้อมูล
 * @returns {number} ความกว้างที่เหมาะสม
 */
export function calculateChartWidth(dataPoints) {
  // กำหนดความกว้างขั้นต่ำและความกว้างต่อจุดข้อมูล
  const minWidth = 300;
  const widthPerPoint = 60;

  return Math.max(minWidth, dataPoints * widthPerPoint);
}


/* แปลงวันที่ภาษาไทยเป็นวัตถุ Date
* @param {string} thaiDateStr - วันที่ในรูปแบบภาษาไทย เช่น "30 เม.ย. 2568 22:57"
* @returns {Date} วัตถุ Date
*/
export function parseThaiDate(thaiDateStr) {
 try {
   // แยกวันที่และเวลา
   const parts = thaiDateStr.split(' ');
   if (parts.length < 3) return new Date(); // กรณีรูปแบบไม่ถูกต้อง

   const day = parseInt(parts[0]);
   const thaiMonth = parts[1]; // เช่น "ม.ค."
   const yearBE = parseInt(parts[2]); // ปี พ.ศ.
   const time = parts[3] || "00:00"; // เวลา (ถ้ามี)

   // แปลงเดือนภาษาไทยเป็นตัวเลข
   const monthMapping = {
     "ม.ค.": 0, "ก.พ.": 1, "มี.ค.": 2, "เม.ย.": 3,
     "พ.ค.": 4, "มิ.ย.": 5, "ก.ค.": 6, "ส.ค.": 7,
     "ก.ย.": 8, "ต.ค.": 9, "พ.ย.": 10, "ธ.ค.": 11
   };
   
   const month = monthMapping[thaiMonth] || 0;
   const yearCE = yearBE - 543; // แปลงปี พ.ศ. เป็น ค.ศ.
   
   // แยกชั่วโมงและนาที
   const [hours, minutes] = time.split(':').map(Number);
   
   // สร้างวัตถุ Date
   return new Date(yearCE, month, day, hours, minutes);
 } catch (error) {
   console.error("เกิดข้อผิดพลาดในการแปลงวันที่:", error);
   return new Date(); // กรณีเกิดข้อผิดพลาด
 }
}
