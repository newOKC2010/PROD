// โมดูลสำหรับจัดการการแสดงข้อมูลในตาราง
import { getStatusClass, getStatusText, formatDate, formatNumber } from "./utilities.js";
import { getUserRole } from "./dataService.js";
import { getStatusNameById } from "./statusService.js";

// ตัวแปรเก็บข้อมูลทั้งหมด
let allDataItems = [];

// ฟังก์ชันสำหรับแสดงข้อมูลในตาราง
export function renderDataTable(data, handleEditClick, handleDeleteClick, currentPage = 1, pageSize = 10) {
  const tableBody = document.getElementById("data-table-body");

  // เก็บข้อมูลทั้งหมดไว้สำหรับแสดงรายละเอียด
  allDataItems = data;

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center">ไม่พบข้อมูล</td>
      </tr>
    `;
    return;
  }

  let html = "";
  const userRole = getUserRole();

  data.forEach((item, index) => {
    const recordDate = formatDate(item.record_date);

    // คำนวณลำดับตามหน้าและขนาดหน้า
    const rowNumber = (currentPage - 1) * pageSize + index + 1;

    // ใช้ฟังก์ชัน getStatusClass สำหรับทุกสถานะอุปกรณ์
    const treatmentStatusClass = getStatusClass(item.treatment_system_status_id);
    const treatmentStatusText = getStatusText(item.treatment_system_status_id);

    html += `
      <tr data-id="${item.info_id}">
        <td>${rowNumber}</td>
        <td>${recordDate}</td>
        <td>${item.full_name || "ไม่ระบุ"}</td>
        <td>${formatNumber(item.electricity_usage)}</td>
        <td>${formatNumber(item.water_usage)}</td>
        <td>${formatNumber(item.wastewater_inflow)}</td>
        <td>${formatNumber(item.wastewater_outflow)}</td>
        <td>${formatNumber(item.chemical_usage)}</td>
        <td>${formatNumber(item.ph_value)}</td>
        <td><span class="status-badge ${treatmentStatusClass}">${treatmentStatusText}</span></td>
        <td class="action-buttons">
          <button class="view-details-button" data-id="${item.info_id}" title="ดูรายละเอียด">
            <i class="fas fa-eye"></i>
          </button>
          <button class="edit-button" data-id="${item.info_id}" title="แก้ไข">
            <i class="fas fa-edit"></i>
          </button>
          ${
            userRole === "admin"
              ? `
            <button class="delete-button" data-id="${item.info_id}" title="ลบ">
              <i class="fas fa-trash"></i>
            </button>`
              : ""
          }
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;

  // เพิ่ม event listeners สำหรับปุ่มในตาราง
  document.querySelectorAll(".edit-button").forEach((button) => {
    button.addEventListener("click", handleEditClick);
  });

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", handleDeleteClick);
  });

  // เพิ่ม event listener สำหรับปุ่มดูรายละเอียด
  document.querySelectorAll(".view-details-button").forEach((button) => {
    button.addEventListener("click", handleViewDetails);
  });

  // เพิ่ม event listener สำหรับการคลิกที่แถว
  document.querySelectorAll("#data-table-body tr").forEach((row) => {
    row.addEventListener("click", function (e) {
      // เช็คว่าไม่ได้คลิกที่ปุ่ม
      if (
        !e.target.classList.contains("edit-button") &&
        !e.target.classList.contains("delete-button") &&
        !e.target.classList.contains("view-details-button") &&
        !e.target.closest(".edit-button") &&
        !e.target.closest(".delete-button") &&
        !e.target.closest(".view-details-button")
      ) {
        // ดึง ID จาก data attribute
        const id = this.getAttribute("data-id");
        if (id) {
          // สร้าง event object จำลองสำหรับ handleViewDetails
          handleViewDetails({ target: { getAttribute: () => id } });
        }
      }
    });
  });
}

// ฟังก์ชันสำหรับจัดการการดูรายละเอียด
async function handleViewDetails(event) {
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
  const item = allDataItems.find((data) => data.info_id == id);

  if (item) {
    // กำหนดค่าให้กับ Modal รายละเอียด
    document.getElementById("detail-info-id").textContent = item.info_id;
    document.getElementById("detail-record-date").textContent = formatDate(item.record_date);
    document.getElementById("detail-user-name").textContent = item.full_name || "ไม่ระบุ";

    document.getElementById("detail-electricity-usage").textContent = `${formatNumber(item.electricity_usage)} kWh`;
    document.getElementById("detail-water-usage").textContent = `${formatNumber(item.water_usage)} ลบ.ม.`;
    document.getElementById("detail-wastewater-inflow").textContent = `${formatNumber(item.wastewater_inflow)} ลบ.ม.`;
    document.getElementById("detail-wastewater-outflow").textContent = `${formatNumber(item.wastewater_outflow)} ลบ.ม.`;
    document.getElementById("detail-chemical-usage").textContent = `${formatNumber(item.chemical_usage)} กก.`;

    // แสดงสถานะของทุกอุปกรณ์พร้อมสี
    const treatmentStatusClass = getStatusClass(item.treatment_system_status_id);
    const treatmentStatusText = getStatusText(item.treatment_system_status_id);
    document.getElementById(
      "detail-treatment-system-status"
    ).innerHTML = `<span class="status-badge ${treatmentStatusClass}">${treatmentStatusText}</span>`;

    const waterPumpStatusClass = getStatusClass(item.water_pump_status_id || 0);
    const waterPumpStatusText = getStatusNameById(item.water_pump_status_id || 0);
    document.getElementById(
      "detail-water-pump-status"
    ).innerHTML = `<span class="status-badge ${waterPumpStatusClass}">${waterPumpStatusText}</span>`;

    const aeratorStatusClass = getStatusClass(item.aerator_status_id || 0);
    const aeratorStatusText = getStatusNameById(item.aerator_status_id || 0);
    document.getElementById(
      "detail-aerator-status"
    ).innerHTML = `<span class="status-badge ${aeratorStatusClass}">${aeratorStatusText}</span>`;

    const wastewaterMixerStatusClass = getStatusClass(item.wastewater_mixer_status_id || 0);
    const wastewaterMixerStatusText = getStatusNameById(item.wastewater_mixer_status_id || 0);
    document.getElementById(
      "detail-wastewater-mixer-status"
    ).innerHTML = `<span class="status-badge ${wastewaterMixerStatusClass}">${wastewaterMixerStatusText}</span>`;

    const chemicalMixerStatusClass = getStatusClass(item.chemical_mixer_status_id || 0);
    const chemicalMixerStatusText = getStatusNameById(item.chemical_mixer_status_id || 0);
    document.getElementById(
      "detail-chemical-mixer-status"
    ).innerHTML = `<span class="status-badge ${chemicalMixerStatusClass}">${chemicalMixerStatusText}</span>`;

    const sludgePumpStatusClass = getStatusClass(item.sludge_pump_status_id || 0);
    const sludgePumpStatusText = getStatusNameById(item.sludge_pump_status_id || 0);
    document.getElementById(
      "detail-sludge-pump-status"
    ).innerHTML = `<span class="status-badge ${sludgePumpStatusClass}">${sludgePumpStatusText}</span>`;

    document.getElementById("detail-ph-value").textContent = formatNumber(item.ph_value);
    document.getElementById("detail-residual-chlorine").textContent = `${formatNumber(item.residual_chlorine)} มก./ล.`;
    document.getElementById("detail-sludge-removal").textContent = `${formatNumber(item.sludge_removal)} ลบ.ม.`;

    // แสดง Modal
    document.getElementById("details-modal").style.display = "block";
  }
}

// ฟังก์ชันสำหรับแสดงข้อความโหลดข้อมูล
export function showLoadingIndicator() {
  document.getElementById("data-table-body").innerHTML = `
    <tr class="loading-row">
      <td colspan="11" class="text-center">กำลังโหลดข้อมูล...</td>
    </tr>
  `;
}

// ฟังก์ชันสำหรับแสดงข้อความผิดพลาด
export function showErrorMessage(message = "เกิดข้อผิดพลาดในการโหลดข้อมูล") {
  document.getElementById("data-table-body").innerHTML = `
    <tr>
      <td colspan="11" class="text-center">${message}</td>
    </tr>
  `;
}

// ฟังก์ชันสำหรับตั้งค่า event listeners สำหรับ Modal รายละเอียด
export function setupDetailsModalListeners() {
  // ปรับปรุงตัวเลือกเพื่อใช้ querySelector ที่มีประสิทธิภาพมากขึ้น
  document.querySelectorAll("#details-modal .close-modal").forEach((element) => {
    element.addEventListener("click", function () {
      document.getElementById("details-modal").style.display = "none";
    });
  });

  // ปรับปรุงปุ่มปิดในส่วนหัวโมดัล
  const closeButton = document.querySelector("#details-modal .modal-header .close-modal");
  if (closeButton) {
    closeButton.className = "close-btn close-modal";
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
  }

  window.addEventListener("click", function (event) {
    if (event.target.id === "details-modal") {
      document.getElementById("details-modal").style.display = "none";
    }
  });
}
