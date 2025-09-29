/**
 * ไฟล์หลักสำหรับหน้าจัดการขยะ
 * รวมการทำงานจากทุกโมดูลเข้าด้วยกัน
 */

import eventSourceManager from "../../assets/common/eventSourceManager.js";
import modalManager from "./waste-manage-js/modal.js";
import tableManager from "./waste-manage-js/tableManager.js";
import paginationManager from "./waste-manage-js/paginationManager.js";
import { setUserInfo } from "./waste-manage-js/userService.js";
import { formatDate, formatNumber } from "./waste-manage-js/utilities.js";

// ตัวแปรและองค์ประกอบ DOM
const searchBtn = document.getElementById("search-btn");
const resetSearchBtn = document.getElementById("reset-search-btn");
const exportExcelBtn = document.getElementById("export-excel-btn");
const addNewDataBtn = document.getElementById("add-new-data-btn");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

/**
 * ฟังก์ชั่นเริ่มต้นการทำงาน
 */
async function init() {
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  await checkAuthStatusLogin();

  // ตั้งค่า event listeners
  setupEventListeners();

  // โหลดข้อมูลเริ่มต้น
  await loadInitialData();

  // เชื่อมต่อกับ SSE
  connectToSSE();

  console.log("ระบบจัดการขยะเริ่มต้นทำงานแล้ว");
}

/**
 * ตรวจสอบสถานะการเข้าสู่ระบบ
 */
async function checkAuthStatusLogin() {
  try {
    const response = await fetch("/api/auth/status");
    const data = await response.json();

    if (!data.isAuthenticated) {
      // ถ้าไม่ได้เข้าสู่ระบบ ให้ redirect ไปหน้า login
      window.location.href = "/login";
      return data;
    }

    // เก็บข้อมูลผู้ใช้ใน userService เพื่อใช้ในภายหลัง
    setUserInfo(data.user.role, data.user.user_id);

    console.log(`เข้าสู่ระบบในฐานะ: ${data.user.role}`);
    return data;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการตรวจสอบสถานะการเข้าสู่ระบบ:", error);
    alert("เกิดข้อผิดพลาดในการตรวจสอบสถานะการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    return null;
  }
}

/**
 * ตั้งค่า event listeners
 */
function setupEventListeners() {
  // ปุ่มค้นหา
  searchBtn.addEventListener("click", handleSearch);

  // ปุ่มรีเซ็ตการค้นหา
  resetSearchBtn.addEventListener("click", resetSearch);

  // ปุ่มส่งออก Excel
  exportExcelBtn.addEventListener("click", exportToExcel);

  // ปุ่มเพิ่มข้อมูลใหม่
  addNewDataBtn.addEventListener("click", async () => {
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    modalManager.openAddModal();
  });
}

/**
 * โหลดข้อมูลเริ่มต้น
 */
async function loadInitialData() {
  try {
    // โหลดข้อมูลขยะ
    await tableManager.loadData();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลเริ่มต้น:", error);
  }
}

/**
 * เชื่อมต่อกับ Server-Sent Events
 */
function connectToSSE() {
  eventSourceManager.on("update", (data) => {
    // เมื่อมีการอัปเดตข้อมูลจาก SSE ให้โหลดข้อมูลใหม่
    tableManager.loadData();
  });

  eventSourceManager.connect();
}

/**
 * จัดการการค้นหา
 */
async function handleSearch() {
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  const authData = await checkAuthStatus();
  if (!authData || !authData.isAuthenticated) {
    alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
    window.location.href = "/login";
    return;
  }

  // รวบรวมข้อมูลการค้นหาจากฟอร์ม
  const filters = {
    startDate: startDateInput.value,
    endDate: endDateInput.value,
  };

  // ส่งตัวกรองไปยัง PaginationManager (จะรีเซ็ตไปหน้าแรกและโหลดข้อมูลใหม่อัตโนมัติ)
  paginationManager.setFilters(filters);
}

/**
 * รีเซ็ตการค้นหา
 */
async function resetSearch() {
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  const authData = await checkAuthStatus();
  if (!authData || !authData.isAuthenticated) {
    alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
    window.location.href = "/login";
    return;
  }

  // ล้างค่า input แบบปกติ
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

  // ล้างตัวกรองและรีเซ็ตไปยังหน้าแรก
  paginationManager.setFilters({});
}

/**
 * ส่งออกข้อมูลเป็นไฟล์ Excel
 */
async function exportToExcel() {
  try {
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    // แสดง loading ให้ผู้ใช้ทราบว่ากำลังดึงข้อมูล
    exportExcelBtn.disabled = true;
    exportExcelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล...';

    // ดึงค่าวันที่จากฟอร์มค้นหา (ใช้เงื่อนไขเดียวกับที่แสดงในตาราง)
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    try {
      // ใช้วิธีดึงข้อมูลหลายรอบแทนการกำหนด pageSize เป็นค่าสูงๆ
      let allExportData = [];
      let currentExportPage = 1;
      const exportPageSize = 500; // ขนาดหน้าสำหรับการส่งออก
      let hasMoreData = true;

      // แสดงข้อความกำลังดึงข้อมูล
      exportExcelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล... (0 รายการ)';

      // ดึงข้อมูลทีละชุดจนกว่าจะหมด
      while (hasMoreData) {
        // ใช้ API เดียวกับที่ใช้แสดงในตาราง แต่เพิ่ม pageSize
        const response = await fetch(
          `/api/waste/records?page=${currentExportPage}&pageSize=${exportPageSize}${
            startDate ? `&startDate=${startDate}` : ""
          }${endDate ? `&endDate=${endDate}` : ""}`
        );

        if (!response.ok) {
          throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          allExportData = [...allExportData, ...result.data];
          exportExcelBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล... (${allExportData.length} รายการ)`;

          // ตรวจสอบว่ายังมีข้อมูลต่อไปหรือไม่
          if (result.data.length < exportPageSize) {
            hasMoreData = false;
          } else {
            currentExportPage++;
          }
        } else {
          hasMoreData = false;
        }
      }

      // ตรวจสอบว่ามีข้อมูลที่จะส่งออกหรือไม่
      if (!allExportData || allExportData.length === 0) {
        alert("ไม่พบข้อมูลที่จะส่งออก");
        exportExcelBtn.disabled = false;
        exportExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i>ส่งออก Excel';
        return;
      }

      exportExcelBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังสร้างไฟล์ Excel (${allExportData.length} รายการ)`;

      // เรียงลำดับข้อมูลตามวันที่บันทึกจากน้อยไปมาก (เก่าไปใหม่)
      allExportData.sort((a, b) => {
        const dateA = new Date(a.recorded_date);
        const dateB = new Date(b.recorded_date);
        return dateA - dateB; // เรียงจากเก่าไปใหม่
      });

      // เตรียมข้อมูลสำหรับการส่งออก (แปลงจากข้อมูลดิบให้อยู่ในรูปแบบที่เหมาะสม)
      const exportData = allExportData.map((item, index) => {
        return {
          ลำดับ: index + 1,
          วันที่บันทึก: formatDate(item.recorded_date),
          ผู้บันทึกข้อมูล: item.full_name || "ไม่ระบุ",
          ประเภทขยะ: item.waste_type_name,
          "น้ำหนัก (กก.)": formatNumber(item.amount) || 0,
        };
      });

      // สร้าง Worksheet
      const worksheet = window.XLSX.utils.json_to_sheet(exportData);

      // ปรับความกว้างของคอลัมน์
      const maxWidth = exportData.reduce((width, row) => {
        return Math.max(width, Object.keys(row).length);
      }, 0);

      const columnWidths = [];
      for (let i = 0; i < maxWidth; i++) {
        columnWidths.push({ wch: 18 }); // ความกว้างคอลัมน์
      }
      worksheet["!cols"] = columnWidths;

      // สร้าง Workbook
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "ข้อมูลขยะ");

      // สร้างชื่อไฟล์พร้อมวันที่
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
      let fileName = `ข้อมูลขยะ_${dateStr}.xlsx`;

      // เพิ่มรายละเอียดช่วงวันที่ในชื่อไฟล์ (ถ้ามีการกรอง)
      if (startDate && endDate) {
        fileName = `ข้อมูลขยะ_${startDate}_ถึง_${endDate}.xlsx`;
      } else if (startDate) {
        fileName = `ข้อมูลขยะ_จาก_${startDate}.xlsx`;
      } else if (endDate) {
        fileName = `ข้อมูลขยะ_ถึง_${endDate}.xlsx`;
      }

      // ส่งออกไฟล์
      window.XLSX.writeFile(workbook, fileName);

      console.log(`ส่งออกข้อมูลเป็น Excel สำเร็จ (${exportData.length} รายการ)`);
    } finally {
      // คืนค่าปุ่มกลับสภาพเดิม
      exportExcelBtn.disabled = false;
      exportExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i>ส่งออก Excel';
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล:", error);
    alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    // คืนค่าปุ่มกลับสภาพเดิม
    exportExcelBtn.disabled = false;
    exportExcelBtn.innerHTML = '<i class="fas fa-file-excel"></i>ส่งออก Excel';
  }
}

// กำหนดฟังก์ชั่น reloadDataTable ให้ window เพื่อใช้ใน eventSourceManager
window.reloadDataTable = function () {
  tableManager.loadData(paginationManager.currentPage, paginationManager.pageSize, paginationManager.filters);
};

// เริ่มต้นการทำงานเมื่อโหลดหน้าเสร็จสมบูรณ์
document.addEventListener("DOMContentLoaded", init);
