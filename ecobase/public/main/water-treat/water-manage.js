// ไฟล์หลักสำหรับหน้าจัดการข้อมูลบำบัดน้ำ
import * as DataService from "./water-treat-manage-js/dataService.js";
import * as TableRenderer from "./water-treat-manage-js/tableRenderer.js";
import * as PaginationManager from "./water-treat-manage-js/paginationManager.js";
import * as ModalManager from "./water-treat-manage-js/modalManager.js";
import * as StatusService from "./water-treat-manage-js/statusService.js";
import eventSourceManager from "../../assets/common/eventSourceManager.js";
import { formatDate } from "./water-treat-manage-js/utilities.js";
import { getStatusText } from "./water-treat-manage-js/utilities.js";
import { getStatusNameById } from "./water-treat-manage-js/statusService.js";

// ตัวแปรสำหรับเก็บข้อมูลทั้งหมด
let allData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 1;

// รอให้ DOM โหลดเสร็จก่อนทำงาน
document.addEventListener("DOMContentLoaded", async function () {
  console.log("หน้าจัดการระบบบำบัดน้ำถูกโหลดเมื่อ:", new Date().toLocaleString());

  // ตรวจสอบสถานะการล็อกอิน
  const authData = await checkAuthStatus();
  if (authData && authData.isAuthenticated) {
    DataService.setUserInfo(authData.user.role, authData.user.user_id);
    console.log("ผู้ใช้เข้าสู่ระบบ:", authData.user.username, "บทบาท:", authData.user.role);

    // โหลดข้อมูลสถานะอุปกรณ์
    await StatusService.loadEquipmentStatus();

    // กำหนดฟังก์ชัน reloadDataTable สำหรับ SSE
    window.reloadDataTable = loadData;

    // เริ่มการเชื่อมต่อ SSE
    eventSourceManager.connect();

    // กำหนด callback เมื่อมีการอัปเดตข้อมูล
    eventSourceManager.on("update", (data) => {
      console.log("ได้รับการอัปเดตข้อมูลผ่าน SSE:", data);
      loadData();
    });

    // กำหนด callback เมื่อมีการเชื่อมต่อสำเร็จ
    eventSourceManager.on("connect", () => {
      console.log("เชื่อมต่อ SSE สำเร็จ - ข้อมูลจะอัปเดตอัตโนมัติ");
    });

    // โหลดข้อมูล
    loadData();
  }

  // เพิ่ม Event Listeners
  setupEventListeners();
});

// จัดการเมื่อออกจากหน้า
window.addEventListener("beforeunload", () => {
  // ยกเลิกการเชื่อมต่อ SSE
  eventSourceManager.disconnect();
});

// ฟังก์ชันสำหรับโหลดข้อมูล
async function loadData() {
  try {
    TableRenderer.showLoadingIndicator();

    // ดึงค่าวันที่จากฟอร์ม
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    // โหลดข้อมูลพร้อมเงื่อนไขการค้นหา
    const result = await DataService.loadEnvironmentalData(currentPage, pageSize, startDate, endDate);
    allData = result.data;
    totalPages = result.totalPages;

    // ตรวจสอบว่าหน้าปัจจุบันไม่มีข้อมูลหรือไม่
    if (result.data.length === 0 && currentPage > 1 && totalPages > 0) {
      // ถ้าไม่มีข้อมูลในหน้าปัจจุบันและไม่ใช่หน้าแรก ให้ย้อนกลับไป 1 หน้า
      currentPage = Math.min(currentPage - 1, totalPages);

      // โหลดข้อมูลใหม่ด้วยหน้าที่ปรับแล้ว
      const newResult = await DataService.loadEnvironmentalData(currentPage, pageSize, startDate, endDate);
      allData = newResult.data;
      totalPages = newResult.totalPages;
    }

    // แสดงข้อมูลในตาราง (เพิ่มการส่ง currentPage และ pageSize)
    TableRenderer.renderDataTable(allData, handleEditClick, handleDeleteClick, currentPage, pageSize);

    // อัปเดตข้อมูลการแบ่งหน้า
    PaginationManager.updatePagination(currentPage, pageSize, totalPages, result.total, goToPage);
    PaginationManager.updatePaginationButtons(currentPage, totalPages);
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
    TableRenderer.showErrorMessage();
  }
}

// ฟังก์ชันสำหรับปุ่มแก้ไข
async function handleEditClick(event) {
  // หาปุ่มที่ถูกคลิกหรือ element ที่อยู่ภายในปุ่ม
  let target = event.target;

  // ถ้าคลิกที่ element ภายในปุ่ม (เช่น ไอคอน) ให้หาปุ่มที่เป็น parent
  while (target && !target.hasAttribute("data-id") && target.tagName !== "BUTTON") {
    target = target.parentElement;
  }

  // ถ้าไม่พบปุ่มที่มี data-id ให้หยุด
  if (!target || !target.hasAttribute("data-id")) return;

  // ตรวจสอบ token ก่อนเปิด modal
  const authData = await checkAuthStatus();
  if (!authData || !authData.isAuthenticated) {
    alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
    window.location.href = "/login";
    return;
  }

  const id = target.getAttribute("data-id");
  const item = allData.find((data) => data.info_id == id);

  if (item) {
    ModalManager.prepareEditModal(item);
  }
}

// ฟังก์ชันสำหรับปุ่มลบ
async function handleDeleteClick(event) {
  // หาปุ่มที่ถูกคลิกหรือ element ที่อยู่ภายในปุ่ม
  let target = event.target;

  // ถ้าคลิกที่ element ภายในปุ่ม (เช่น ไอคอน) ให้หาปุ่มที่เป็น parent
  while (target && !target.hasAttribute("data-id") && target.tagName !== "BUTTON") {
    target = target.parentElement;
  }

  // ถ้าไม่พบปุ่มที่มี data-id ให้หยุด
  if (!target || !target.hasAttribute("data-id")) return;

  // ตรวจสอบ token ก่อนเปิด modal
  const authData = await checkAuthStatus();
  if (!authData || !authData.isAuthenticated) {
    alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
    window.location.href = "/login";
    return;
  }

  const id = target.getAttribute("data-id");

  // หาข้อมูลที่จะลบจาก allData
  const itemToDelete = allData.find((data) => data.info_id == id);

  // เก็บข้อมูลไว้ใน global variable เพื่อให้ prepareDeleteModal เข้าถึงได้
  window.currentItemToDelete = itemToDelete;

  // เรียกฟังก์ชันเตรียม Modal ยืนยันการลบ
  ModalManager.prepareDeleteModal(id);
}

// ฟังก์ชันสำหรับบันทึกการแก้ไข
async function saveEdit(event) {
  event.preventDefault();

  const id = document.getElementById("edit-info-id").value;

  // ดึงวันที่ที่ผู้ใช้เลือก
  const selectedDate = document.getElementById("edit-record-date").value;

  // สร้างวันที่โดยใช้วันที่ที่เลือกและเวลาปัจจุบัน
  const currentTime = new Date();
  const dateToSave = new Date(selectedDate);
  dateToSave.setHours(currentTime.getHours());
  dateToSave.setMinutes(currentTime.getMinutes());
  dateToSave.setSeconds(currentTime.getSeconds());

  const formData = {
    record_date: dateToSave.toISOString(),
    electricity_usage: parseFloat(document.getElementById("edit-electricity-usage").value) || 0,
    water_usage: parseFloat(document.getElementById("edit-water-usage").value) || 0,
    wastewater_inflow: parseFloat(document.getElementById("edit-wastewater-inflow").value) || 0,
    wastewater_outflow: parseFloat(document.getElementById("edit-wastewater-outflow").value) || 0,
    chemical_usage: parseFloat(document.getElementById("edit-chemical-usage").value) || 0,
    treatment_system_status_id: parseInt(document.getElementById("edit-treatment-system-status").value),
    water_pump_status_id: parseInt(document.getElementById("edit-water-pump-status").value),
    aerator_status_id: parseInt(document.getElementById("edit-aerator-status").value),
    wastewater_mixer_status_id: parseInt(document.getElementById("edit-wastewater-mixer-status").value),
    chemical_mixer_status_id: parseInt(document.getElementById("edit-chemical-mixer-status").value),
    sludge_pump_status_id: parseInt(document.getElementById("edit-sludge-pump-status").value),
    ph_value: parseFloat(document.getElementById("edit-ph-value").value) || 0,
    sludge_removal: parseFloat(document.getElementById("edit-sludge-removal").value) || 0,
    residual_chlorine: parseFloat(document.getElementById("edit-residual-chlorine").value) || 0,
  };

  try {
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    // ตรวจสอบว่าข้อมูลยังมีอยู่หรือไม่ (เฉพาะกรณีแก้ไข)
    if (id) {
      const checkResponse = await fetch(`/api/environmental-data/${id}/exists`);
      const checkResult = await checkResponse.json();

      if (!checkResult.exists) {
        alert("ไม่สามารถบันทึกได้: ข้อมูลนี้ถูกลบไปแล้ว");
        document.getElementById("edit-modal").style.display = "none";
        await loadData(); // โหลดข้อมูลใหม่
        return;
      }
    }

    await DataService.saveEdit(id, formData);

    // ปิด modal
    document.getElementById("edit-modal").style.display = "none";

    // โหลดข้อมูลใหม่
    loadData();

    alert(`${id ? "แก้ไข" : "เพิ่ม"}ข้อมูลสำเร็จ`);
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการ${id ? "แก้ไข" : "เพิ่ม"}ข้อมูล:`, error);
    alert(`เกิดข้อผิดพลาดในการ${id ? "แก้ไข" : "เพิ่ม"}ข้อมูล: ${error.message}`);
  }
}

// ฟังก์ชันสำหรับลบข้อมูล
async function deleteData() {
  // ตรวจสอบ token ก่อนลบ
  const authData = await checkAuthStatus();
  if (!authData || !authData.isAuthenticated) {
    alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
    window.location.href = "/login";
    return;
  }

  // ตรวจสอบว่า element มีอยู่จริงก่อนดึงค่า
  const deleteIdElement = document.getElementById("delete-info-id");

  if (!deleteIdElement) {
    console.error("ไม่พบ element ที่มี ID 'delete-info-id'");
    alert("เกิดข้อผิดพลาดในระบบ: ไม่สามารถอ่านข้อมูลที่ต้องการลบได้");
    return;
  }

  // แก้จาก value เป็น textContent
  const id = deleteIdElement.textContent;

  if (!id) {
    console.error("ID ที่จะลบไม่ถูกต้อง:", id);
    alert("เกิดข้อผิดพลาดในระบบ: ไม่มีข้อมูล ID ที่ต้องการลบ");
    return;
  }

  try {
    // เพิ่มการตรวจสอบว่าข้อมูลยังมีอยู่หรือไม่
    const checkResponse = await fetch(`/api/environmental-data/${id}/exists`);
    const checkResult = await checkResponse.json();

    if (!checkResult.exists) {
      alert("ไม่สามารถลบได้: ข้อมูลนี้ถูกลบไปแล้ว");
      document.getElementById("delete-confirm-modal").style.display = "none";
      await loadData(); // โหลดข้อมูลใหม่
      return;
    }

    // ตรวจสอบว่ากำลังจะลบข้อมูลสุดท้ายของหน้าหรือไม่
    const isLastItemInPage = allData.length === 1;

    await DataService.deleteData(id);

    // ปิด modal
    document.getElementById("delete-confirm-modal").style.display = "none";

    // ถ้าลบข้อมูลสุดท้ายของหน้า และไม่ใช่หน้าแรก ให้ย้อนกลับไป 1 หน้า
    if (isLastItemInPage && currentPage > 1) {
      currentPage--;
    }

    // โหลดข้อมูลใหม่
    loadData();

    alert("ลบข้อมูลสำเร็จ");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบข้อมูล:", error);
    alert(`เกิดข้อผิดพลาดในการลบข้อมูล: ${error.message}`);
  }
}

// ฟังก์ชันสำหรับไปยังหน้าที่ต้องการ
function goToPage(page) {
  if (page !== currentPage && page >= 1 && page <= totalPages) {
    currentPage = page;
    loadData();
  }
}

// ฟังก์ชันสำหรับเปลี่ยนขนาดหน้า
function changePageSize(newSize) {
  pageSize = newSize;
  currentPage = 1;
  loadData();
}

// ฟังก์ชันสำหรับตั้งค่า Event Listeners
function setupEventListeners() {
  // ตั้งค่า Event Listeners สำหรับ Modal
  ModalManager.setupModalListeners(saveEdit, deleteData);

  // ตั้งค่า Event Listeners สำหรับ Modal รายละเอียด
  TableRenderer.setupDetailsModalListeners();

  // ตั้งค่า Event Listeners สำหรับการแบ่งหน้า
  PaginationManager.setupPaginationListeners(goToPage, changePageSize);

  // Event listener สำหรับปุ่มเพิ่มข้อมูลใหม่
  document.getElementById("add-new-data-btn").addEventListener("click", async function () {
    // ตรวจสอบ token ก่อนเปิด modal
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    ModalManager.prepareEditModal();
  });

  // Event listener สำหรับปุ่มค้นหา
  document.getElementById("search-btn").addEventListener("click", async function () {
    // ตรวจสอบ token ก่อนค้นหา
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    handleSearch();
  });

  // Event listener สำหรับปุ่มรีเซ็ตการค้นหา
  document.getElementById("reset-search-btn").addEventListener("click", async function () {
    resetSearch();
  });

  // Event listener สำหรับปุ่มส่งออก Excel
  document.getElementById("export-excel-btn").addEventListener("click", async function () {
    // ตรวจสอบ token ก่อนส่งออก
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    exportToExcel();
  });
}

// ฟังก์ชันสำหรับส่งออกข้อมูลเป็นไฟล์ Excel
async function exportToExcel() {
  try {
    // แสดง loading ให้ผู้ใช้ทราบว่ากำลังดึงข้อมูล
    document.getElementById("export-excel-btn").disabled = true;
    document.getElementById("export-excel-btn").innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> กำลังส่งออกข้อมูล...';

    // ดึงค่าวันที่จากฟอร์มค้นหา (ใช้เงื่อนไขเดียวกับที่แสดงในตาราง)
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;

    try {
      // ใช้วิธีดึงข้อมูลหลายรอบแทนการกำหนด pageSize เป็นค่าสูงๆ
      let allExportData = [];
      let currentExportPage = 1;
      const exportPageSize = 500; // ขนาดหน้าสำหรับการส่งออก
      let hasMoreData = true;

      // แสดงข้อความกำลังดึงข้อมูล
      document.getElementById("export-excel-btn").innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล... (0 รายการ)';

      // ดึงข้อมูลทีละชุดจนกว่าจะหมด
      while (hasMoreData) {
        const result = await DataService.loadEnvironmentalData(currentExportPage, exportPageSize, startDate, endDate);

        if (result.data && result.data.length > 0) {
          allExportData = [...allExportData, ...result.data];
          document.getElementById(
            "export-excel-btn"
          ).innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังดึงข้อมูล... (${allExportData.length} รายการ)`;

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
        document.getElementById("export-excel-btn").disabled = false;
        document.getElementById("export-excel-btn").innerHTML = "ส่งออก Excel";
        return;
      }

      document.getElementById(
        "export-excel-btn"
      ).innerHTML = `<i class="fas fa-spinner fa-spin"></i> กำลังสร้างไฟล์ Excel (${allExportData.length} รายการ)`;

      // เรียงลำดับข้อมูลตามวันที่บันทึกจากน้อยไปมาก (เก่าไปใหม่)
      allExportData.sort((a, b) => {
        const dateA = new Date(a.record_date);
        const dateB = new Date(b.record_date);
        return dateA - dateB; // เรียงจากเก่าไปใหม่
      });

      // เตรียมข้อมูลสำหรับการส่งออก
      const exportData = allExportData.map((item, index) => {
        return {
          ลำดับ: index + 1,
          วันที่บันทึก: formatDate(item.record_date),
          ผู้บันทึกข้อมูล: item.full_name || "ไม่ระบุ",
          "ปริมาณการใช้ไฟฟ้า (kWh)": item.electricity_usage || 0,
          "ปริมาณการใช้น้ำ (ลบ.ม.)": item.water_usage || 0,
          "ปริมาณน้ำเสียเข้าระบบ (ลบ.ม.)": item.wastewater_inflow || 0,
          "การระบายน้ำทิ้ง (ลบ.ม.)": item.wastewater_outflow || 0,
          "ปริมาณสารเคมี (กก.)": item.chemical_usage || 0,
          "ค่า pH": item.ph_value || 0,
          สถานะระบบบำบัด: getStatusText(item.treatment_system_status_id),
          สถานะปั๊มน้ำ: getStatusNameById(item.water_pump_status_id || 0),
          สถานะเครื่องเติมอากาศ: getStatusNameById(item.aerator_status_id || 0),
          สถานะเครื่องกวนน้ำเสีย: getStatusNameById(item.wastewater_mixer_status_id || 0),
          สถานะเครื่องกวนสารเคมี: getStatusNameById(item.chemical_mixer_status_id || 0),
          สถานะเครื่องสูบตะกอน: getStatusNameById(item.sludge_pump_status_id || 0),
          "ค่าคลอรีนตกค้าง (มก./ล.)": item.residual_chlorine || 0,
          "ตะกอนส่วนเกินที่นำไปกำจัด (ลบ.ม.)": item.sludge_removal || 0,
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
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "ข้อมูลระบบบำบัดน้ำ");

      // สร้างชื่อไฟล์พร้อมวันที่
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0]; // รูปแบบ YYYY-MM-DD
      let fileName = `ข้อมูลระบบบำบัดน้ำ_${dateStr}.xlsx`;

      // เพิ่มรายละเอียดช่วงวันที่ในชื่อไฟล์ (ถ้ามีการกรอง)
      if (startDate && endDate) {
        fileName = `ข้อมูลระบบบำบัดน้ำ_${startDate}_ถึง_${endDate}.xlsx`;
      } else if (startDate) {
        fileName = `ข้อมูลระบบบำบัดน้ำ_จาก_${startDate}.xlsx`;
      } else if (endDate) {
        fileName = `ข้อมูลระบบบำบัดน้ำ_ถึง_${endDate}.xlsx`;
      }

      // ส่งออกไฟล์
      window.XLSX.writeFile(workbook, fileName);

      console.log(`ส่งออกข้อมูลเป็น Excel สำเร็จ (${exportData.length} รายการ)`);
    } finally {
      // คืนค่าปุ่มกลับสภาพเดิม พร้อมไอคอน
      document.getElementById("export-excel-btn").disabled = false;
      document.getElementById("export-excel-btn").innerHTML =
        '<i class="fas fa-file-excel"></i>&nbsp;&nbsp;ส่งออก Excel';
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล:", error);
    alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    // คืนค่าปุ่มกลับสภาพเดิม
    document.getElementById("export-excel-btn").disabled = false;
    document.getElementById("export-excel-btn").innerHTML = "ส่งออก Excel";
  }
}

// เพิ่มฟังก์ชัน handleSearch
function handleSearch() {
  currentPage = 1; // รีเซ็ตไปหน้าแรกเมื่อค้นหา
  loadData();
}

// เพิ่มฟังก์ชัน resetSearch
function resetSearch() {
  // ล้างค่า input แบบปกติ
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");

  startDateInput.value = "";
  endDateInput.value = "";

  // รีเซ็ต custom datepicker display
  const startDateContainer = startDateInput.parentNode.querySelector(".thai-date-display");
  const endDateContainer = endDateInput.parentNode.querySelector(".thai-date-display");

  if (startDateContainer) {
    startDateContainer.textContent = "เลือกวันที่";
  }

  if (endDateContainer) {
    endDateContainer.textContent = "เลือกวันที่";
  }

  // รีเซ็ตหน้าและโหลดข้อมูลใหม่
  currentPage = 1;
  loadData();
}
