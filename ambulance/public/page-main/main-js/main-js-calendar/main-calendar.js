/**
 * Thai Calendar - ปฏิทินไทย พ.ศ. แบบเรียบง่าย
 */

class ThaiCalendar {
    constructor(inputElement, options = {}) {
        this.inputElement = typeof inputElement === 'string' 
            ? document.querySelector(inputElement) 
            : inputElement;
        
        if (!this.inputElement) {
            console.error('Input element not found');
            return;
        }

        this.options = {
            dateFormat: 'yyyy-mm-dd',
            yearOffset: 543,
            ...options
        };

        this.currentDate = new Date();
        this.selectedDate = null;
        
        this.thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        
        this.thaiDayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
        
        this.init();
    }

    init() {
        this.createCalendarStructure();
        this.bindEvents();
        this.setInitialDate();
    }

    createCalendarStructure() {
        // สร้าง container
        this.calendarContainer = document.createElement('div');
        this.calendarContainer.className = 'thai-calendar-container';
        
        // สร้าง input display
        this.calendarDisplay = document.createElement('div');
        this.calendarDisplay.className = 'thai-calendar-display';
        this.calendarDisplay.innerHTML = `
            <span class="calendar-icon"><i class="fas fa-calendar-alt"></i></span>
            <span class="calendar-text">เลือกวันที่</span>
            <span class="calendar-arrow"><i class="fas fa-chevron-down"></i></span>
        `;
        
        // สร้าง popup
        this.calendarPopup = document.createElement('div');
        this.calendarPopup.className = 'thai-calendar-popup';
        
        // สร้าง header
        const header = document.createElement('div');
        header.className = 'thai-calendar-header';
        header.innerHTML = `
            <button type="button" class="calendar-nav-btn" id="prevMonth">
                <i class="fas fa-chevron-left"></i>
            </button>
            <div class="calendar-title">
                <select class="month-select"></select>
                <select class="year-select"></select>
            </div>
            <button type="button" class="calendar-nav-btn" id="nextMonth">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // สร้าง days header
        const daysHeader = document.createElement('div');
        daysHeader.className = 'thai-calendar-days-header';
        this.thaiDayNames.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'day-header';
            dayElement.textContent = day;
            daysHeader.appendChild(dayElement);
        });
        
        // สร้าง days grid
        this.daysGrid = document.createElement('div');
        this.daysGrid.className = 'thai-calendar-days';
        
        // สร้าง footer
        const footer = document.createElement('div');
        footer.className = 'thai-calendar-footer';
        footer.innerHTML = `
            <button type="button" class="today-btn">วันนี้</button>
            <button type="button" class="clear-btn">ล้าง</button>
        `;
        
        // รวม elements
        this.calendarPopup.appendChild(header);
        this.calendarPopup.appendChild(daysHeader);
        this.calendarPopup.appendChild(this.daysGrid);
        this.calendarPopup.appendChild(footer);
        
        this.calendarContainer.appendChild(this.calendarDisplay);
        this.calendarContainer.appendChild(this.calendarPopup);
        
        // แทรกใน DOM
        this.inputElement.parentNode.insertBefore(this.calendarContainer, this.inputElement);
        this.inputElement.style.display = 'none';
        
        // เก็บ references
        this.monthSelect = header.querySelector('.month-select');
        this.yearSelect = header.querySelector('.year-select');
        this.prevBtn = header.querySelector('#prevMonth');
        this.nextBtn = header.querySelector('#nextMonth');
        this.todayBtn = footer.querySelector('.today-btn');
        this.clearBtn = footer.querySelector('.clear-btn');
        this.calendarText = this.calendarDisplay.querySelector('.calendar-text');
        
        this.setupSelectors();
    }

    setupSelectors() {
        // ตั้งค่า month selector
        this.thaiMonths.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            this.monthSelect.appendChild(option);
        });
        
        // ตั้งค่า year selector
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 10; year <= currentYear + 10; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = (year + this.options.yearOffset).toString();
            this.yearSelect.appendChild(option);
        }
    }

    bindEvents() {
        // เปิด/ปิด calendar
        this.calendarDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar();
        });
        
        this.nextBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar();
        });
        
        // Selectors
        this.monthSelect.addEventListener('change', () => {
            this.currentDate.setMonth(parseInt(this.monthSelect.value));
            this.updateCalendar();
        });
        
        this.yearSelect.addEventListener('change', () => {
            this.currentDate.setFullYear(parseInt(this.yearSelect.value));
            this.updateCalendar();
        });
        
        // Footer buttons
        this.todayBtn.addEventListener('click', () => {
            this.selectDate(new Date());
        });
        
        this.clearBtn.addEventListener('click', () => {
            this.clearDate();
        });
        
        // ปิดเมื่อคลิกข้างนอก
        document.addEventListener('click', (e) => {
            if (!this.calendarContainer.contains(e.target)) {
                this.close();
            }
        });
    }

    setInitialDate() {
        if (this.inputElement.value) {
            const date = this.parseDate(this.inputElement.value);
            if (date) {
                this.selectedDate = date;
                this.currentDate = new Date(date);
            }
        }
        this.updateCalendar();
        this.updateDisplay();
    }

    updateCalendar() {
        // อัปเดต selectors
        this.monthSelect.value = this.currentDate.getMonth();
        this.yearSelect.value = this.currentDate.getFullYear();
        
        // สร้าง calendar grid
        this.generateCalendar();
    }

    generateCalendar() {
        this.daysGrid.innerHTML = '';
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        
        // เพิ่มวันที่ว่างก่อนวันที่ 1
        for (let i = 0; i < startDay; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day empty';
            this.daysGrid.appendChild(dayElement);
        }
        
        // เพิ่มวันที่ในเดือน
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const dayDate = new Date(year, month, day);
            
            // เน้นวันนี้
            if (this.isSameDate(dayDate, today)) {
                dayElement.classList.add('today');
            }
            
            // เน้นวันที่เลือก
            if (this.selectedDate && this.isSameDate(dayDate, this.selectedDate)) {
                dayElement.classList.add('selected');
            }
            
            // เพิ่ม event listener
            dayElement.addEventListener('click', () => {
                this.selectDate(dayDate);
            });
            
            this.daysGrid.appendChild(dayElement);
        }
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.currentDate = new Date(date);
        
        this.updateInputValue();
        this.updateDisplay();
        this.updateCalendar();
        this.close();
    }

    clearDate() {
        this.selectedDate = null;
        this.inputElement.value = '';
        this.updateDisplay();
        this.updateCalendar();
        this.close();
        
        // Trigger change event
        this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    }

    updateInputValue() {
        if (this.selectedDate) {
            this.inputElement.value = this.formatDate(this.selectedDate);
            
            // Trigger change event
            this.inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    updateDisplay() {
        if (this.selectedDate) {
            const day = this.selectedDate.getDate();
            const month = this.thaiMonths[this.selectedDate.getMonth()];
            const year = this.selectedDate.getFullYear() + this.options.yearOffset;
            this.calendarText.textContent = `${day} ${month} ${year}`;
        } else {
            this.calendarText.textContent = 'เลือกวันที่';
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    toggle() {
        if (this.calendarPopup.classList.contains('active')) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.calendarPopup.classList.add('active');
        this.calendarDisplay.classList.add('active');
    }

    close() {
        this.calendarPopup.classList.remove('active');
        this.calendarDisplay.classList.remove('active');
    }
}

// ฟังก์ชันเริ่มต้น Thai Calendars
function initializeThaiCalendars() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.thaiCalendarInstance) {
            input.thaiCalendarInstance = new ThaiCalendar(input);
        }
    });
}

// ทำให้เป็น global
window.ThaiCalendar = ThaiCalendar;
window.initializeThaiCalendars = initializeThaiCalendars;

// เริ่มต้นเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    initializeThaiCalendars();
});