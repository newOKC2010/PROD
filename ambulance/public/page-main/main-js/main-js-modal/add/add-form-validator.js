/**
 * Add Form Validator - ตรวจสอบความถูกต้องของฟอร์ม Modal Add
 */

export class AddFormValidator {
    constructor() {
        this.errors = [];
    }

    /**
     * ตรวจสอบฟอร์มทั้งหมด
     */
    validateForm() {
        this.errors = [];

        // ตรวจสอบการเลือกรถ
        this.validateVehicleSelection();
        
        // ตรวจสอบ checklist items
        this.validateChecklistItems();
        
        return {
            valid: this.errors.length === 0,
            message: this.errors.length > 0 ? this.errors[0] : null,
            errors: this.errors
        };
    }

    /**
     * ตรวจสอบการเลือกรถ
     */
    validateVehicleSelection() {
        const vehicleSelect = document.getElementById('vehicleSelect');
        
        if (!vehicleSelect || !vehicleSelect.value) {
            this.errors.push('กรุณาเลือกรถยนต์');
            this.highlightError(vehicleSelect);
            return false;
        }
        
        this.clearError(vehicleSelect);
        return true;
    }

    /**
     * ตรวจสอบวันที่
     */
    validateDate() {
        const dateInput = document.getElementById('checkedDate');
        
        if (!dateInput || !dateInput.value) {
            this.errors.push('กรุณาเลือกวันที่ตรวจสอบ');
            this.highlightError(dateInput);
            return false;
        }
        
        // ตรวจสอบว่าวันที่ไม่เกินวันปัจจุบัน
        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // ตั้งเป็นเวลาสิ้นสุดของวัน
        
        if (selectedDate > today) {
            this.errors.push('ไม่สามารถเลือกวันที่ในอนาคตได้');
            this.highlightError(dateInput);
            return false;
        }
        
        this.clearError(dateInput);
        return true;
    }

    /**
     * ตรวจสอบ checklist items
     */
    validateChecklistItems() {
        const checklistCards = document.querySelectorAll('.checklist-item-card');
        let hasValidItems = false;
        let missingStatusItems = [];
        
        checklistCards.forEach(card => {
            const checklistId = card.dataset.checklistId;
            const title = card.querySelector('.checklist-item-title')?.textContent || `รายการ ${checklistId}`;
            
            // ตรวจสอบว่าเลือก status แล้วหรือไม่
            const statusInput = document.querySelector(`input[name="status_${checklistId}"]:checked`);
            
            if (!statusInput) {
                missingStatusItems.push(title);
                this.highlightChecklistError(card);
            } else {
                hasValidItems = true;
                this.clearChecklistError(card);
                
                // ตรวจสอบรูปภาพ (ถ้าจำเป็น)
              //  this.validatePhotos(checklistId, card);
            }
        });
        
        if (missingStatusItems.length > 0) {
            // สร้าง error message แบบแสดงเป็นรายการ
            const errorMessage = this.formatMissingStatusMessage(missingStatusItems);
            this.errors.push(errorMessage);
            return false;
        }
        
        if (!hasValidItems) {
            this.errors.push('กรุณาเลือกสถานะอย่างน้อย 1 รายการ');
            return false;
        }
        
        return true;
    }



    /**
     * ตรวจสอบไฟล์รูปภาพ
     */
    validatePhotoFiles(files, checklistId) {
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        const maxFiles = 10; // จำกัดจำนวนไฟล์
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (files.length > maxFiles) {
            this.errors.push(`สามารถอัปโหลดรูปภาพได้สูงสุด ${maxFiles} รูปต่อรายการ`);
            return false;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // ตรวจสอบประเภทไฟล์
            if (!allowedTypes.includes(file.type)) {
                this.errors.push(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ (JPG, PNG, GIF, WebP)`);
                return false;
            }
            
            // ตรวจสอบขนาดไฟล์
            if (file.size > maxFileSize) {
                this.errors.push(`ไฟล์ ${file.name} มีขนาดใหญ่เกิน 5MB`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * ตรวจสอบการซ้ำของข้อมูล (ถ้าจำเป็น)
     */
  /*  async validateDuplication() {
        const vehicleId = document.getElementById('vehicleSelect')?.value;
        const date = document.getElementById('checkedDate')?.value;
        
        if (!vehicleId || !date) {
            return true; // ให้ validation อื่นจัดการ
        }
        
        try {
            // เรียก API ตรวจสอบ (ถ้ามี endpoint สำหรับตรวจสอบ)
            // const response = await fetch(`/api/check-duplicate?vehicle_id=${vehicleId}&date=${date}`);
            // const result = await response.json();
            
            // if (result.exists) {
            //     this.errors.push('รถคันนี้ได้ทำการตรวจสอบในวันที่เลือกแล้ว');
            //     return false;
            // }
            
            return true;
        } catch (error) {
            return true; // ให้ผ่านไปถ้าเกิดข้อผิดพลาด
        }
    }*/

    /**
     * เน้นข้อผิดพลาดในฟิลด์
     */
    highlightError(element) {
        if (element) {
            element.classList.add('is-invalid');
            element.style.borderColor = '#dc3545';
        }
    }

    /**
     * ลบการเน้นข้อผิดพลาดในฟิลด์
     */
    clearError(element) {
        if (element) {
            element.classList.remove('is-invalid');
            element.style.borderColor = '';
        }
    }

    /**
     * เน้นข้อผิดพลาดใน checklist card
     */
    highlightChecklistError(card) {
        if (card) {
            card.style.borderColor = '#dc3545';
            card.style.backgroundColor = '#fff5f5';
        }
    }

    /**
     * ลบการเน้นข้อผิดพลาดใน checklist card
     */
    clearChecklistError(card) {
        if (card) {
            card.style.borderColor = '';
            card.style.backgroundColor = '';
        }
    }

    /**
     * เน้นข้อผิดพลาดในการอัปโหลดรูป
     */
    highlightPhotoError(photoInput) {
        if (photoInput) {
            const photoSection = photoInput.closest('.photo-upload-section');
            if (photoSection) {
                photoSection.style.borderColor = '#dc3545';
                photoSection.style.backgroundColor = '#fff5f5';
            }
        }
    }

    /**
     * ล้างข้อผิดพลาดทั้งหมด
     */
    clearAllErrors() {
        this.errors = [];
        
        // ล้างข้อผิดพลาดในฟิลด์ทั่วไป
        const errorElements = document.querySelectorAll('.is-invalid, [style*="border-color: rgb(220, 53, 69)"]');
        errorElements.forEach(element => {
            this.clearError(element);
        });
        
        // ล้างข้อผิดพลาดใน checklist cards
        const checklistCards = document.querySelectorAll('.checklist-item-card');
        checklistCards.forEach(card => {
            this.clearChecklistError(card);
        });
        
        // ล้างข้อผิดพลาดใน photo sections
        const photoSections = document.querySelectorAll('.photo-upload-section');
        photoSections.forEach(section => {
            section.style.borderColor = '';
            section.style.backgroundColor = '';
        });
    }

    /**
     * จัดรูปแบบข้อความแสดงรายการที่ไม่ได้เลือกสถานะ
     */
    formatMissingStatusMessage(missingItems) {
        if (missingItems.length === 0) return '';
        
        // แสดงรายการทั้งหมด
        return {
            title: `กรุณาเลือกสถานะสำหรับรายการต่อไปนี้ (${missingItems.length} รายการ):`,
            items: missingItems,
            type: 'list'
        };
    }

    /**
     * ตรวจสอบฟิลด์เฉพาะ
     */
    validateField(fieldName) {
        switch (fieldName) {
            case 'vehicle':
                return this.validateVehicleSelection();
            case 'date':
                return this.validateDate();
            case 'checklist':
                return this.validateChecklistItems();
            default:
                return true;
        }
    }

    /**
     * ดึงข้อผิดพลาดทั้งหมด
     */
    getAllErrors() {
        return this.errors;
    }

    /**
     * ตรวจสอบว่ามีข้อผิดพลาดหรือไม่
     */
    hasErrors() {
        return this.errors.length > 0;
    }

    /**
     * เพิ่มข้อผิดพลาดแบบกำหนดเอง
     */
    addCustomError(message) {
        this.errors.push(message);
    }

    /**
     * ตั้งค่า real-time validation
     */
    setupRealTimeValidation() {
        // Vehicle selection
        const vehicleSelect = document.getElementById('vehicleSelect');
        if (vehicleSelect) {
            vehicleSelect.addEventListener('change', () => {
                this.validateVehicleSelection();
            });
        }
        
        // Date input
        const dateInput = document.getElementById('checkedDate');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.validateDate();
            });
        }
        
        // Status radios
        const statusRadios = document.querySelectorAll('input[type="radio"][name^="status_"]');
        statusRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const checklistId = radio.name.replace('status_', '');
                const card = document.querySelector(`[data-checklist-id="${checklistId}"]`);
                if (card) {
                    this.clearChecklistError(card);
                }
            });
        });
    }
} 