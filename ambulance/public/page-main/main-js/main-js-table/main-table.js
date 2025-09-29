/**
 * Main Table System - จัดการตารางแสดงข้อมูล Checklist
 * Refactored version - ใช้ utility classes เพื่อให้ clean code
 */

import { PaginationManager } from '/global-pagination.js';
import { ChecklistModalManager } from '/main-modal-view.js';
import { MainModalUpdate } from '/main-modal-update.js';
import { TableUtils } from '/table-utils.js';
import { TableDataManager } from '/table-data-manager.js';
import { TableEventHandler } from '/table-event-handler.js';
import { getStoredToken } from '/global-api.js';

export class MainTableManager {
    constructor(options = {}) {
        this.tableContainer = options.tableContainer;
        this.paginationContainer = options.paginationContainer;
        this.infoContainer = options.infoContainer;
        this.itemsPerPageSelect = options.itemsPerPageSelect;
        this.loadingIndicator = options.loadingIndicator;
        this.currentUser = options.currentUser;
        
        // Initialize utility classes
        this.tableUtils = new TableUtils();
        this.dataManager = new TableDataManager();
        
        // Initialize components
        this.initializePagination();
        this.initializeModals();
        this.initializeEventHandler();
        
        this.isLoading = false;
    }
    
    /**
     * เริ่มต้น Pagination
     */
    initializePagination() {
        this.pagination = new PaginationManager({
            tableContainer: this.tableContainer,
            paginationContainer: this.paginationContainer,
            itemsPerPageSelect: this.itemsPerPageSelect,
            infoContainer: this.infoContainer,
            itemsPerPage: 5,
            onPageChange: (page, data) => {
                this.renderTable(data);
            },
            onItemsPerPageChange: (itemsPerPage) => {
                this.renderTable(this.pagination.getCurrentPageData());
            }
        });
    }
    
    /**
     * เริ่มต้น Modals
     */
    initializeModals() {
        this.modalManager = new ChecklistModalManager({
            currentUser: this.currentUser
        });
        
        this.updateModalManager = new MainModalUpdate({
            currentUser: this.currentUser,
            tableManager: this
        });
    }

    /**
     * เริ่มต้น Event Handler
     */
    initializeEventHandler() {
        this.eventHandler = new TableEventHandler(
            this.dataManager,
            this.modalManager,
            this.updateModalManager,
            this
        );
    }
    
    /**
     * โหลดข้อมูล checklist
     */
    async loadChecklistData() {
        this.setLoading(true);
        
        try {
            const result = await this.dataManager.loadChecklistData();
            
            if (result.success) {
                this.updateTable();
            }
            
        } finally {
            this.setLoading(false);
        }
    }
    
    /**
     * อัปเดตตาราง
     */
    updateTable() {
        const { checklistData, filteredData } = this.dataManager.getAllData();
        this.pagination.updateData(checklistData, filteredData);
        this.renderTable(this.pagination.getCurrentPageData());
    }

    /**
     * อัพเดทแถวเดียวในตาราง
     */
    updateTableRow(checklistId, updatedData) {
        const success = this.dataManager.updateTableRow(checklistId, updatedData);
        
        if (success) {
            this.updateTable();
        } else {
            this.refresh();
        }
    }
    
    /**
     * รีเซ็ต pagination กลับไปหน้าแรก
     */
    resetToFirstPage() {
        if (this.pagination && typeof this.pagination.goToPage === 'function') {
            this.pagination.goToPage(1);
        } else if (this.pagination) {
            // Fallback: ตั้งค่า currentPage เป็น 1 โดยตรง
            this.pagination.currentPage = 1;
        }
    }

    /**
     * ลบ item จาก table แบบ smooth (ไม่ refresh ทั้งตาราง)
     */
    removeItemFromTable(itemId) {
        // ลบจาก dataManager
        const success = this.dataManager.removeItemById(itemId);
        
        if (success) {
            // ลบจาก pagination และอัปเดต UI
            this.pagination.removeDataById(itemId, 'id');
            
            // แสดงข้อมูลหน้าปัจจุบัน
            this.renderTable(this.pagination.getCurrentPageData());
        } else {
            console.warn('ไม่สามารถลบ item ได้:', itemId);
            // Fallback: รีเฟรชทั้งตาราง
            this.refresh();
        }
    }
    
    /**
     * แสดงตาราง
     */
    renderTable(data) {
        if (!this.tableContainer) return;
        
        const tableHTML = this.tableUtils.createTableHTML(data, this.currentUser, this.pagination);
        this.tableContainer.innerHTML = tableHTML;
        
        this.eventHandler.attachTableEventListeners(this.tableContainer);
    }
    
    /**
     * ตั้งค่าสถานะ loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = loading ? 'block' : 'none';
        }
        
        if (this.tableContainer && !loading) {
            const existingLoading = this.tableContainer.querySelector('.spinner-border');
            if (existingLoading) {
                this.tableContainer.innerHTML = '';
            }
        }
    }
    
    /**
     * รีเฟรชข้อมูล
     */
    async refresh() {
        const token = getStoredToken();
        const tokenValidation = await this.dataManager.validateToken(token);
        if (!tokenValidation.valid) {
            alert(tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        
        await this.loadChecklistData();
    }
    
    /**
     * ตั้งค่าข้อมูลสำหรับ search/filter (compatibility methods)
     */
    set checklistData(data) {
        this.dataManager.checklistData = data;
    }
    
    get checklistData() {
        return this.dataManager.checklistData;
    }
    
    /**
     * ตั้งค่าข้อมูลที่กรองแล้ว (compatibility methods)
     */
    set filteredData(data) {
        this.dataManager.setFilteredData(data);
    }
    
    get filteredData() {
        return this.dataManager.filteredData;
    }
}
