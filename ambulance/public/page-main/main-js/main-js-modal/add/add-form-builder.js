/**
 * Add Form Builder - สร้าง HTML Form สำหรับ Modal Add
 */

export class AddFormBuilder {
    constructor() {
        this.photoFiles = new Map(); // เก็บไฟล์รูปภาพแต่ละ checklist
    }

    /**
     * สร้าง Form HTML
     */
    createForm(vehiclesData, checklistsData) {
        const formHTML = `
            <form id="addChecklistForm" enctype="multipart/form-data">
                ${this.createVehicleSection(vehiclesData)}
                ${this.createChecklistSection(checklistsData)}
                ${this.createFormActions()}
            </form>
        `;
        
        return formHTML;
    }

    /**
     * สร้างส่วนเลือกรถ
     */
    createVehicleSection(vehiclesData) {
        return `
            <div class="add-form-section">
                <h6><i class="fas fa-car"></i>เลือกรถยนต์</h6>
                <div class="vehicle-dropdown-container" id="vehicleDropdownContainer">
                    <!-- Dropdown จะถูกสร้างโดย JavaScript -->
                </div>
                <input type="hidden" id="vehicleSelect" name="vehicle_id" required>
            </div>
        `;
    }



    /**
     * สร้างส่วน Checklist Items
     */
    createChecklistSection(checklistsData) {
        const checklistItems = checklistsData.map((checklist, index) => 
            this.createChecklistItem(checklist, index + 1)
        ).join('');

        return `
            <div class="add-form-section">
                <h6><i class="fas fa-clipboard-check"></i>รายการตรวจสอบ</h6>
                <div class="checklist-items-container">
                    ${checklistItems}
                </div>
            </div>
        `;
    }

    /**
     * สร้าง Checklist Item
     */
    createChecklistItem(checklist, itemNumber) {
        return `
            <div class="checklist-item-card" data-checklist-id="${checklist.id}">
                <div class="checklist-item-header">
                    <h6 class="checklist-item-title">
                        <span class="checklist-item-number">${itemNumber}.</span>
                        ${checklist.name}
                    </h6>
                </div>
                <div class="checklist-item-body">
                    ${this.createStatusRadio(checklist.id)}
                    ${this.createNoteTextarea(checklist.id)}
                    ${this.createPhotoUpload(checklist.id)}
                </div>
            </div>
        `;
    }

    /**
     * สร้าง Status Radio Buttons
     */
    createStatusRadio(checklistId) {
        return `
            <div class="status-radio-group">
                <div class="status-radio-option" data-checklist-id="${checklistId}" data-status="true">
                    <input type="radio" id="pass_${checklistId}" name="status_${checklistId}" value="true" required>
                    <label for="pass_${checklistId}">
                        <i class="fas fa-check-circle me-1"></i>ผ่าน
                    </label>
                </div>
                <div class="status-radio-option" data-checklist-id="${checklistId}" data-status="false">
                    <input type="radio" id="fail_${checklistId}" name="status_${checklistId}" value="false" required>
                    <label for="fail_${checklistId}">
                        <i class="fas fa-times-circle me-1"></i>ไม่ผ่าน
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * สร้าง Note Textarea
     */
    createNoteTextarea(checklistId) {
        return `
            <div class="mb-3">
                <label for="note_${checklistId}" class="form-label">
                    <i class="fas fa-sticky-note me-1"></i>หมายเหตุ
                </label>
                <textarea class="note-textarea" id="note_${checklistId}" name="note_${checklistId}" 
                          rows="3" placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"></textarea>
            </div>
        `;
    }

    /**
     * สร้างส่วน Upload รูปภาพ
     */
    createPhotoUpload(checklistId) {
        return `
            <div class="photo-upload-section">
                <label for="photos_${checklistId}" class="photo-upload-label">
                    <i class="fas fa-camera"></i>
                    เพิ่มรูปภาพ (สามารถเลือกหลายรูป)
                </label>
                <input type="file" class="photo-upload-input" id="photos_${checklistId}" 
                       name="photos_${checklistId}" accept="image/*" multiple 
                       data-checklist-id="${checklistId}">
                <div class="photo-preview-container" id="preview_${checklistId}">
                    <!-- Photo previews จะถูกแสดงที่นี่ -->
                </div>
            </div>
        `;
    }

    /**
     * สร้างปุ่มดำเนินการ
     */
    createFormActions() {
        return `
            <div class="form-actions">
                <button type="button" class="btn-cancel" id="cancelAddForm">
                    <i class="fas fa-trash-alt"></i>
                    <span>ยกเลิก</span>
                </button>
                <button type="submit" class="btn-submit" id="submitAddForm">
                    <i class="fas fa-save me-1"></i>บันทึกการตรวจสอบ
                </button>
            </div>
        `;
    }

    /**
     * อัปเดต Photo Preview
     */
    updatePhotoPreview(files, previewContainer, checklistId) {
        // แปลง checklistId เป็น string เสมอ
        const checklistKey = String(checklistId);
        
        // เก็บไฟล์เดิมที่มีอยู่แล้ว
        const existingFiles = this.photoFiles.get(checklistKey) || [];
        
        // เพิ่มไฟล์ใหม่เข้าไปในไฟล์เดิม
        const newFiles = Array.from(files);
        const allFiles = [...existingFiles, ...newFiles];
        
        // เก็บไฟล์ทั้งหมดใน Map
        this.photoFiles.set(checklistKey, allFiles);
        
        // ล้าง preview เดิม
        previewContainer.innerHTML = '';
        
        // สร้าง preview ใหม่สำหรับไฟล์ทั้งหมด
        allFiles.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = this.createPhotoPreviewItem(e.target.result, index, checklistId);
                    previewContainer.insertAdjacentHTML('beforeend', previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // ล้าง input file เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้
        const fileInput = document.getElementById(`photos_${checklistId}`);
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * สร้าง Photo Preview Item
     */
    createPhotoPreviewItem(imageSrc, index, checklistId) {
        return `
            <div class="photo-preview-item" data-index="${index}" data-checklist-id="${checklistId}">
                <img src="${imageSrc}" alt="Preview" class="photo-preview-img">
                <button type="button" class="photo-preview-remove" 
                        onclick="window.removePhotoPreview(${checklistId}, ${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    /**
     * ลบ Photo Preview
     */
    removePhotoPreview(checklistId, index) {
        // แปลง checklistId เป็น string และ index เป็น number
        const checklistKey = String(checklistId);
        const indexToRemove = parseInt(index, 10);
        
        // ดึงไฟล์เดิมจาก Map
        const currentFiles = this.photoFiles.get(checklistKey) || [];
        
        // ตรวจสอบว่า index ถูกต้อง
        if (indexToRemove < 0 || indexToRemove >= currentFiles.length) {
            return;
        }
        
        // สร้าง array ใหม่โดยไม่รวมไฟล์ที่ต้องการลบ
        const updatedFiles = currentFiles.filter((file, fileIndex) => fileIndex !== indexToRemove);
        
        // อัปเดตไฟล์ใน Map
        this.photoFiles.set(checklistKey, updatedFiles);
        
        // รีเฟรช preview container
        const previewContainer = document.getElementById(`preview_${checklistId}`);
        if (!previewContainer) {
            return;
        }
        
        // ล้าง preview เดิม
        previewContainer.innerHTML = '';
        
        // ถ้าไม่มีไฟล์เหลือ ให้แสดงว่าง
        if (updatedFiles.length === 0) {
            return;
        }
        
        // สร้าง preview ใหม่สำหรับไฟล์ที่เหลือ
        updatedFiles.forEach((file, newIndex) => {
            if (file && file.type && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = this.createPhotoPreviewItem(e.target.result, newIndex, checklistId);
                    previewContainer.insertAdjacentHTML('beforeend', previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * อัปเดตการเลือก Status
     */
    updateStatusSelection(checklistId, status) {
        const radioOptions = document.querySelectorAll(`[data-checklist-id="${checklistId}"].status-radio-option`);
        
        radioOptions.forEach(option => {
            option.classList.remove('selected-pass', 'selected-fail');
            
            if (option.dataset.status === status) {
                if (status === 'true') {
                    option.classList.add('selected-pass');
                } else {
                    option.classList.add('selected-fail');
                }
                
                // เลือก radio button
                const radio = option.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
            }
        });
    }

    /**
     * ฟอร์แมตชื่อรถ
     */
    formatVehicleName(vehicle) {
        const parts = [];
        
        if (vehicle.brand) parts.push(vehicle.brand);
        if (vehicle.license_plate) parts.push(vehicle.license_plate);
        
        return parts.join(' ') || `รถ ID: ${vehicle.id}`;
    }

    /**
     * รีเซ็ตฟอร์ม
     */
    resetForm() {
        this.photoFiles.clear();
        
        const form = document.getElementById('addChecklistForm');
        if (form) {
            form.reset();
        }
        
        // ล้าง status selections
        const radioOptions = document.querySelectorAll('.status-radio-option');
        radioOptions.forEach(option => {
            option.classList.remove('selected-pass', 'selected-fail');
        });
        
        // ล้าง photo previews
        const previewContainers = document.querySelectorAll('.photo-preview-container');
        previewContainers.forEach(container => {
            container.innerHTML = '';
        });
        
        // ล้าง file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.value = '';
        });
    }

    /**
     * ดึงข้อมูลรูปภาพทั้งหมด
     */
    getAllPhotoFiles() {
        return this.photoFiles;
    }

    /**
     * ตรวจสอบว่ามีรูปภาพหรือไม่
     */
    hasPhotos(checklistId) {
        const checklistKey = String(checklistId);
        const files = this.photoFiles.get(checklistKey);
        return files && files.length > 0;
    }

    /**
     * นับจำนวนรูปภาพ
     */
    getPhotoCount(checklistId) {
        const checklistKey = String(checklistId);
        const files = this.photoFiles.get(checklistKey);
        return files ? files.length : 0;
    }
}

// เพิ่มฟังก์ชันลบรูปใน global scope
window.removePhotoPreview = function(checklistId, index) {
    // ตรวจสอบว่ามี currentFormBuilder หรือไม่
    if (!window.currentFormBuilder) {
        return;
    }
    
    // เรียกใช้ฟังก์ชันจาก FormBuilder
    window.currentFormBuilder.removePhotoPreview(checklistId, index);
}; 