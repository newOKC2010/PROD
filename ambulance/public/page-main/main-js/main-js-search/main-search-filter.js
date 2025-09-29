/**
 * Filter Manager - จัดการการกรองข้อมูลตามชื่อรถและผู้ตรวจสอบ
 * รวมการตรวจสอบ Authentication ก่อนการค้นหาอัตโนมัติ
 */

import { getStoredToken, removeToken } from '/global-api.js';
import { checkTokenValid, redirectToLogin, getUserData, checkPermissionsAndSetVisibility } from '/global-auth-status.js';

export class FilterManager {
    constructor(options = {}) {
        this.container = options.container;
        this.onFilterChange = options.onFilterChange || (() => {});
        
        // Elements
        this.vehicleSelect = null;
        this.inspectorSelect = null;
        this.vehicleDropdown = null;
        this.inspectorDropdown = null;
        
        // State
        this.currentFilters = {
            vehicle_name: null,
            inspector_name: null
        };
        
        // Data
        this.vehicles = [];
        this.inspectors = [];
        
        this.init();
    }

    /**
     * เริ่มต้นระบบกรอง
     */
    init() {
        this.createFilterHTML();
        this.bindElements();
        this.setupEventListeners();
        this.initializeDropdowns();
        
        // ตรวจสอบสิทธิ์และซ่อน/แสดง inspector filter
        checkPermissionsAndSetVisibility(this.container);
    }



    /**
     * สร้าง HTML สำหรับการกรอง
     */
    createFilterHTML() {
        if (!this.container) return;
        
        const filterHTML = `
            <div class="filter-section">
                <div class="section-title">
                    <i class="fas fa-filter"></i>
                    กรองข้อมูล
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="filter-group">
                            <label for="vehicleFilter">กรองตามชื่อรถ</label>
                            <div class="modern-dropdown" data-dropdown="vehicle">
                                <div class="modern-select-container">
                                    <span class="dropdown-icon">
                                        <i class="fas fa-car"></i>
                                    </span>
                                    <span class="modern-select-value">-- ทุกคัน --</span>
                                    <span class="dropdown-arrow">
                                        <i class="fas fa-chevron-down"></i>
                                    </span>
                                    <div class="modern-select-options">
                                        <div class="modern-option selected" data-value="">-- ทุกคัน --</div>
                                    </div>
                                </div>
                                <select id="vehicleFilter" class="hidden-select">
                                    <option value="">-- ทุกคัน --</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="filter-group">
                            <label for="inspectorFilter">กรองตามผู้ตรวจสอบ</label>
                            <div class="modern-dropdown" data-dropdown="inspector">
                                <div class="modern-select-container">
                                    <span class="dropdown-icon">
                                        <i class="fas fa-user"></i>
                                    </span>
                                    <span class="modern-select-value">-- ทุกคน --</span>
                                    <span class="dropdown-arrow">
                                        <i class="fas fa-chevron-down"></i>
                                    </span>
                                    <div class="modern-select-options">
                                        <div class="modern-option selected" data-value="">-- ทุกคน --</div>
                                    </div>
                                </div>
                                <select id="inspectorFilter" class="hidden-select">
                                    <option value="">-- ทุกคน --</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = filterHTML;
    }

    /**
     * ผูก elements
     */
    bindElements() {
        if (!this.container) return;
        
        this.vehicleSelect = this.container.querySelector('#vehicleFilter');
        this.inspectorSelect = this.container.querySelector('#inspectorFilter');
    }

    /**
     * ตั้งค่า Event Listeners
     */
    setupEventListeners() {
        // Vehicle filter change
        if (this.vehicleSelect) {
            this.vehicleSelect.addEventListener('change', async (event) => {
                this.updateCurrentFilters();
                this.onFilterChange(this.getCurrentFilters());
                
                // Trigger auto search
                await this.triggerAutoSearch();
            });
        }
        
        // Inspector filter change
        if (this.inspectorSelect) {
            this.inspectorSelect.addEventListener('change', async (event) => {
                // ตรวจสอบ role ของผู้ใช้แบบ real-time
                const token = getStoredToken();
                const userData = await getUserData(token);
                if (userData && userData.role === 'user') {
                    alert('คุณไม่มีสิทธิ์ใช้งานฟังก์ชันนี้');
                    window.location.reload();
                    return;
                }
                
                this.updateCurrentFilters();
                this.onFilterChange(this.getCurrentFilters());
                
                // Trigger auto search
                await this.triggerAutoSearch();
            });
        }
    }

    /**
     * เรียกใช้การค้นหาอัตโนมัติ
     */
    async triggerAutoSearch() {
        // ตรวจสอบ token ก่อนค้นหา
        const token = getStoredToken();
        const tokenValidation = await checkTokenValid(token);
        if (!tokenValidation.valid) {
            alert(tokenValidation.message);
            removeToken();
            redirectToLogin();
            return;
        }

        // รีเซ็ต pagination กลับไปหน้าแรกก่อนค้นหา
        if (window.tableManager && typeof window.tableManager.resetToFirstPage === 'function') {
            window.tableManager.resetToFirstPage();
        }

        // หา search button และกดให้อัตโนมัติ
        const searchButton = document.querySelector('#searchBtn, .search-btn, [data-action="search"]');
        if (searchButton && typeof searchButton.click === 'function') {
            setTimeout(() => {
                searchButton.click();
            }, 100);
        }
        
        // หรือเรียกใช้ search function โดยตรงถ้ามี
        if (window.searchManager && typeof window.searchManager.performSearch === 'function') {
            setTimeout(() => {
                window.searchManager.performSearch();
            }, 100);
        }
    }

    /**
     * เริ่มต้น Modern Dropdowns
     */
    initializeDropdowns() {
        setTimeout(() => {
            if (typeof window.initializeModernDropdowns === 'function') {
                window.initializeModernDropdowns(this.container);
            }
            
            // เก็บ reference ของ dropdown instances
            const vehicleDropdownElement = this.container.querySelector('[data-dropdown="vehicle"]');
            const inspectorDropdownElement = this.container.querySelector('[data-dropdown="inspector"]');
            
            if (vehicleDropdownElement && vehicleDropdownElement.modernDropdownInstance) {
                this.vehicleDropdown = vehicleDropdownElement.modernDropdownInstance;
            }
            
            if (inspectorDropdownElement && inspectorDropdownElement.modernDropdownInstance) {
                this.inspectorDropdown = inspectorDropdownElement.modernDropdownInstance;
            }
        }, 100);
    }

    /**
     * ตั้งค่าข้อมูลสำหรับตัวกรอง
     * @param {Array} data - ข้อมูล checklist
     */
    setFilterData(data) {
        this.extractFilterOptions(data);
        this.addFilterOptions();
        this.refreshDropdowns();
    }

    /**
     * สกัดตัวเลือกสำหรับตัวกรอง
     * @param {Array} data - ข้อมูล checklist
     */
    extractFilterOptions(data) {
        const vehicleSet = new Set();
        const inspectorSet = new Set();

        data.forEach(item => {
            if (item.vehicle_name) {
                vehicleSet.add(item.vehicle_name);
            }
            if (item.username) {
                inspectorSet.add(item.username);
            }
        });

        this.vehicles = Array.from(vehicleSet).sort();
        this.inspectors = Array.from(inspectorSet).sort();
    }

    /**
     * เพิ่มตัวเลือกให้กับ select elements
     */
    addFilterOptions() {
        // เพิ่มตัวเลือกรถ
        if (this.vehicleSelect) {
            // ล้างตัวเลือกเดิม (เก็บตัวแรก)
            const firstOption = this.vehicleSelect.options[0];
            this.vehicleSelect.innerHTML = '';
            this.vehicleSelect.appendChild(firstOption);
            
            this.vehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle;
                option.textContent = vehicle;
                this.vehicleSelect.appendChild(option);
            });
        }

        // เพิ่มตัวเลือกผู้ตรวจสอบ
        if (this.inspectorSelect) {
            // ล้างตัวเลือกเดิม (เก็บตัวแรก)
            const firstOption = this.inspectorSelect.options[0];
            this.inspectorSelect.innerHTML = '';
            this.inspectorSelect.appendChild(firstOption);
            
            this.inspectors.forEach(inspector => {
                const option = document.createElement('option');
                option.value = inspector;
                option.textContent = inspector;
                this.inspectorSelect.appendChild(option);
            });
        }
    }

    /**
     * รีเฟรช Modern Dropdowns
     */
    refreshDropdowns() {
        setTimeout(() => {
            if (this.vehicleDropdown && this.vehicleDropdown.syncFromHiddenSelect) {
                this.vehicleDropdown.syncFromHiddenSelect();
            }
            
            if (this.inspectorDropdown && this.inspectorDropdown.syncFromHiddenSelect) {
                this.inspectorDropdown.syncFromHiddenSelect();
            }
        }, 50);
    }

    /**
     * อัปเดต current filters
     */
    updateCurrentFilters() {
        this.currentFilters = {
            vehicle_name: this.vehicleSelect?.value || null,
            inspector_name: this.inspectorSelect?.value || null
        };
    }

    /**
     * ดึง current filters
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * ตั้งค่า filters
     */
    setFilters(vehicleName, inspectorName) {
        if (this.vehicleSelect) {
            this.vehicleSelect.value = vehicleName || '';
        }
        if (this.inspectorSelect) {
            this.inspectorSelect.value = inspectorName || '';
        }
        
        // อัปเดต dropdown displays
        if (this.vehicleDropdown && this.vehicleDropdown.updateDisplay) {
            this.vehicleDropdown.updateDisplay();
        }
        if (this.inspectorDropdown && this.inspectorDropdown.updateDisplay) {
            this.inspectorDropdown.updateDisplay();
        }
        
        this.updateCurrentFilters();
    }

    /**
     * ล้างค่า filters
     */
    clearFilters() {
        if (this.vehicleSelect) {
            this.vehicleSelect.value = '';
            this.vehicleSelect.selectedIndex = 0;
        }
        if (this.inspectorSelect) {
            this.inspectorSelect.value = '';
            this.inspectorSelect.selectedIndex = 0;
        }
        
        // อัปเดต dropdown displays
        if (this.vehicleDropdown && this.vehicleDropdown.updateDisplay) {
            this.vehicleDropdown.updateDisplay();
        }
        if (this.inspectorDropdown && this.inspectorDropdown.updateDisplay) {
            this.inspectorDropdown.updateDisplay();
        }
        
        this.updateCurrentFilters();
    }

    /**
     * ตั้งค่าสถานะ disabled
     */
    setDisabled(disabled) {
        [this.vehicleSelect, this.inspectorSelect].forEach(select => {
            if (select) {
                select.disabled = disabled;
            }
        });
        
        // Disable modern dropdown containers
        const dropdowns = this.container.querySelectorAll('.modern-dropdown');
        dropdowns.forEach(dropdown => {
            if (disabled) {
                dropdown.classList.add('disabled');
            } else {
                dropdown.classList.remove('disabled');
            }
        });
    }
}
