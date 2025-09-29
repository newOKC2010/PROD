// โมดูลสำหรับการจัดการข้อมูลสถานะต่างๆ

import { callAPI } from "./utilities.js";

// เก็บข้อมูลสถานะอุปกรณ์
let equipmentStatusList = [
  { status_id: 1, status_name: "ปกติ" },
  { status_id: 2, status_name: "ผิดปกติ" },
  { status_id: 3, status_name: "ซ่อมบำรุง" },
  { status_id: 4, status_name: "ไม่ใช้งาน" },
];

// ฟังก์ชันสำหรับโหลดข้อมูลสถานะอุปกรณ์
export async function loadEquipmentStatus() {
  try {
    // เรียกใช้งาน API ผ่าน callAPI
    const result = await callAPI("/api/equipment-status");

    if (result && result.success) {
      equipmentStatusList = result.data;
      return equipmentStatusList;
    } else {
      throw new Error(result?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลสถานะอุปกรณ์");
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสถานะอุปกรณ์:", error);
    // ถ้ามีข้อผิดพลาด ให้ใช้ข้อมูลทดแทนที่กำหนดไว้
    console.log("ใช้ข้อมูลสถานะอุปกรณ์แบบทดแทน (ค่าเริ่มต้น)");
    return equipmentStatusList;
  }
}

// ฟังก์ชันสำหรับสร้าง dropdown ของสถานะอุปกรณ์
export function createStatusDropdown(selectElement, selectedValue = 1) {
  selectElement.innerHTML = "";

  equipmentStatusList.forEach((status) => {
    const option = document.createElement("option");
    option.value = status.status_id;
    option.textContent = status.status_name;
    if (parseInt(selectedValue) === status.status_id) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });
}

// ฟังก์ชันสำหรับดึงข้อมูลชื่อสถานะจาก ID
export function getStatusNameById(statusId) {
  const status = equipmentStatusList.find((s) => s.status_id === parseInt(statusId));
  return status ? status.status_name : "ไม่ระบุ";
}
