/**
 * Utilities - ฟังก์ชันช่วยเหลือต่างๆ สำหรับระบบจัดการขยะ
 */

/**
 * จัดรูปแบบวันที่และเวลาเป็นรูปแบบไทย
 * @param {string} dateString วันที่ในรูปแบบ ISO หรือรูปแบบที่ JavaScript รองรับ
 * @returns {string} วันที่และเวลาในรูปแบบไทย
 */
export function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  
  // ตรวจสอบความถูกต้องของวันที่
  if (isNaN(date.getTime())) return "-";
  
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * จัดรูปแบบตัวเลขในรูปแบบไทย
 * @param {number} number ตัวเลขที่ต้องการจัดรูปแบบ
 * @returns {string} ตัวเลขในรูปแบบไทย
 */
export function formatNumber(number) {
  if (number === null || number === undefined) return "-";
  return parseFloat(number).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
} 