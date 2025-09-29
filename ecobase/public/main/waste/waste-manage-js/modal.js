/**
 * Modal Manager - จัดการโมดัลต่างๆ ในหน้าจัดการขยะ
 * ทำหน้าที่:
 * - เปิด/ปิดโมดัล
 * - เตรียมข้อมูลในโมดัล
 * - จัดการการส่งข้อมูลจากโมดัล
 */

import { fetchWasteTypes, fetchWasteRecordById, addWasteRecord, updateWasteRecord, deleteWasteRecord } from "./api.js";
import { formatDate } from "./utilities.js";
import tableManager from "./tableManager.js";

export class ModalManager {
  constructor() {
    // โมดัลเพิ่มข้อมูล
    this.addModal = document.getElementById("add-modal");
    this.addForm = document.getElementById("add-form");
    this.addWasteType = document.getElementById("add-waste-type");
    this.addWasteTypeBadge = document.getElementById("add-waste-type-badge");
    this.addRecordDate = document.getElementById("add-record-date");
    this.addWasteWeight = document.getElementById("add-waste-weight");
    this.addSaveBtn = document.getElementById("add-save-btn");
    this.addCancelBtn = document.getElementById("add-cancel-btn");

    // โมดัลแก้ไขข้อมูล
    this.editModal = document.getElementById("edit-modal");
    this.editForm = document.getElementById("edit-form");
    this.editInfoId = document.getElementById("edit-info-id");
    this.editWasteType = document.getElementById("edit-waste-type");
    this.editWasteTypeBadge = document.getElementById("edit-waste-type-badge");
    this.editRecordDate = document.getElementById("edit-record-date");
    this.editRecordDateTime = document.createElement("div"); // เพิ่มองค์ประกอบใหม่สำหรับแสดงวันที่และเวลาที่อ่านได้อย่างเดียว
    this.editWasteWeight = document.getElementById("edit-waste-weight");
    this.editSaveBtn = document.getElementById("edit-save-btn");
    this.editCancelBtn = document.getElementById("edit-cancel-btn");

    // เพิ่มองค์ประกอบใหม่ลงในแบบฟอร์ม
    const editDateContainer = document.getElementById("edit-date-input-container");
    if (editDateContainer) {
      editDateContainer.appendChild(this.editRecordDateTime);
      this.editRecordDateTime.className = "readonly-datetime";
    }

    // โมดัลยืนยันการลบ
    this.deleteModal = document.getElementById("delete-confirm-modal");
    this.confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    this.cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    this.deleteInfoContainer = document.getElementById("delete-info-container") || document.createElement("div");
    if (!document.getElementById("delete-info-container")) {
      this.deleteInfoContainer.id = "delete-info-container";
      this.deleteInfoContainer.className = "delete-info-container";
      // เพิ่มองค์ประกอบใหม่เข้าไปในโมดัลถ้าไม่มี
      const deleteModalContent = this.deleteModal.querySelector(".modal-body");
      if (deleteModalContent) {
        deleteModalContent.insertBefore(this.deleteInfoContainer, this.confirmDeleteBtn.parentNode);
      }
    }

    // ข้อมูลอื่นๆ
    this.currentDeleteId = null;
    this.wasteTypes = [];

    this.init();
  }

  /**
   * เริ่มต้นการทำงาน
   */
  init() {
    this.initAddModal();
    this.initEditModal();
    this.initDeleteModal();
    this.loadWasteTypes();
    this.setupEventListeners();
    this.setupWasteTypeBadges();
  }

  /**
   * โหลดข้อมูลประเภทขยะ
   */
  async loadWasteTypes() {
    try {
      const response = await fetchWasteTypes();

      if (response.success) {
        this.wasteTypes = response.data;
        this.populateWasteTypeSelect();
      } else {
        console.error("เกิดข้อผิดพลาดในการโหลดประเภทขยะ:", response.message);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดประเภทขยะ:", error);
    }
  }

  /**
   * เพิ่มข้อมูลประเภทขยะลงใน dropdown
   */
  populateWasteTypeSelect() {
    // เคลียร์ตัวเลือกเดิม
    this.addWasteType.innerHTML = '<option value="">เลือกประเภทขยะ</option>';
    this.editWasteType.innerHTML = '<option value="">เลือกประเภทขยะ</option>';

    // เพิ่มตัวเลือกใหม่
    this.wasteTypes.forEach((type) => {
      const addOption = document.createElement("option");
      addOption.value = type.id;
      addOption.textContent = type.name;
      this.addWasteType.appendChild(addOption);

      const editOption = document.createElement("option");
      editOption.value = type.id;
      editOption.textContent = type.name;
      this.editWasteType.appendChild(editOption);
    });
  }

  /**
   * ตั้งค่า event listener
   */
  setupEventListeners() {
    // Listen for edit button click events
    document.addEventListener("editButtonClicked", (e) => {
      this.openEditModal(e.detail.id);
    });

    // Listen for delete button click events
    document.addEventListener("deleteButtonClicked", (e) => {
      this.openDeleteModal(e.detail.id);
    });

    // ปิดโมดัลเมื่อคลิกที่ปุ่ม X
    document.querySelectorAll(".close-modal").forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        this.closeAllModals();
      });
    });
  }

  /**
   * ตั้งค่า event listeners สำหรับการแสดง badge ประเภทขยะ
   */
  setupWasteTypeBadges() {
    // จัดการ badge ในโมดัลเพิ่มข้อมูล
    this.addWasteType.addEventListener("change", () => {
      this.updateWasteTypeBadge(this.addWasteType, this.addWasteTypeBadge);
    });

    // จัดการ badge ในโมดัลแก้ไขข้อมูล
    this.editWasteType.addEventListener("change", () => {
      this.updateWasteTypeBadge(this.editWasteType, this.editWasteTypeBadge);
    });
  }

  /**
   * อัปเดต badge ประเภทขยะตามที่เลือก
   */
  updateWasteTypeBadge(selectElement, badgeElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const wasteTypeId = selectElement.value;

    if (!wasteTypeId) {
      badgeElement.style.display = "none";
      return;
    }

    const wasteTypeName = selectedOption.textContent;
    badgeElement.textContent = wasteTypeName;

    // กำหนดสีตามประเภทขยะ (พื้นหลังโปร่งใส สีตัวอักษรเข้ม)
    let backgroundColor = "rgba(158, 158, 158, 0.15)"; // พื้นหลังสีเทาโปร่งใส
    let textColor = "#616161"; // สีตัวอักษรเทาเข้ม
    let textSize = "15px";

    const typeName = wasteTypeName.toLowerCase();
    if (typeName.includes("รีไซเคิล")) {
      backgroundColor = "rgba(33, 150, 243, 0.15)"; // พื้นหลังสีฟ้าโปร่งใส
      textColor = "#0d6efd"; // สีตัวอักษรฟ้าเข้ม
      textSize = "15px";
    } else if (typeName.includes("อินทรีย์") || typeName.includes("เศษอาหาร") || typeName.includes("ย่อยสลาย")) {
      backgroundColor = "rgba(76, 175, 80, 0.15)"; // พื้นหลังสีเขียวโปร่งใส
      textColor = "#2e7d32"; // สีตัวอักษรเขียวเข้ม
      textSize = "15px";
    } else if (typeName.includes("อันตราย") || typeName.includes("พิษ") || typeName.includes("สารเคมี")) {
      backgroundColor = "rgba(244, 67, 54, 0.15)"; // พื้นหลังสีแดงโปร่งใส
      textColor = "#c62828"; // สีตัวอักษรแดงเข้ม
      textSize = "15px";
    } else if (typeName.includes("ทั่วไป")) {
      backgroundColor = "rgba(255, 152, 0, 0.15)"; // พื้นหลังสีส้มโปร่งใส
      textColor = "#e65100"; // สีตัวอักษรส้มเข้ม
      textSize = "15px";
    }

    badgeElement.style.backgroundColor = backgroundColor;
    badgeElement.style.color = textColor;
    badgeElement.style.borderColor = "transparent";
    badgeElement.style.fontSize = textSize;
    badgeElement.style.display = "inline-flex";
  }

  /**
   * เริ่มต้นการทำงานของโมดัลเพิ่มข้อมูล
   */
  initAddModal() {
    // เตรียมค่าวันที่เป็นวันปัจจุบัน
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    this.addRecordDate.value = formattedDate;

    // เมื่อกดปุ่มยกเลิก
    this.addCancelBtn.addEventListener("click", () => {
      this.closeModal(this.addModal);
    });

    // เมื่อส่งฟอร์ม
    this.addForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitAddForm();
    });
  }

  /**
   * เริ่มต้นการทำงานของโมดัลแก้ไขข้อมูล
   */
  initEditModal() {
    // ไม่จำเป็นต้องซ่อน input วันที่อีกต่อไปเนื่องจากเราได้ใช้ type="hidden" ในไฟล์ HTML แล้ว

    // เมื่อกดปุ่มยกเลิก
    this.editCancelBtn.addEventListener("click", () => {
      this.closeModal(this.editModal);
    });

    // เมื่อส่งฟอร์ม
    this.editForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitEditForm();
    });
  }

  /**
   * เริ่มต้นการทำงานของโมดัลยืนยันการลบ
   */
  initDeleteModal() {
    // เมื่อกดปุ่มยืนยันการลบ
    this.confirmDeleteBtn.addEventListener("click", () => {
      this.confirmDelete();
    });

    // เมื่อกดปุ่มยกเลิก
    this.cancelDeleteBtn.addEventListener("click", () => {
      this.closeModal(this.deleteModal);
    });
  }

  /**
   * เปิดโมดัลเพิ่มข้อมูล
   */
  async openAddModal() {
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    const authData = await checkAuthStatus();
    if (!authData || !authData.isAuthenticated) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
      window.location.href = "/login";
      return;
    }

    // รีเซ็ตฟอร์ม
    this.addForm.reset();

    // ไม่ตั้งค่าวันที่เป็นวันปัจจุบัน แต่ให้ว่างไว้เพื่อให้ผู้ใช้เลือกเอง
    this.addRecordDate.value = "";

    // เพิ่ม: หากมี element แสดงวันที่แบบไทย ให้แสดงคำว่า "เลือกวันที่"
    const dateContainer = this.addRecordDate.parentNode.querySelector(".thai-date-display");
    if (dateContainer) {
      dateContainer.textContent = "เลือกวันที่";
    }

    // ซ่อน badge
    this.addWasteTypeBadge.style.display = "none";

    // เปิดโมดัล
    this.openModal(this.addModal);
  }

  /**
   * เปิดโมดัลแก้ไขข้อมูล
   */
  async openEditModal(id) {
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }

      // ดึงข้อมูลจาก API
      const response = await fetchWasteRecordById(id);

      if (!response.success) {
        throw new Error(response.message || "ไม่สามารถดึงข้อมูลได้");
      }

      const data = response.data;

      // เติมข้อมูลลงในฟอร์ม
      this.editInfoId.value = data.id;

      // แปลงวันที่ให้อยู่ในรูปแบบที่ถูกต้อง
      const date = new Date(data.recorded_date);
      const formattedDate = date.toISOString().split("T")[0];

      // เก็บวันที่แบบซ่อนไว้ (จะไม่ถูกส่งไปแก้ไข)
      this.editRecordDate.value = formattedDate;

      // ใช้ฟังก์ชัน formatDate จาก utilities แทนการกำหนดรูปแบบโดยตรง
      this.editRecordDateTime.innerHTML = `<strong>วันที่บันทึก:</strong> ${formatDate(data.recorded_date)} `;

      this.editWasteType.value = data.waste_type_id;
      this.editWasteWeight.value = data.amount;

      // อัปเดต badge ตามประเภทขยะที่เลือก
      this.updateWasteTypeBadge(this.editWasteType, this.editWasteTypeBadge);

      // เปิดโมดัล
      this.openModal(this.editModal);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับแก้ไข:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }

  /**
   * เปิดโมดัลยืนยันการลบ
   */
  async openDeleteModal(id) {
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }

      this.currentDeleteId = id;

      // ดึงข้อมูลของรายการที่จะลบจาก API
      const response = await fetchWasteRecordById(id);

      if (response.success) {
        const data = response.data;

        // หาชื่อประเภทขยะจาก ID
        let wasteTypeName = "ไม่ระบุ";
        const wasteType = this.wasteTypes.find((type) => type.id === data.waste_type_id);
        if (wasteType) {
          wasteTypeName = wasteType.name;
        }

        // สร้าง badge สำหรับประเภทขยะ
        const wasteTypeClass = this.getWasteTypeClass(wasteTypeName);
        const wasteTypeBadge = `<span class="waste-type-badge ${wasteTypeClass}" style="display: inline-flex">${wasteTypeName}</span>`;

        // สร้าง HTML สำหรับแสดงข้อมูล
        this.deleteInfoContainer.innerHTML = `
          <div class="delete-info">
            <div class="delete-item-details">
              <p><strong>วันที่บันทึก:</strong> ${formatDate(data.recorded_date)}</p>
              <p><strong>ประเภทขยะ:</strong> ${wasteTypeBadge}</p>
              <p><strong>น้ำหนัก:</strong> ${data.amount} กิโลกรัม</p>
              <p><strong>ผู้บันทึก:</strong> ${data.full_name || "ไม่ระบุ"}</p>
            </div>
          </div>
        `;
      } else {
        // ถ้าไม่สามารถดึงข้อมูลได้ ไม่ต้องแสดงข้อความเพิ่มเติม
        this.deleteInfoContainer.innerHTML = "";
      }

      // เปิดโมดัล
      this.openModal(this.deleteModal);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับลบ:", error);
      // แสดงโมดัลแบบพื้นฐานในกรณีที่เกิดข้อผิดพลาด
      this.deleteInfoContainer.innerHTML = `
        <div class="delete-info">
          <p>คุณต้องการลบข้อมูลนี้หรือไม่?</p>
        </div>
      `;
      this.openModal(this.deleteModal);
    }
  }

  /**
   * รับ CSS class สำหรับประเภทขยะ
   */
  getWasteTypeClass(wasteTypeName) {
    const typeName = wasteTypeName.toLowerCase();

    if (typeName.includes("รีไซเคิล")) {
      return "type-recycle";
    } else if (typeName.includes("อินทรีย์") || typeName.includes("เศษอาหาร") || typeName.includes("ย่อยสลาย")) {
      return "type-organic";
    } else if (typeName.includes("อันตราย") || typeName.includes("พิษ") || typeName.includes("สารเคมี")) {
      return "type-hazardous";
    } else if (typeName.includes("ทั่วไป")) {
      return "type-general";
    } else {
      return "type-other";
    }
  }

  /**
   * ส่งฟอร์มเพิ่มข้อมูล
   */
  async submitAddForm() {
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }

      // เก็บข้อมูลจากฟอร์ม
      const selectedDate = this.addRecordDate.value;

      // สร้าง Date object ที่มีทั้งวันที่และเวลาปัจจุบัน
      let recordDate;
      if (selectedDate) {
        const now = new Date();
        recordDate = new Date(selectedDate);
        // ตั้งเวลาเป็นเวลาปัจจุบัน
        recordDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      } else {
        recordDate = new Date();
      }

      const data = {
        waste_type_id: parseInt(this.addWasteType.value),
        amount: parseFloat(this.addWasteWeight.value),
        recorded_date: recordDate.toISOString(), // ส่งวันที่พร้อมเวลาในรูปแบบ ISO
      };

      // ตรวจสอบข้อมูล
      if (!data.waste_type_id) {
        alert("กรุณาเลือกประเภทขยะ");
        return;
      }

      if (!data.amount || data.amount <= 0) {
        alert("กรุณาระบุน้ำหนักขยะที่ถูกต้อง");
        return;
      }

      // ส่งข้อมูลไปยัง API
      const response = await addWasteRecord(data);

      if (!response.success) {
        throw new Error(response.message || "ไม่สามารถบันทึกข้อมูลได้");
      }

      // ปิดโมดัล
      this.closeModal(this.addModal);

      // โหลดข้อมูลใหม่
      await tableManager.loadData();

      // แสดงข้อความสำเร็จ
      alert("บันทึกข้อมูลสำเร็จ");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }

  /**
   * ส่งฟอร์มแก้ไขข้อมูล
   */
  async submitEditForm() {
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }

      const id = this.editInfoId.value;

      // เก็บข้อมูลจากฟอร์ม (ไม่รวมวันที่)
      const data = {
        waste_type_id: parseInt(this.editWasteType.value),
        amount: parseFloat(this.editWasteWeight.value),
        // ไม่ส่ง recorded_date เพื่อไม่ให้มีการแก้ไขวันที่
      };

      // ตรวจสอบข้อมูล
      if (!data.waste_type_id) {
        alert("กรุณาเลือกประเภทขยะ");
        return;
      }

      if (!data.amount || data.amount <= 0) {
        alert("กรุณาระบุน้ำหนักขยะที่ถูกต้อง");
        return;
      }

      try {
        // ส่งข้อมูลไปยัง API
        const response = await updateWasteRecord(id, data);

        if (!response.success) {
          if (response.message && response.message.includes("ไม่พบข้อมูล")) {
            alert("ไม่สามารถแก้ไขได้: ข้อมูลนี้ถูกลบไปแล้วหรือไม่มีในระบบ");
            this.closeModal(this.editModal);
            await tableManager.loadData();
            return;
          }
          throw new Error(response.message || "ไม่สามารถอัปเดตข้อมูลได้");
        }

        // ปิดโมดัล
        this.closeModal(this.editModal);

        // โหลดข้อมูลใหม่
        await tableManager.loadData();

        // แสดงข้อความสำเร็จ
        alert("แก้ไขข้อมูลสำเร็จ");
      } catch (apiError) {
        // ตรวจสอบว่าเป็นข้อผิดพลาด 404 หรือไม่
        if (apiError.message && apiError.message.includes("404")) {
          alert("ไม่สามารถแก้ไขได้: ข้อมูลนี้ถูกลบไปแล้วหรือไม่มีในระบบ");
          this.closeModal(this.editModal);
          await tableManager.loadData();
          return;
        }
        throw apiError; // โยนข้อผิดพลาดต่อไปให้ catch ด้านนอก
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }

  /**
   * ยืนยันการลบข้อมูล
   */
  async confirmDelete() {
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }

      if (!this.currentDeleteId) {
        throw new Error("ไม่พบรหัสข้อมูลที่ต้องการลบ");
      }

      try {
        // ส่งคำขอลบไปยัง API
        const response = await deleteWasteRecord(this.currentDeleteId);

        if (!response.success) {
          if (response.message && response.message.includes("ไม่พบข้อมูล")) {
            alert("ไม่สามารถลบได้: ข้อมูลนี้ถูกลบไปแล้วหรือไม่มีในระบบ");
            this.closeModal(this.deleteModal);
            await tableManager.loadData();
            return;
          }
          throw new Error(response.message || "ไม่สามารถลบข้อมูลได้");
        }

        // รีเซ็ต ID ที่กำลังลบ
        this.currentDeleteId = null;

        // ปิดโมดัล
        this.closeModal(this.deleteModal);

        // โหลดข้อมูลใหม่
        await tableManager.loadData();

        // แสดงข้อความสำเร็จ
        alert("ลบข้อมูลสำเร็จ");
      } catch (apiError) {
        // ตรวจสอบว่าเป็นข้อผิดพลาด 404 หรือไม่
        if (apiError.message && apiError.message.includes("404")) {
          alert("ไม่สามารถลบได้: ข้อมูลนี้ถูกลบไปแล้วหรือไม่มีในระบบ");
          this.closeModal(this.deleteModal);
          await tableManager.loadData();
          return;
        }
        throw apiError; // โยนข้อผิดพลาดต่อไปให้ catch ด้านนอก
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการลบข้อมูล:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }

  /**
   * เปิดโมดัล
   */
  openModal(modal) {
    if (modal) {
      modal.style.display = "block";
    }
  }

  /**
   * ปิดโมดัล
   */
  closeModal(modal) {
    if (modal) {
      modal.style.display = "none";
    }
  }

  /**
   * ปิดโมดัลทั้งหมด
   */
  closeAllModals() {
    this.closeModal(this.addModal);
    this.closeModal(this.editModal);
    this.closeModal(this.deleteModal);
  }
}

// สร้าง singleton instance
const modalManager = new ModalManager();
export default modalManager;
