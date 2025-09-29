/**
 * Date Search Manager - จัดการการค้นหาตามช่วงวันที่
 */

export class DateSearchManager {
    constructor(options = {}) {
        this.container = options.container;
        this.onDateChange = options.onDateChange || (() => {});
        
        // Elements
        this.startDateInput = null;
        this.endDateInput = null;
        this.startDateCalendar = null;
        this.endDateCalendar = null;
        
        // State
        this.currentDateRange = {
            start_date: null,
            end_date: null
        };
        
        this.init();
    }

    /**
     * เริ่มต้นระบบค้นหาตามวันที่
     */
    init() {
        this.createDateSearchHTML();
        this.bindElements();
        this.setupEventListeners();
        this.addQuickDateButtons();
        this.initializeCalendars();
    }

    /**
     * สร้าง HTML สำหรับค้นหาตามวันที่
     */
    createDateSearchHTML() {
        if (!this.container) return;
        
        const dateSearchHTML = `
            <div class="date-search-section">
                <div class="section-title">
                    <i class="fas fa-calendar-alt"></i>
                    ค้นหาตามช่วงวันที่
                </div>
                
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div class="date-input-group">
                            <label for="startDate">วันที่เริ่มต้น</label>
                            <div class="date-input-container">
                                <input type="date" 
                                       id="startDate" 
                                       class="date-input" 
                                       placeholder="เลือกวันที่เริ่มต้น">
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="date-input-group">
                            <label for="endDate">วันที่สิ้นสุด</label>
                            <div class="date-input-container">
                                <input type="date" 
                                       id="endDate" 
                                       class="date-input" 
                                       placeholder="เลือกวันที่สิ้นสุด">
                            </div>
                        </div>
                    </div>
                </div>
                

            </div>
        `;
        
        this.container.innerHTML = dateSearchHTML;
    }

    /**
     * ผูก elements
     */
    bindElements() {
        if (!this.container) return;
        
        this.startDateInput = this.container.querySelector('#startDate');
        this.endDateInput = this.container.querySelector('#endDate');
    }

    /**
     * ตั้งค่า Event Listeners
     */
    setupEventListeners() {
        // Date input change events
        [this.startDateInput, this.endDateInput].forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    this.validateDateInputs();
                    this.updateCurrentDateRange();
                    this.onDateChange(this.getCurrentDateRange());
                });
                
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.validateDateInputs();
                        this.updateCurrentDateRange();
                        this.onDateChange(this.getCurrentDateRange());
                    }
                });
            }
        });
    }

    /**
     * เพิ่มปุ่มเลือกช่วงวันที่แบบด่วน
     */
    addQuickDateButtons() {
        const quickButtons = this.container.querySelectorAll('[data-range]');
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const range = e.target.dataset.range;
                this.setQuickDateRange(range);
            });
        });
    }

    /**
     * เริ่มต้น Thai Calendar
     */
    initializeCalendars() {
        setTimeout(() => {
            if (typeof window.ThaiCalendar !== 'undefined') {
                // สร้าง Thai Calendar สำหรับวันที่เริ่มต้น
                if (this.startDateInput) {
                    this.startDateCalendar = new window.ThaiCalendar(this.startDateInput);
                }
                
                // สร้าง Thai Calendar สำหรับวันที่สิ้นสุด
                if (this.endDateInput) {
                    this.endDateCalendar = new window.ThaiCalendar(this.endDateInput);
                }
            } else {
                console.warn('ThaiCalendar class not found, using default date inputs');
            }
        }, 100);
    }

    /**
     * ตั้งค่าช่วงวันที่แบบด่วน
     * @param {string} range - ประเภทช่วงเวลา
     */
    setQuickDateRange(range) {
        const today = new Date();
        const endDate = this.formatDateForInput(today);
        let startDate;
        
        switch (range) {
            case 'today':
                startDate = endDate;
                break;
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                startDate = this.formatDateForInput(weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setDate(today.getDate() - 30);
                startDate = this.formatDateForInput(monthAgo);
                break;
            case 'year':
                const yearAgo = new Date(today);
                yearAgo.setFullYear(today.getFullYear() - 1);
                startDate = this.formatDateForInput(yearAgo);
                break;
            default:
                return;
        }
        
        if (this.startDateInput) this.startDateInput.value = startDate;
        if (this.endDateInput) this.endDateInput.value = endDate;
        
        // อัปเดต Thai Calendar displays ถ้ามี
        this.updateCalendarDisplays(startDate, endDate);
        
        this.validateDateInputs();
        this.updateCurrentDateRange();
        this.onDateChange(this.getCurrentDateRange());
    }

    /**
     * อัปเดต Calendar displays
     */
    updateCalendarDisplays(startDate, endDate) {
        if (this.startDateCalendar && this.startDateCalendar.selectedDate && startDate) {
            this.startDateCalendar.selectedDate = new Date(startDate + 'T00:00:00');
            if (this.startDateCalendar.updateDisplay) {
                this.startDateCalendar.updateDisplay();
            }
        }
        if (this.endDateCalendar && this.endDateCalendar.selectedDate && endDate) {
            this.endDateCalendar.selectedDate = new Date(endDate + 'T00:00:00');
            if (this.endDateCalendar.updateDisplay) {
                this.endDateCalendar.updateDisplay();
            }
        }
    }

    /**
     * ตรวจสอบความถูกต้องของ input วันที่
     */
    validateDateInputs() {
        if (!this.startDateInput || !this.endDateInput) return true;
        
        const startDate = this.startDateInput.value;
        const endDate = this.endDateInput.value;
        
        // ล้าง validation classes
        this.startDateInput.classList.remove('is-valid', 'is-invalid');
        this.endDateInput.classList.remove('is-valid', 'is-invalid');
        
        // ตรวจสอบว่า start_date ไม่เกิน end_date
        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                this.startDateInput.classList.add('is-invalid');
                this.endDateInput.classList.add('is-invalid');
                return false;
            } else {
                this.startDateInput.classList.add('is-valid');
                this.endDateInput.classList.add('is-valid');
            }
        } else if (startDate || endDate) {
            if (startDate) this.startDateInput.classList.add('is-valid');
            if (endDate) this.endDateInput.classList.add('is-valid');
        }
        
        return true;
    }

    /**
     * อัปเดต current date range
     */
    updateCurrentDateRange() {
        this.currentDateRange = {
            start_date: this.startDateInput?.value || null,
            end_date: this.endDateInput?.value || null
        };
    }

    /**
     * ดึง current date range
     */
    getCurrentDateRange() {
        return { ...this.currentDateRange };
    }

    /**
     * ตั้งค่า date range
     */
    setDateRange(startDate, endDate) {
        if (this.startDateInput) this.startDateInput.value = startDate || '';
        if (this.endDateInput) this.endDateInput.value = endDate || '';
        
        this.updateCalendarDisplays(startDate, endDate);
        this.validateDateInputs();
        this.updateCurrentDateRange();
    }

    /**
     * ล้างค่า date range
     */
    clearDateRange() {
        if (this.startDateInput) {
            this.startDateInput.value = '';
            this.startDateInput.classList.remove('is-valid', 'is-invalid');
        }
        if (this.endDateInput) {
            this.endDateInput.value = '';
            this.endDateInput.classList.remove('is-valid', 'is-invalid');
        }
        
        // ล้าง calendar displays
        if (this.startDateCalendar) {
            this.startDateCalendar.selectedDate = null;
            if (this.startDateCalendar.updateDisplay) {
                this.startDateCalendar.updateDisplay();
            }
        }
        if (this.endDateCalendar) {
            this.endDateCalendar.selectedDate = null;
            if (this.endDateCalendar.updateDisplay) {
                this.endDateCalendar.updateDisplay();
            }
        }
        
        this.updateCurrentDateRange();
    }

    /**
     * แปลง Date object เป็น string สำหรับ input[type="date"]
     */
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * แปลงวันที่เป็นรูปแบบไทย
     */
    formatThaiDate(dateString) {
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
     * ตั้งค่าสถานะ disabled
     */
    setDisabled(disabled) {
        [this.startDateInput, this.endDateInput].forEach(input => {
            if (input) {
                input.disabled = disabled;
            }
        });
        
        const quickButtons = this.container.querySelectorAll('[data-range]');
        quickButtons.forEach(button => {
            button.disabled = disabled;
        });
    }
}
