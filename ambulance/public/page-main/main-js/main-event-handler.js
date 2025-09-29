/**
 * Main Event Handler - จัดการ Event Listeners และ User Interactions
 */

export class MainEventHandler {
    constructor(authManager, componentInitializer) {
        this.authManager = authManager;
        this.componentInitializer = componentInitializer;
        this.managers = null;
    }

    /**
     * เริ่มต้น event handlers ทั้งหมด
     */
    initialize() {
        this.managers = this.componentInitializer.getManagers();
        this.setupEventListeners();
        this.setupGlobalFunctions();
    }

    /**
     * ตั้งค่า Event Listeners
     */
    setupEventListeners() {
        this.setupRefreshButton();
        this.setupAddNewButton();
        console.log('Main page event listeners setup complete');
    }

    /**
     * ตั้งค่าปุ่มรีเฟรช
     */
    setupRefreshButton() {
        const refreshBtn = document.getElementById('refreshBtn');
        
        if (!refreshBtn) return;
        
        refreshBtn.addEventListener('click', async () => {
            const isValid = await this.authManager.validateTokenBeforeAction();
            if (!isValid) return;
            
            this.handleRefresh();
        });
    }

    /**
     * ตั้งค่าปุ่มเพิ่มข้อมูลใหม่
     */
    setupAddNewButton() {
        const addNewBtn = document.getElementById('addNewBtn');
        
        if (!addNewBtn) return;
        
        addNewBtn.addEventListener('click', async () => {
            const isValid = await this.authManager.validateTokenBeforeAction();
            if (!isValid) return;
            
            this.handleAddNew();
        });
    }

    /**
     * จัดการการรีเฟรช
     */
    handleRefresh() {
        if (this.managers.tableManager) {
            this.managers.tableManager.refresh();
        }
    }

    /**
     * จัดการการเพิ่มข้อมูลใหม่
     */
    handleAddNew() {
        if (this.managers.modalAddManager) {
            this.managers.modalAddManager.showModal();
        } else {
            this.showNotReadyMessage();
        }
    }

    /**
     * แสดงข้อความยังไม่พร้อมใช้งาน
     */
    showNotReadyMessage() {
        Swal.fire({
            title: 'ยังไม่พร้อมใช้งาน',
            text: 'ระบบเพิ่มข้อมูลยังไม่พร้อมใช้งาน',
            icon: 'info',
            confirmButtonText: 'ตกลง'
        });
    }

    /**
     * ตั้งค่า Global Functions สำหรับใช้จากภายนอก
     */
    setupGlobalFunctions() {
        window.mainPageFunctions = {
            refreshTable: () => this.refreshTable(),
            searchTable: (searchTerm) => this.searchTable(searchTerm),
            getCurrentUser: () => this.authManager.getCurrentUser(),
            getTableManager: () => this.managers.tableManager,
            getSearchManager: () => this.managers.searchFilterManager,
            getModalAddManager: () => this.managers.modalAddManager
        };
    }

    /**
     * รีเฟรชตาราง
     */
    refreshTable() {
        if (this.managers.tableManager) {
            this.managers.tableManager.refresh();
        }
        if (this.managers.searchFilterManager) {
            this.managers.searchFilterManager.refreshSearch();
        }
    }

    /**
     * ค้นหาในตาราง
     */
    searchTable(searchTerm) {
        if (this.managers.tableManager) {
            this.managers.tableManager.search(searchTerm);
        }
    }
} 