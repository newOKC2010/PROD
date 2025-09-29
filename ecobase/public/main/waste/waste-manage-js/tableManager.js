/**
 * TableManager - จัดการการแสดงข้อมูลในตาราง
 * ทำหน้าที่:
 * - แสดงข้อมูลจาก API
 * - จัดการปุ่มการจัดการตามบทบาทผู้ใช้
 * - ปรับปรุงข้อมูลแบบเรียลไทม์
 */

import { fetchWasteRecords } from "./api.js";
import { getUserRole } from "./userService.js";
import { formatDate, formatNumber } from "./utilities.js";

export class TableManager {
  constructor() {
    this.tableBody = document.getElementById("data-table-body");
    this.currentPage = 1;
    this.pageSize = 5;
    this.totalItems = 0;
    this.totalPages = 0;
    this.filters = {};
    this.data = [];
  }

  /**
   * โหลดข้อมูลจาก API และแสดงในตาราง
   */
  async loadData(page = this.currentPage, pageSize = this.pageSize, filters = this.filters) {
    try {
      // ตรวจสอบสถานะการเข้าสู่ระบบ
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return { success: false, message: "ไม่ได้เข้าสู่ระบบ" };
      }

      // แสดงสถานะกำลังโหลด
      // this.showLoading();

      // เก็บค่าปัจจุบัน
      this.currentPage = page;
      this.pageSize = pageSize;
      this.filters = filters;

      // เรียกข้อมูลจาก API
      const response = await fetchWasteRecords(page, pageSize, filters);

      if (!response.success) {
        throw new Error(response.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      }

      // เก็บข้อมูล
      this.data = response.data;
      this.totalItems = response.total;
      this.totalPages = response.totalPages;

      // แสดงข้อมูลในตาราง
      await this.renderTable();

      // ส่งข้อมูลการแบ่งหน้าไปยังระบบ pagination
      this.triggerEvent("pageInfoUpdated", {
        currentPage: this.currentPage,
        totalPages: this.totalPages,
        totalItems: this.totalItems,
        pageSize: this.pageSize,
        showingFrom: (this.currentPage - 1) * this.pageSize + 1,
        showingTo: Math.min(this.currentPage * this.pageSize, this.totalItems),
      });

      return {
        success: true,
        data: this.data,
        totalItems: this.totalItems,
        totalPages: this.totalPages,
      };
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
      this.showError(error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * แสดงข้อมูลในตาราง
   */
  async renderTable() {
    // เคลียร์ตารางเดิม
    this.tableBody.innerHTML = "";

    // ถ้าไม่มีข้อมูล
    if (this.data.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.className = "empty-row";
      emptyRow.innerHTML = `<td colspan="6" class="text-center">ไม่พบข้อมูล</td>`;
      this.tableBody.appendChild(emptyRow);
      return;
    }

    // ดึงบทบาทผู้ใช้ปัจจุบัน
    const userRole = getUserRole();

    // แสดงข้อมูล
    this.data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.dataset.id = item.id;

      // คำนวณลำดับที่แสดงในตาราง
      const itemNumber = (this.currentPage - 1) * this.pageSize + index + 1;

      // สร้างปุ่มจัดการตามบทบาทผู้ใช้
      let actionButtons = "";

      // ถ้าเป็น admin แสดงทั้งปุ่มแก้ไขและลบ
      if (userRole === "admin") {
        actionButtons = `
          <button class="edit-btn action-btn" data-id="${item.id}" title="แก้ไข">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn action-btn" data-id="${item.id}" title="ลบ">
            <i class="fas fa-trash-alt"></i>
          </button>
        `;
      } else {
        // ถ้าเป็น user ธรรมดา แสดงเฉพาะปุ่มแก้ไข
        actionButtons = `
          <button class="edit-btn action-btn" data-id="${item.id}" title="แก้ไข">
            <i class="fas fa-edit"></i>
          </button>
        `;
      }

      // กำหนด class สำหรับ badge ตามประเภทขยะ
      let wasteTypeClass = "type-other"; // ค่าเริ่มต้นเป็น "อื่นๆ"

      // ตรวจสอบชื่อประเภทขยะและกำหนด class ตามประเภท
      const wasteTypeName = item.waste_type_name.toLowerCase();
      if (wasteTypeName.includes("รีไซเคิล")) {
        wasteTypeClass = "type-recycle";
      } else if (
        wasteTypeName.includes("อินทรีย์") ||
        wasteTypeName.includes("เศษอาหาร") ||
        wasteTypeName.includes("ย่อยสลาย")
      ) {
        wasteTypeClass = "type-organic";
      } else if (
        wasteTypeName.includes("อันตราย") ||
        wasteTypeName.includes("พิษ") ||
        wasteTypeName.includes("สารเคมี")
      ) {
        wasteTypeClass = "type-hazardous";
      } else if (wasteTypeName.includes("ทั่วไป")) {
        wasteTypeClass = "type-general";
      }

      // สร้าง HTML สำหรับแสดงประเภทขยะในรูปแบบ badge
      const wasteTypeBadge = `<span class="waste-type-badge ${wasteTypeClass}">${item.waste_type_name}</span>`;

      // สร้าง HTML ของแถว
      row.innerHTML = `
        <td class="text-center">${itemNumber}</td>
        <td>${formatDate(item.recorded_date)}</td>
        <td>${item.full_name}</td>
        <td class="waste-type-cell">${wasteTypeBadge}</td>
        <td class="text-right">${formatNumber(item.amount)}</td>
        <td class="action-buttons">
          ${actionButtons}
        </td>
      `;

      // เพิ่มแถวลงในตาราง
      this.tableBody.appendChild(row);
    });

    // เพิ่ม event listener สำหรับปุ่มในตาราง
    await this.addTableButtonListeners();
  }

  /**
   * เพิ่ม event listener สำหรับปุ่มในตาราง
   */
  async addTableButtonListeners() {
    // ตรวจสอบสถานะการเข้าสู่ระบบ
    const authData = await checkAuthStatus();

    // ปุ่มแก้ไข
    const editButtons = this.tableBody.querySelectorAll(".edit-btn");
    editButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        // ตรวจสอบสถานะการเข้าสู่ระบบทุกครั้งที่กดปุ่ม
        if (!authData || !authData.isAuthenticated) {
          alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
          window.location.href = "/login";
          return;
        }

        const id = event.currentTarget.dataset.id;
        this.triggerEvent("editButtonClicked", { id });
      });
    });

    // ปุ่มลบ
    const deleteButtons = this.tableBody.querySelectorAll(".delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        // ตรวจสอบสถานะการเข้าสู่ระบบทุกครั้งที่กดปุ่ม
        if (!authData || !authData.isAuthenticated) {
          alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
          window.location.href = "/login";
          return;
        }

        const id = event.currentTarget.dataset.id;
        this.triggerEvent("deleteButtonClicked", { id });
      });
    });
  }

  /**
   * แสดงสถานะกำลังโหลด
   */
  showLoading() {
    this.tableBody.innerHTML = `
      <tr class="loading-row">
        <td colspan="6" class="text-center">กำลังโหลดข้อมูล...</td>
      </tr>
    `;
  }

  /**
   * แสดงข้อความผิดพลาด
   */
  showError(message) {
    this.tableBody.innerHTML = `
      <tr class="error-row">
        <td colspan="6" class="text-center text-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          ${message || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
        </td>
      </tr>
    `;
  }

  /**
   * สร้างและส่ง event
   */
  triggerEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}

// สร้าง singleton instance
const tableManager = new TableManager();
export default tableManager;
