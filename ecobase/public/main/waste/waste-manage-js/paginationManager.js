/**
 * PaginationManager - จัดการการแบ่งหน้าข้อมูล
 * ทำหน้าที่:
 * - แสดงปุ่มแบ่งหน้า
 * - จัดการการเปลี่ยนหน้า
 * - จัดการขนาดข้อมูลต่อหน้า
 * - อัปเดตการแสดงผลเมื่อข้อมูลเปลี่ยน
 */

import tableManager from './tableManager.js';

export class PaginationManager {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 5; // ค่าเริ่มต้น
    this.totalPages = 0;
    this.totalItems = 0;
    this.filters = {};
    
    // DOM elements
    this.pageSizeSelector = document.getElementById('page-size-selector');
    this.prevPageBtn = document.getElementById('prev-page-btn');
    this.nextPageBtn = document.getElementById('next-page-btn');
    this.pageNumbers = document.getElementById('page-numbers');
    
    // เริ่มต้นการทำงาน
    this.init();
  }
  
  /**
   * เริ่มต้นการทำงาน
   */
  init() {
    this.setupEventListeners();
    this.setupTableEvents();
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับการแบ่งหน้า
   */
  setupEventListeners() {
    // เมื่อเปลี่ยนขนาดหน้า
    this.pageSizeSelector.addEventListener('change', () => {
      this.changePageSize(parseInt(this.pageSizeSelector.value));
    });
    
    // เมื่อกดปุ่มหน้าก่อนหน้า
    this.prevPageBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    });
    
    // เมื่อกดปุ่มหน้าถัดไป
    this.nextPageBtn.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.goToPage(this.currentPage + 1);
      }
    });
  }
  
  /**
   * ตั้งค่า Event Listeners สำหรับรับข้อมูลจาก TableManager
   */
  setupTableEvents() {
    document.addEventListener('pageInfoUpdated', (event) => {
      const data = event.detail;
      
      // ถ้าลบข้อมูลแล้วทำให้จำนวนหน้าลดลงจนน้อยกว่าหน้าปัจจุบัน ให้กลับไปยังหน้าสุดท้าย
      if (data.totalPages < this.currentPage && data.totalPages > 0) {
        this.currentPage = data.totalPages;
        // โหลดข้อมูลของหน้าสุดท้ายทันที
        tableManager.loadData(this.currentPage, this.pageSize, this.filters);
        return; // ออกจากฟังก์ชัน เพราะจะมีการเรียก event นี้อีกครั้งหลังจาก loadData
      }
      
      this.currentPage = data.currentPage;
      this.totalPages = data.totalPages;
      this.totalItems = data.totalItems;
      this.pageSize = data.pageSize;
      
      this.updatePagination();
      this.updatePaginationButtons();
    });
  }
  
  /**
   * ไปยังหน้าแรก
   */
  goToFirstPage() {
    if (this.currentPage !== 1) {
      this.goToPage(1);
    }
  }
  
  /**
   * ไปยังหน้าสุดท้าย
   */
  goToLastPage() {
    if (this.currentPage !== this.totalPages && this.totalPages > 0) {
      this.goToPage(this.totalPages);
    }
  }
  
  /**
   * ไปยังหน้าที่ระบุ
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    tableManager.loadData(this.currentPage, this.pageSize, this.filters);
  }
  
  /**
   * เปลี่ยนขนาดข้อมูลต่อหน้า
   */
  changePageSize(size) {
    this.pageSize = size;
    this.currentPage = 1; // กลับไปหน้าแรกเมื่อเปลี่ยนขนาดหน้า
    tableManager.loadData(this.currentPage, this.pageSize, this.filters);
  }
  
  /**
   * กำหนดตัวกรองข้อมูล
   */
  setFilters(filters) {
    this.filters = filters;
    this.currentPage = 1; // กลับไปหน้าแรกเมื่อใช้ตัวกรอง
    tableManager.loadData(this.currentPage, this.pageSize, this.filters);
  }
  
  /**
   * อัปเดตการแสดงผลการแบ่งหน้า
   */
  updatePagination() {
    // ข้อมูลที่กำลังแสดง
    document.getElementById("showing-from").textContent = this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    document.getElementById("showing-to").textContent = Math.min(this.currentPage * this.pageSize, this.totalItems);
    document.getElementById("total-items").textContent = this.totalItems;

    // อัปเดตปุ่มก่อนหน้าและถัดไป
    this.prevPageBtn.disabled = this.currentPage === 1;
    this.nextPageBtn.disabled = this.currentPage === this.totalPages || this.totalPages === 0;

    // สร้างปุ่มหมายเลขหน้า
    this.pageNumbers.innerHTML = "";
    
    // ถ้าไม่มีข้อมูล ให้แสดงปุ่มหน้าที่ 1 ที่ไม่สามารถคลิกได้
    if (this.totalPages === 0) {
      const pageBtn = document.createElement("div");
      pageBtn.className = "page-number active";
      pageBtn.textContent = 1;
      this.pageNumbers.appendChild(pageBtn);
      return;
    }
    
    // สร้างปุ่มไปหน้าแรก
    const firstPageBtn = document.createElement("div");
    firstPageBtn.className = "page-number first-page";
    firstPageBtn.innerHTML = '<i class="fas fa-angle-double-left"></i>';
    firstPageBtn.title = "หน้าแรก";
    firstPageBtn.addEventListener("click", () => this.goToFirstPage());
    this.pageNumbers.appendChild(firstPageBtn);

    // กำหนดจำนวนปุ่มที่จะแสดง - ลดลงเพื่อให้แสดงผลได้ดีขึ้นบนหน้าจอขนาดเล็ก
    const maxButtons = window.innerWidth < 768 ? 3 : 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(this.totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons && startPage > 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // เพิ่มปุ่มหน้าแรก (ตัวเลข 1)
    if (startPage > 1) {
      const firstNumBtn = document.createElement("div");
      firstNumBtn.className = "page-number";
      firstNumBtn.textContent = "1";
      firstNumBtn.addEventListener("click", () => this.goToPage(1));
      this.pageNumbers.appendChild(firstNumBtn);

      if (startPage > 2) {
        const ellipsis = document.createElement("div");
        ellipsis.className = "page-ellipsis";
        ellipsis.textContent = "...";
        this.pageNumbers.appendChild(ellipsis);
      }
    }

    // เพิ่มปุ่มหมายเลขหน้า
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("div");
      pageBtn.className = `page-number ${i === this.currentPage ? "active" : ""}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener("click", () => this.goToPage(i));
      this.pageNumbers.appendChild(pageBtn);
    }

    // เพิ่มปุ่มหน้าสุดท้าย (ตัวเลขสุดท้าย)
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        const ellipsis = document.createElement("div");
        ellipsis.className = "page-ellipsis";
        ellipsis.textContent = "...";
        this.pageNumbers.appendChild(ellipsis);
      }

      const lastNumBtn = document.createElement("div");
      lastNumBtn.className = "page-number";
      lastNumBtn.textContent = this.totalPages;
      lastNumBtn.addEventListener("click", () => this.goToPage(this.totalPages));
      this.pageNumbers.appendChild(lastNumBtn);
    }
    
    // สร้างปุ่มไปหน้าสุดท้าย
    const lastPageBtn = document.createElement("div");
    lastPageBtn.className = "page-number last-page";
    lastPageBtn.innerHTML = '<i class="fas fa-angle-double-right"></i>';
    lastPageBtn.title = "หน้าสุดท้าย";
    lastPageBtn.addEventListener("click", () => this.goToLastPage());
    this.pageNumbers.appendChild(lastPageBtn);
  }
  
  /**
   * อัปเดตข้อมูลของปุ่มแบ่งหน้า
   */
  updatePaginationButtons() {
    this.prevPageBtn.setAttribute("data-current-page", this.currentPage);
    this.nextPageBtn.setAttribute("data-current-page", this.currentPage);
    this.nextPageBtn.setAttribute("data-total-pages", this.totalPages);
  }
}

// สร้าง singleton instance
const paginationManager = new PaginationManager();
export default paginationManager;
