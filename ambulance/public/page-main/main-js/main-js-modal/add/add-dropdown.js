/**
 * Add Dropdown Manager - จัดการ dropdown components ใน modal add
 */

export class AddDropdown {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            placeholder: 'เลือกรายการ...',
            searchable: false,
            multiSelect: false,
            ...options
        };
        
        this.data = [];
        this.selectedValue = null;
        this.selectedValues = [];
        this.isOpen = false;
        this.searchTerm = '';
        
        this.init();
    }

    /**
     * เริ่มต้น dropdown
     */
    init() {
        this.createHTML();
        this.setupEventListeners();
    }

    /**
     * สร้าง HTML structure
     */
    createHTML() {
        const html = `
            <div class="add-dropdown-container">
                <button type="button" class="add-dropdown-button" aria-expanded="false">
                   <span class="add-dropdown-text placeholder">${this.options.placeholder}</span> 
                    <i class="fas fa-chevron-down add-dropdown-arrow"></i>
                </button>
                <div class="add-dropdown-menu">
                    ${this.options.searchable ? '<input type="text" class="add-dropdown-search" placeholder="ค้นหา...">' : ''}
                    <div class="add-dropdown-items">
                        <div class="add-dropdown-empty">ไม่มีข้อมูล</div>
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // เก็บ references
        this.button = this.container.querySelector('.add-dropdown-button');
        this.menu = this.container.querySelector('.add-dropdown-menu');
        this.text = this.container.querySelector('.add-dropdown-text');
        this.arrow = this.container.querySelector('.add-dropdown-arrow');
        this.itemsContainer = this.container.querySelector('.add-dropdown-items');
        this.searchInput = this.container.querySelector('.add-dropdown-search');
    }

    /**
     * ตั้งค่า event listeners
     */
    setupEventListeners() {
        // คลิกที่ button
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        // ค้นหา (ถ้ามี)
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderItems();
            });
        }

        // คลิกข้างนอกเพื่อปิด
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });

        // ปิดเมื่อกด ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * ตั้งค่าข้อมูล
     */
    setData(data) {
        this.data = Array.isArray(data) ? data : [];
        this.renderItems();
    }

    /**
     * เปิด/ปิด dropdown
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * เปิด dropdown
     */
    open() {
        this.isOpen = true;
        this.button.classList.add('active');
        this.button.setAttribute('aria-expanded', 'true');
        this.menu.classList.add('show');
        
        // แสดง placeholder เมื่อ active
        if (!this.selectedValue && this.selectedValues.length === 0) {
            this.text.textContent = '🚗 กรุณาเลือกรถยนต์';
            this.text.classList.add('placeholder');
        }
        
        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 100);
        }
    }

    /**
     * ปิด dropdown
     */
    close() {
        this.isOpen = false;
        this.button.classList.remove('active');
        this.button.setAttribute('aria-expanded', 'false');
        this.menu.classList.remove('show');
        
        // ซ่อน placeholder เมื่อปิด (กลับไปเป็นข้อความ)
        if (!this.selectedValue && this.selectedValues.length === 0) {
            this.text.textContent = this.options.placeholder || '🚗 เลือกรถยนต์';
            this.text.classList.add('placeholder');
        }
        
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchTerm = '';
            this.renderItems();
        }
    }

    /**
     * แสดงรายการ items
     */
    renderItems() {
        const filteredData = this.data.filter(item => {
            if (!this.searchTerm) return true;
            
            const searchText = typeof item === 'object' ? 
                (item.text || item.label || item.name || '').toLowerCase() :
                item.toString().toLowerCase();
                
            return searchText.includes(this.searchTerm);
        });

        if (filteredData.length === 0) {
            this.itemsContainer.innerHTML = '<div class="add-dropdown-empty">ไม่พบข้อมูล</div>';
            return;
        }

        const itemsHTML = filteredData.map(item => {
            const value = typeof item === 'object' ? item.value : item;
            const text = typeof item === 'object' ? (item.text || item.label || item.name) : item;
            const selected = this.options.multiSelect ? 
                this.selectedValues.includes(value) : 
                this.selectedValue === value;
            
            return `
                <div class="add-dropdown-item ${selected ? 'selected' : ''}" data-value="${value}">
                    ${text}
                </div>
            `;
        }).join('');

        this.itemsContainer.innerHTML = itemsHTML;

        // เพิ่ม event listeners สำหรับ items
        this.itemsContainer.querySelectorAll('.add-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const value = e.target.dataset.value;
                this.selectItem(value);
            });
        });
    }

    /**
     * เลือก item
     */
    selectItem(value) {
        const item = this.data.find(item => {
            const itemValue = typeof item === 'object' ? item.value : item;
            return itemValue == value;
        });

        if (!item) return;

        const itemText = typeof item === 'object' ? (item.text || item.label || item.name) : item;

        if (this.options.multiSelect) {
            const index = this.selectedValues.indexOf(value);
            if (index > -1) {
                this.selectedValues.splice(index, 1);
            } else {
                this.selectedValues.push(value);
            }
            this.updateMultiSelectText();
        } else {
            this.selectedValue = value;
            this.text.textContent = itemText;
            this.text.classList.remove('placeholder');
            this.close();
        }

        this.renderItems();
        this.triggerChange();
    }

    /**
     * อัพเดท text สำหรับ multi-select
     */
    updateMultiSelectText() {
        if (this.selectedValues.length === 0) {
            this.text.textContent = this.options.placeholder || '';
            this.text.classList.add('placeholder');
        } else if (this.selectedValues.length === 1) {
            const item = this.data.find(item => {
                const itemValue = typeof item === 'object' ? item.value : item;
                return itemValue == this.selectedValues[0];
            });
            const itemText = typeof item === 'object' ? (item.text || item.label || item.name) : item;
            this.text.textContent = itemText;
            this.text.classList.remove('placeholder');
        } else {
            this.text.textContent = `เลือกแล้ว ${this.selectedValues.length} รายการ`;
            this.text.classList.remove('placeholder');
        }
    }

    /**
     * ลบการเลือก
     */
    clearSelection() {
        this.selectedValue = null;
        this.selectedValues = [];
        this.text.textContent = this.options.placeholder || '';
        this.text.classList.add('placeholder');
        this.renderItems();
        this.triggerChange();
    }

    /**
     * เรียก event change
     */
    triggerChange() {
        const event = new CustomEvent('change', {
            detail: {
                value: this.options.multiSelect ? this.selectedValues : this.selectedValue,
                dropdown: this
            }
        });
        this.container.dispatchEvent(event);
    }

    /**
     * ได้ค่าที่เลือก
     */
    getValue() {
        return this.options.multiSelect ? this.selectedValues : this.selectedValue;
    }

    /**
     * ตั้งค่าที่เลือก
     */
    setValue(value) {
        if (this.options.multiSelect) {
            this.selectedValues = Array.isArray(value) ? value : [value];
            this.updateMultiSelectText();
        } else {
            this.selectedValue = value;
            const item = this.data.find(item => {
                const itemValue = typeof item === 'object' ? item.value : item;
                return itemValue == value;
            });
            
            if (item) {
                const itemText = typeof item === 'object' ? (item.text || item.label || item.name) : item;
                this.text.textContent = itemText;
                this.text.classList.remove('placeholder');
            }
        }
        
        this.renderItems();
        this.triggerChange();
    }

    /**
     * ทำลาย dropdown
     */
    destroy() {
        this.container.innerHTML = '';
        // ลบ event listeners ถ้าจำเป็น
    }
}
