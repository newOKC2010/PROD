/**
 * Modern Dropdown - ระบบ Dropdown แบบโมเดิร์นที่เรียบง่าย
 */

class ModernDropdown {
    constructor(container) {
        this.container = container;
        this.selectContainer = container.querySelector('.modern-select-container');
        this.valueElement = container.querySelector('.modern-select-value');
        this.optionsContainer = container.querySelector('.modern-select-options');
        this.hiddenSelect = container.querySelector('.hidden-select');
        
        this.isOpen = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupOptions();
    }

    setupEventListeners() {
        // เปิด/ปิด dropdown
        this.selectContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // ปิด dropdown อื่นๆ ก่อน
            document.querySelectorAll('.modern-dropdown.active').forEach(dropdown => {
                if (dropdown !== this.container && dropdown.modernDropdownInstance) {
                    dropdown.modernDropdownInstance.close();
                }
            });
            
            this.toggle();
        });

        // เลือกตัวเลือก
        this.optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('modern-option')) {
                this.selectOption(e.target);
            }
        });

        // ปิดเมื่อคลิกข้างนอก
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });
    }

    setupOptions() {
        // ซิงค์ตัวเลือกจาก hidden select
        if (this.hiddenSelect) {
            this.syncFromHiddenSelect();
            
            // ฟังการเปลี่ยนแปลงของ hidden select
            this.hiddenSelect.addEventListener('change', () => {
                this.updateDisplay();
            });
        }
    }

    syncFromHiddenSelect() {
        if (!this.hiddenSelect) return;

        // ล้างตัวเลือกเดิม
        this.optionsContainer.innerHTML = '';

        // เพิ่มตัวเลือกใหม่
        Array.from(this.hiddenSelect.options).forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'modern-option';
            optionElement.setAttribute('data-value', option.value);
            optionElement.textContent = option.textContent;
            
            if (option.selected) {
                optionElement.classList.add('selected');
                this.valueElement.textContent = option.textContent;
            }
            
            this.optionsContainer.appendChild(optionElement);
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.selectContainer.classList.add('active');
        this.container.classList.add('active');
        this.isOpen = true;
    }

    close() {
        this.selectContainer.classList.remove('active');
        this.container.classList.remove('active');
        this.isOpen = false;
    }

    selectOption(optionElement) {
        // อัปเดตการเลือก
        this.optionsContainer.querySelectorAll('.modern-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        optionElement.classList.add('selected');

        // อัปเดตค่าที่แสดง
        this.valueElement.textContent = optionElement.textContent;

        // อัปเดต hidden select
        if (this.hiddenSelect) {
            this.hiddenSelect.value = optionElement.getAttribute('data-value');
            this.hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        this.close();
    }

    updateDisplay() {
        if (!this.hiddenSelect) return;

        const selectedOption = this.hiddenSelect.options[this.hiddenSelect.selectedIndex];
        this.valueElement.textContent = selectedOption.textContent;

        // อัปเดตการเลือกใน modern options
        this.optionsContainer.querySelectorAll('.modern-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.getAttribute('data-value') === selectedOption.value) {
                opt.classList.add('selected');
            }
        });
    }

    addOption(value, text) {
        // เพิ่มใน hidden select
        if (this.hiddenSelect) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            this.hiddenSelect.appendChild(option);
        }

        // เพิ่มใน modern dropdown
        const optionElement = document.createElement('div');
        optionElement.className = 'modern-option';
        optionElement.setAttribute('data-value', value);
        optionElement.textContent = text;
        this.optionsContainer.appendChild(optionElement);
    }

    clearOptions() {
        // ล้าง hidden select (เก็บ option แรก)
        if (this.hiddenSelect && this.hiddenSelect.options.length > 0) {
            const firstOption = this.hiddenSelect.options[0];
            this.hiddenSelect.innerHTML = '';
            this.hiddenSelect.appendChild(firstOption);
            this.hiddenSelect.selectedIndex = 0;
        }

        // ล้าง modern options (เก็บ option แรก)
        const firstOption = this.optionsContainer.querySelector('.modern-option');
        if (firstOption) {
            this.optionsContainer.innerHTML = '';
            this.optionsContainer.appendChild(firstOption);
            firstOption.classList.add('selected');
            this.valueElement.textContent = firstOption.textContent;
        }
    }
}

// ฟังก์ชันเริ่มต้น Modern Dropdowns
function initializeModernDropdowns(container = document) {
    const dropdowns = container.querySelectorAll('.modern-dropdown');
    dropdowns.forEach(dropdown => {
        if (!dropdown.modernDropdownInstance) {
            dropdown.modernDropdownInstance = new ModernDropdown(dropdown);
        }
    });
}

// ทำให้เป็น global function
window.initializeModernDropdowns = initializeModernDropdowns;
window.ModernDropdown = ModernDropdown;

// เริ่มต้นเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    initializeModernDropdowns();
});
