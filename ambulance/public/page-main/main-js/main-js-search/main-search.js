/**
 * Main Search & Filter System - จัดการการค้นหาตามช่วงวันที่และกรองตามชื่อรถและผู้ตรวจสอบ
 * ใช้ Modern Dropdown และ Thai Calendar
 */

import { API_ENDPOINTS, createAuthHeaders, removeToken, getStoredToken } from '/global-api.js';
import { showToast, checkTokenValid, redirectToLogin } from '/global-auth-status.js';
import { DateSearchManager } from '/main-search-date.js';
import { FilterManager } from '/main-search-filter.js';

export class SearchFilterManager {
    constructor(options = {}) {
        this.tableManager = options.tableManager;
        this.searchContainer = options.searchContainer;
        
        // Sub-managers
        this.dateSearchManager = null;
        this.filterManager = null;
        
        // Elements - Actions
        this.searchBtn = null;
        this.clearBtn = null;
        this.searchLoading = null;
        this.searchResultsInfo = null;
        this.searchResultsText = null;
        this.searchError = null;
        this.searchErrorText = null;
        
        // State
        this.isSearching = false;
        this.currentSearchParams = {
            start_date: null,
            end_date: null,
            vehicle_name: null,
            inspector_name: null
        };
        
        this.init();
    }

    /**
     * เริ่มต้นระบบค้นหาและกรอง
     */
    async init() {
        try {
            this.createSearchFilterHTML();
            this.bindElements();
            this.setupEventListeners();
            
            // รอให้ DOM พร้อม
            await this.waitForDOM();
            
            // เริ่มต้น sub-managers
            this.initializeSubManagers();
            
            // โหลดข้อมูลสำหรับ filter
            await this.loadFilterData();
            
        } catch (error) {
            console.error('Error initializing SearchFilterManager:', error);
        }
    }

    /**
     * รอให้ DOM พร้อม
     */
    waitForDOM() {
        return new Promise(resolve => {
            setTimeout(resolve, 200);
        });
    }
    
    /**
     * สร้าง HTML สำหรับระบบค้นหาและกรอง
     */
    createSearchFilterHTML() {
        if (!this.searchContainer) return;
        
        const searchFilterHTML = `
            <div class="search-filter-container">
                <div class="search-filter-header">
                    <h5>
                        <i class="fas fa-search"></i>
                        ค้นหาและกรองข้อมูล
                    </h5>
                </div>
                
                <div class="search-filter-form">
                    <!-- Date Search Section -->
                    <div id="dateSearchContainer"></div>
                    
                    <!-- Filter Section -->
                    <div id="filterContainer"></div>
                    
                    <!-- Action Buttons -->
                    <div class="search-actions">
                        <button type="button" id="searchBtn" class="btn-search">
                            <i class="fas fa-search"></i>
                            ค้นหา
                        </button>
                        <button type="button" id="clearBtn" class="btn-clear">
                            <i class="fas fa-times"></i>
                            ล้างค่า
                        </button>
                    </div>
                    
                    <div id="searchLoading" class="search-loading">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">กำลังค้นหา...</span>
                        </div>
                        <div class="mt-2">กำลังค้นหาข้อมูล...</div>
                    </div>
                    
                    <div id="searchResultsInfo" class="search-results-info">
                        <i class="fas fa-info-circle"></i>
                        <span id="searchResultsText"></span>
                    </div>
                    
                    <div id="searchError" class="search-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span id="searchErrorText"></span>
                    </div>
                </div>
            </div>
        `;
        
        this.searchContainer.innerHTML = searchFilterHTML;
    }

    /**
     * ผูก elements
     */
    bindElements() {
        if (!this.searchContainer) return;
        
        // Action buttons
        this.searchBtn = this.searchContainer.querySelector('#searchBtn');
        this.clearBtn = this.searchContainer.querySelector('#clearBtn');
        
        // Status elements
        this.searchLoading = this.searchContainer.querySelector('#searchLoading');
        this.searchResultsInfo = this.searchContainer.querySelector('#searchResultsInfo');
        this.searchResultsText = this.searchContainer.querySelector('#searchResultsText');
        this.searchError = this.searchContainer.querySelector('#searchError');
        this.searchErrorText = this.searchContainer.querySelector('#searchErrorText');
    }

    /**
     * ตั้งค่า Event Listeners
     */
    setupEventListeners() {
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }
        
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    /**
     * เริ่มต้น Sub-managers
     */
    initializeSubManagers() {
        // เริ่มต้น Date Search Manager
        const dateSearchContainer = this.searchContainer.querySelector('#dateSearchContainer');
        if (dateSearchContainer) {
            this.dateSearchManager = new DateSearchManager({
                container: dateSearchContainer,
                onDateChange: (dateRange) => {
                    this.updateSearchParams(dateRange, null);
                }
            });
        }

        // เริ่มต้น Filter Manager
        const filterContainer = this.searchContainer.querySelector('#filterContainer');
        if (filterContainer) {
            this.filterManager = new FilterManager({
                container: filterContainer,
                onFilterChange: (filters) => {
                    this.updateSearchParams(null, filters);
                }
            });
        }
    }

    /**
     * อัปเดต search parameters
     */
    updateSearchParams(dateRange, filters) {
        if (dateRange) {
            this.currentSearchParams.start_date = dateRange.start_date;
            this.currentSearchParams.end_date = dateRange.end_date;
        }
        
        if (filters) {
            this.currentSearchParams.vehicle_name = filters.vehicle_name;
            this.currentSearchParams.inspector_name = filters.inspector_name;
        }
    }

    /**
     * โหลดข้อมูลสำหรับตัวกรอง
     */
    async loadFilterData() {
        // ตรวจสอบ token ก่อนโหลดข้อมูล
        const token = getStoredToken();
        const tokenValidation = await checkTokenValid(token);
        if (!tokenValidation.valid) {
            console.warn('Token invalid, cannot load filter data');
            return;
        }

        try {
            // โหลดข้อมูลทั้งหมดเพื่อดึงรายการ unique
            const response = await fetch(API_ENDPOINTS.MAIN_CHECK.VIEW, {
                method: 'GET',
                headers: createAuthHeaders(token)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data && this.filterManager) {
                    this.filterManager.setFilterData(result.data);
                }
            }
        } catch (error) {
            console.error('Error loading filter data:', error);
        }
    }

    /**
     * ทำการค้นหาและกรอง
     */
    async performSearch() {
        if (this.isSearching) return;
        
        // ตรวจสอบ token ก่อนค้นหา
        const token = getStoredToken();
        const tokenValidation = await checkTokenValid(token);
        if (!tokenValidation.valid) {
            alert(tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่');
            removeToken();
            redirectToLogin();
            return;
        }

        // ตรวจสอบ validation วันที่
        if (this.dateSearchManager && !this.dateSearchManager.validateDateInputs()) {
            this.showError('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
            return;
        }
        
        // ดึงข้อมูลจาก sub-managers
        const dateRange = this.dateSearchManager ? this.dateSearchManager.getCurrentDateRange() : {};
        const filters = this.filterManager ? this.filterManager.getCurrentFilters() : {};
        
        const startDate = dateRange.start_date;
        const endDate = dateRange.end_date;
        const selectedVehicle = filters.vehicle_name;
        const selectedInspector = filters.inspector_name;
        
        this.setSearching(true);
        this.hideError();
        this.hideResultsInfo();
        
        try {
            // สร้าง URL parameters สำหรับ date range
            const searchParams = new URLSearchParams();
            if (startDate) searchParams.append('start_date', startDate);
            if (endDate) searchParams.append('end_date', endDate);
            
            const url = searchParams.toString() 
                ? `${API_ENDPOINTS.MAIN_CHECK.VIEW}?${searchParams.toString()}`
                : API_ENDPOINTS.MAIN_CHECK.VIEW;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: createAuthHeaders(token)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    let filteredData = result.data;
                    
                    // กรองข้อมูลเพิ่มเติมใน client-side
                    if (selectedVehicle) {
                        filteredData = filteredData.filter(item => 
                            item.vehicle_name === selectedVehicle
                        );
                    }
                    
                    if (selectedInspector) {
                        filteredData = filteredData.filter(item => 
                            item.username === selectedInspector
                        );
                    }
                    
                    // อัปเดตข้อมูลใน table manager
                    if (this.tableManager) {
                        this.tableManager.checklistData = result.data;
                        this.tableManager.filteredData = filteredData;
                        // รีเซ็ต pagination กลับไปหน้าแรก
                        this.tableManager.resetToFirstPage();
                        this.tableManager.updateTable();
                    }
                    
                    // เก็บ search parameters
                    this.currentSearchParams = { 
                        start_date: startDate, 
                        end_date: endDate,
                        vehicle_name: selectedVehicle,
                        inspector_name: selectedInspector
                    };
                    
                    // แสดงผลลัพธ์
                    this.showSearchResults(filteredData.length, startDate, endDate, selectedVehicle, selectedInspector);
                    showToast('ค้นหาข้อมูลสำเร็จ', 'success');
                    
                } else {
                    this.showError(result.message || 'ไม่สามารถค้นหาข้อมูลได้');
                }
            } else {
                this.showError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError('เกิดข้อผิดพลาดในการค้นหา');
        } finally {
            this.setSearching(false);
        }
    }

    /**
     * ล้างการค้นหาและโหลดข้อมูลทั้งหมด
     */
    async clearSearch() {
        // ตรวจสอบ token ก่อนล้างค่า
        const token = getStoredToken();
        const tokenValidation = await checkTokenValid(token);
        if (!tokenValidation.valid) {
            alert(tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่');
            removeToken();
            redirectToLogin();
            return;
        }
        
        // ล้างค่าใน sub-managers
        if (this.dateSearchManager) {
            this.dateSearchManager.clearDateRange();
        }
        
        if (this.filterManager) {
            this.filterManager.clearFilters();
        }
        
        // ล้าง search parameters
        this.currentSearchParams = { 
            start_date: null, 
            end_date: null,
            vehicle_name: null,
            inspector_name: null
        };
        
        // ซ่อน messages
        this.hideError();
        this.hideResultsInfo();
        
        // โหลดข้อมูลทั้งหมดใหม่
        if (this.tableManager) {
            // รีเซ็ต pagination กลับไปหน้าแรก
            this.tableManager.resetToFirstPage();
            await this.tableManager.loadChecklistData();
        }
        
        showToast('ล้างการค้นหาแล้ว', 'info');
    }

    /**
     * แสดงผลลัพธ์การค้นหา
     * @param {number} count - จำนวนผลลัพธ์
     * @param {string} startDate - วันที่เริ่มต้น
     * @param {string} endDate - วันที่สิ้นสุด
     * @param {string} selectedVehicle - รถที่เลือก
     * @param {string} selectedInspector - ผู้ตรวจสอบที่เลือก
     */
    showSearchResults(count, startDate, endDate, selectedVehicle, selectedInspector) {
        if (!this.searchResultsInfo || !this.searchResultsText) return;
        
        let message = `พบข้อมูล ${count} รายการ`;
        
        const conditions = [];
        
        // เงื่อนไขวันที่
        if (startDate && endDate) {
            const start = this.formatThaiDate(startDate);
            const end = this.formatThaiDate(endDate);
            conditions.push(`ช่วง ${start} ถึง ${end}`);
        } else if (startDate) {
            const start = this.formatThaiDate(startDate);
            conditions.push(`ตั้งแต่ ${start}`);
        } else if (endDate) {
            const end = this.formatThaiDate(endDate);
            conditions.push(`ถึง ${end}`);
        }
        
        // เงื่อนไขการกรอง
        if (selectedVehicle) {
            conditions.push(`รถ: ${selectedVehicle}`);
        }
        if (selectedInspector) {
            conditions.push(`ผู้ตรวจสอบ: ${selectedInspector}`);
        }
        
        if (conditions.length > 0) {
            message += ` (${conditions.join(', ')})`;
        }
        
        this.searchResultsText.textContent = message;
        this.searchResultsInfo.classList.add('show');
    }

    /**
     * แสดงข้อผิดพลาด
     * @param {string} message - ข้อความ error
     */
    showError(message) {
        if (this.searchError && this.searchErrorText) {
            this.searchErrorText.textContent = message;
            this.searchError.classList.add('show');
        }
    }

    /**
     * ซ่อนข้อผิดพลาด
     */
    hideError() {
        if (this.searchError) {
            this.searchError.classList.remove('show');
        }
    }

    /**
     * ซ่อนข้อมูลผลลัพธ์
     */
    hideResultsInfo() {
        if (this.searchResultsInfo) {
            this.searchResultsInfo.classList.remove('show');
        }
    }

    /**
     * ตั้งค่าสถานะการค้นหา
     * @param {boolean} isSearching - สถานะการค้นหา
     */
    setSearching(isSearching) {
        this.isSearching = isSearching;
        
        if (this.searchBtn) {
            this.searchBtn.disabled = isSearching;
            if (isSearching) {
                this.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังค้นหา...';
            } else {
                this.searchBtn.innerHTML = '<i class="fas fa-search"></i> ค้นหา';
            }
        }
        
        if (this.clearBtn) {
            this.clearBtn.disabled = isSearching;
        }
        
        // Disable sub-managers during search
        if (this.dateSearchManager) {
            this.dateSearchManager.setDisabled(isSearching);
        }
        
        if (this.filterManager) {
            this.filterManager.setDisabled(isSearching);
        }
        
        if (this.searchLoading) {
            if (isSearching) {
                this.searchLoading.classList.add('show');
            } else {
                this.searchLoading.classList.remove('show');
            }
        }
    }

    /**
     * แปลงวันที่เป็นรูปแบบไทย
     * @param {string} dateString - วันที่ในรูปแบบ YYYY-MM-DD
     * @returns {string} วันที่ในรูปแบบไทย
     */
    formatThaiDate(dateString) {
        if (this.dateSearchManager) {
            return this.dateSearchManager.formatThaiDate(dateString);
        }
        
        if (!dateString) return 'ไม่ระบุ';
        
        const date = new Date(dateString + 'T00:00:00');
        if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
        
        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543;
        
        return `${day} ${month} ${year}`;
    }

    /**
     * ดึง search parameters ปัจจุบัน
     * @returns {Object} search parameters
     */
    getCurrentSearchParams() {
        return { ...this.currentSearchParams };
    }

    /**
     * ตรวจสอบว่ากำลังค้นหาอยู่หรือไม่
     * @returns {boolean} สถานะการค้นหา
     */
    isCurrentlySearching() {
        return this.isSearching;
    }

    /**
     * รีเฟรชการค้นหาด้วย parameters เดิม
     */
    async refreshSearch() {
        const { start_date, end_date, vehicle_name, inspector_name } = this.currentSearchParams;
        
        if (start_date || end_date || vehicle_name || inspector_name) {
            // ตั้งค่าใน sub-managers
            if (this.dateSearchManager) {
                this.dateSearchManager.setDateRange(start_date, end_date);
            }
            
            if (this.filterManager) {
                this.filterManager.setFilters(vehicle_name, inspector_name);
            }
            
            await this.performSearch();
        }
    }

    /**
     * รีเฟรชรายการตัวเลือก (เมื่อมีข้อมูลใหม่)
     */
    async refreshFilterOptions() {
        await this.loadFilterData();
    }
}