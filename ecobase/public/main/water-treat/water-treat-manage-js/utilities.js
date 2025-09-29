// ฟังก์ชันอรรถประโยชน์ต่างๆ สำหรับใช้ในหน้าจัดการข้อมูลบำบัดน้ำ

// ฟังก์ชันสำหรับแปลงสถานะเป็น CSS class
export function getStatusClass(statusId) {
  switch (parseInt(statusId)) {
    case 1:
      return "status-normal"; // สีเขียว - ปกติ
    case 2:
      return "status-abnormal"; // สีแดง - ผิดปกติ
    case 3:
      return "status-maintenance"; // สีเหลือง - ซ่อมบำรุง
    case 4:
      return "status-inactive"; // สีเทา - ไม่ใช้งาน
    default:
      return ""; // ไม่มีสี สำหรับ "-"
  }
}

// ฟังก์ชันสำหรับแปลงสถานะเป็นข้อความ
export function getStatusText(statusId) {
  switch (parseInt(statusId)) {
    case 1:
      return "ปกติ";
    case 2:
      return "ผิดปกติ";
    case 3:
      return "ซ่อมบำรุง";
    case 4:
      return "ไม่ใช้งาน";
    default:
      return "ไม่ระบุ";
  }
}

// ฟังก์ชันสำหรับจัดรูปแบบวันที่
export function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลข
export function formatNumber(number) {
  if (number === null || number === undefined) return "-";
  return parseFloat(number).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ฟังก์ชัน wrapper สำหรับเรียก API
export async function callAPI(url, options = {}) {
  try {
    // เพิ่ม credentials ให้ทุกครั้ง
    const fetchOptions = {
      ...options,
      credentials: "include",
    };

    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      console.log("ไม่ได้เข้าสู่ระบบ หรือเซสชันหมดอายุ");
      // ถ้า 401 Unauthorized ให้นำทางไปหน้าล็อกอิน
      window.location.href = "/login";
      return null;
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเรียก API:", error);
    throw error;
  }
}

