// โมดูลสำหรับฟังก์ชันอรรถประโยชน์ต่างๆ

// ฟังก์ชันสำหรับจัดรูปแบบวันที่และเวลา
export function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ฟังก์ชันสำหรับจัดรูปแบบเดือนและปี
export function formatMonthYear(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  return date.toLocaleString("th-TH", {
    month: "short",
    year: "numeric",
  });
}

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลข
export function formatNumber(value) {
  if (value === null || value === undefined) return "0";

  // แปลงเป็นตัวเลขสำหรับการคำนวณ
  const num = parseFloat(value);

  // ตรวจสอบค่า NaN
  if (isNaN(num)) return "0";

  // ถ้าเป็นจำนวนเต็ม ไม่ต้องแสดงทศนิยม
  if (Number.isInteger(num)) return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // ถ้ามีทศนิยม แสดงทศนิยม 2 ตำแหน่ง
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ฟังก์ชันสำหรับแสดง loading indicator
export function showLoading() {
  // เลือกทุก section
  const sections = document.querySelectorAll(".dashboard-section");

  sections.forEach((section) => {
    // สร้าง loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading-indicator";

    const spinner = document.createElement("div");
    spinner.className = "spinner";

    loadingDiv.appendChild(spinner);

    // ล้างข้อมูลเดิมและแสดง loading
    const cardGrid = section.querySelector(".card-grid");
    if (cardGrid) {
      cardGrid.innerHTML = "";
      cardGrid.appendChild(loadingDiv);
    }
  });
}

// ฟังก์ชันสำหรับซ่อน loading indicator
export function hideLoading() {
  const loadingIndicators = document.querySelectorAll(".loading-indicator");
  loadingIndicators.forEach((indicator) => {
    indicator.remove();
  });
}

// ฟังก์ชันสำหรับตรวจสอบว่าเป็นอุปกรณ์มือถือหรือไม่
export function isMobileDevice() {
  return window.innerWidth <= 768;
}
