// โมดูลสำหรับจัดการ Modal ต่างๆ
import { createStatusDropdown } from "./statusService.js";
import { formatDate, formatNumber } from "./utilities.js";

// ฟังก์ชันสำหรับเตรียม Modal สำหรับการเพิ่มหรือแก้ไขข้อมูล
export function prepareEditModal(item = null) {
  const modal = document.getElementById("edit-modal");
  const form = document.getElementById("edit-form");
  const modalTitle = document.querySelector("#edit-modal .modal-header h3");

  // ล้างฟอร์ม
  form.reset();

  // ตั้งค่าหัวข้อ Modal
  modalTitle.textContent = item ? "แก้ไขข้อมูล" : "เพิ่มข้อมูลใหม่";

  // ดึงองค์ประกอบที่เกี่ยวข้องกับวันที่
  const dateInput = document.getElementById("edit-record-date");
  const dateInputContainer = document.getElementById("date-input-container");
  const dateDisplayContainer = document.getElementById("date-display-container");
  const dateDisplayText = document.getElementById("date-display-text");

  // ถ้าเป็นการแก้ไข ให้กรอกข้อมูลลงใน form
  if (item) {
    document.getElementById("edit-info-id").value = item.info_id;

    // ซ่อน input date และแสดงข้อความวันที่แทน
    dateInputContainer.style.display = "none";
    dateDisplayContainer.style.display = "block";
    dateDisplayText.textContent = formatDate(item.record_date);

    // กำหนดค่าให้ input date (ซ่อนไว้) เพื่อใช้ในการส่งข้อมูล
    dateInput.value = formatDateForDateInput(item.record_date);

    document.getElementById("edit-electricity-usage").value = item.electricity_usage || "";
    document.getElementById("edit-water-usage").value = item.water_usage || "";
    document.getElementById("edit-wastewater-inflow").value = item.wastewater_inflow || "";
    document.getElementById("edit-wastewater-outflow").value = item.wastewater_outflow || "";
    document.getElementById("edit-chemical-usage").value = item.chemical_usage || "";
    document.getElementById("edit-ph-value").value = item.ph_value || "";
    document.getElementById("edit-sludge-removal").value = item.sludge_removal || "";
    document.getElementById("edit-residual-chlorine").value = item.residual_chlorine || "";

    // เตรียม dropdown สำหรับสถานะอุปกรณ์
    createStatusDropdown(document.getElementById("edit-treatment-system-status"), item.treatment_system_status_id);
    createStatusDropdown(document.getElementById("edit-water-pump-status"), item.water_pump_status_id);
    createStatusDropdown(document.getElementById("edit-aerator-status"), item.aerator_status_id);
    createStatusDropdown(document.getElementById("edit-wastewater-mixer-status"), item.wastewater_mixer_status_id);
    createStatusDropdown(document.getElementById("edit-chemical-mixer-status"), item.chemical_mixer_status_id);
    createStatusDropdown(document.getElementById("edit-sludge-pump-status"), item.sludge_pump_status_id);
  } else {
    // กรณีเพิ่มข้อมูลใหม่
    document.getElementById("edit-info-id").value = "";

    // แสดง input date และซ่อนข้อความวันที่
    dateInputContainer.style.display = "block";
    dateDisplayContainer.style.display = "none";
    dateInput.value = formatDateForDateInput(new Date());

    // เตรียม dropdown สำหรับสถานะอุปกรณ์ในกรณีเพิ่มข้อมูลใหม่
    createStatusDropdown(document.getElementById("edit-treatment-system-status"));
    createStatusDropdown(document.getElementById("edit-water-pump-status"));
    createStatusDropdown(document.getElementById("edit-aerator-status"));
    createStatusDropdown(document.getElementById("edit-wastewater-mixer-status"));
    createStatusDropdown(document.getElementById("edit-chemical-mixer-status"));
    createStatusDropdown(document.getElementById("edit-sludge-pump-status"));
  }

  // ปรับปรุงปุ่มในโมดัลให้ใช้คลาสใหม่
  const saveButton = modal.querySelector(".save-button");
  const cancelButton = modal.querySelector(".cancel-button");
  
  if (saveButton) {
    saveButton.className = "btn btn-primary";
    saveButton.innerHTML = '<i class="fas fa-save"></i> บันทึกข้อมูล';
  }
  
  if (cancelButton) {
    cancelButton.className = "btn btn-secondary";
    cancelButton.innerHTML = '<i class="fas fa-times"></i> ยกเลิก';
  }

  // แสดง Modal
  modal.style.display = "block";
}

// ฟังก์ชันสำหรับเตรียม Modal ยืนยันการลบ
export function prepareDeleteModal(id) {
  const modal = document.getElementById("delete-confirm-modal");
  const modalBody = modal.querySelector(".modal-body");

  // กำหนด ID ที่จะลบ
  const idElement = document.getElementById("delete-info-id");
  if (idElement) {
    idElement.textContent = id;
  }

  // ดึงข้อมูลที่จะลบจาก global variable
  const item = window.currentItemToDelete;

  // ลบรายละเอียดเก่าถ้ามี
  const oldContainer = modalBody.querySelector(".delete-details-container");
  if (oldContainer) {
    oldContainer.remove();
  }

  // สร้างส่วนแสดงรายละเอียด
  if (item) {
    // สร้าง container
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "details-container delete-details-container";

    // สร้างส่วนหัวข้อข้อมูลทั่วไป
    const generalTitle = document.createElement("h4");
    generalTitle.className = "form-section-title";
    generalTitle.textContent = "ข้อมูลทั่วไป";
    detailsContainer.appendChild(generalTitle);

    // สร้าง grid สำหรับข้อมูลทั่วไป
    const generalGrid = document.createElement("div");
    generalGrid.className = "details-grid";

    // เพิ่มข้อมูลวันที่
    const dateItem = document.createElement("div");
    dateItem.className = "details-item";
    const dateLabel = document.createElement("span");
    dateLabel.className = "details-label";
    dateLabel.textContent = "วันที่บันทึก:";
    const dateValue = document.createElement("span");
    dateValue.className = "details-value";
    dateValue.textContent = formatDate(item.record_date);
    dateItem.appendChild(dateLabel);
    dateItem.appendChild(dateValue);
    generalGrid.appendChild(dateItem);

    // เพิ่มข้อมูลผู้บันทึก
    const nameItem = document.createElement("div");
    nameItem.className = "details-item";
    const nameLabel = document.createElement("span");
    nameLabel.className = "details-label";
    nameLabel.textContent = "ผู้บันทึก:";
    const nameValue = document.createElement("span");
    nameValue.className = "details-value";
    nameValue.textContent = item.full_name || "ไม่ระบุ";
    nameItem.appendChild(nameLabel);
    nameItem.appendChild(nameValue);
    generalGrid.appendChild(nameItem);

    // เพิ่ม grid เข้า container
    detailsContainer.appendChild(generalGrid);

    // สร้างส่วนหัวข้อข้อมูลการใช้ทรัพยากร
    const resourceTitle = document.createElement("h4");
    resourceTitle.className = "form-section-title";
    resourceTitle.textContent = "ข้อมูลการใช้ทรัพยากร";
    detailsContainer.appendChild(resourceTitle);

    // สร้าง grid สำหรับข้อมูลการใช้ทรัพยากร
    const resourceGrid = document.createElement("div");
    resourceGrid.className = "details-grid";

    // สร้าง function สำหรับสร้าง details-item
    function createDetailItem(labelText, value) {
      const item = document.createElement("div");
      item.className = "details-item";

      const label = document.createElement("span");
      label.className = "details-label";
      label.textContent = labelText;

      const valueSpan = document.createElement("span");
      valueSpan.className = "details-value";
      valueSpan.textContent = formatNumber(value);

      item.appendChild(label);
      item.appendChild(valueSpan);
      return item;
    }

    // เพิ่มข้อมูลทรัพยากร
    resourceGrid.appendChild(createDetailItem("ปริมาณการใช้ไฟฟ้า (kWh):", item.electricity_usage));
    resourceGrid.appendChild(createDetailItem("ปริมาณการใช้น้ำ (ลบ.ม.):", item.water_usage));
    resourceGrid.appendChild(createDetailItem("ปริมาณน้ำเสียเข้าระบบ (ลบ.ม.):", item.wastewater_inflow));
    resourceGrid.appendChild(createDetailItem("การระบายน้ำทิ้ง (ลบ.ม.):", item.wastewater_outflow));
    resourceGrid.appendChild(createDetailItem("ปริมาณสารเคมี (กก.):", item.chemical_usage));

    // เพิ่ม grid เข้า container
    detailsContainer.appendChild(resourceGrid);

    // แทรก container ไว้ก่อนปุ่ม
    const buttonContainer = modalBody.querySelector(".form-buttons");
    if (buttonContainer) {
      modalBody.insertBefore(detailsContainer, buttonContainer);

      // ปรับปรุงปุ่มในโมดัลลบข้อมูล
      const deleteButton = buttonContainer.querySelector("#confirm-delete-btn");
      const cancelButton = buttonContainer.querySelector(".cancel-button");
      
      if (deleteButton) {
        deleteButton.className = "btn btn-danger";
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> ยืนยันการลบ';
      }
      
      if (cancelButton) {
        cancelButton.className = "btn btn-secondary";
        cancelButton.innerHTML = '<i class="fas fa-times"></i> ยกเลิก';
      }
    } else {
      modalBody.appendChild(detailsContainer);
    }
  }

  // แสดง Modal
  modal.style.display = "block";
}

// ฟังก์ชันสำหรับตั้งค่า Event Listeners สำหรับ Modal
export function setupModalListeners(saveEditHandler, deleteHandler) {
  // Event listeners สำหรับปิด Modal
  document.querySelectorAll(".close-modal").forEach((element) => {
    element.addEventListener("click", function () {
      document.getElementById("edit-modal").style.display = "none";
      document.getElementById("delete-confirm-modal").style.display = "none";
    });
  });

  // Event listener สำหรับฟอร์มแก้ไข
  document.getElementById("edit-form").addEventListener("submit", saveEditHandler);

  // Event listener สำหรับปุ่มยืนยันการลบ
  document.getElementById("confirm-delete-btn").addEventListener("click", deleteHandler);
}

// ฟังก์ชันสำหรับแปลงวันที่ให้อยู่ในรูปแบบที่ใช้กับ input type="date"
function formatDateForDateInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  // ถ้าวันที่ไม่ถูกต้องให้ใช้วันที่ปัจจุบัน
  if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10); // รูปแบบ YYYY-MM-DD
}
