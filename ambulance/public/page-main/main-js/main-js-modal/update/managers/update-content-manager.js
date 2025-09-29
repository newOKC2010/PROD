/**
 * Update Content Manager - จัดการ data และ business logic
 * Refactored version - แยก HTML building ออกไป form builder
 */

import { UpdatePhotoManager } from './update-photo-manager.js';
import { UpdateFormBuilder } from './update-form-builder.js';

export class UpdateContentManager {
    constructor() {
        this.photoManager = new UpdatePhotoManager();
        this.formBuilder = new UpdateFormBuilder(this.photoManager);
        this.newPhotoFiles = new Map(); // เก็บไฟล์รูปภาพใหม่แต่ละ checklist
        this.deletedPhotos = new Set(); // เก็บ photo id ที่ถูกลบ
        this.onUIChanged = null; // callback สำหรับเมื่อ UI เปลี่ยน
    }

    /**
     * ตั้งค่า callback สำหรับเมื่อ UI เปลี่ยน
     */
    setUIChangeCallback(callback) {
        this.onUIChanged = callback;
    }

    /**
     * สร้าง Update Form HTML - ใช้ form builder
     */
    async createUpdateForm(checklistData, rolePermission) {
        return await this.formBuilder.buildUpdateForm(checklistData, rolePermission);
    }



    /**
     * จัดการ Photo Upload (เหมือน add)
     */
    handlePhotoUpload(input, checklistId) {
        const files = Array.from(input.files);
        const previewContainer = document.getElementById(`preview_${checklistId}`);
        
        if (!previewContainer || files.length === 0) return;

        this.updatePhotoPreview(files, previewContainer, checklistId);
    }

    /**
     * อัปเดต Photo Preview - จัดการไฟล์และสร้าง preview
     */
    updatePhotoPreview(files, previewContainer, checklistId) {
        const checklistKey = String(checklistId);
        
        // รวมไฟล์เดิมและใหม่
        const existingFiles = this.newPhotoFiles.get(checklistKey) || [];
        const allFiles = [...existingFiles, ...Array.from(files)];
        
        // เก็บไฟล์ทั้งหมดใน Map
        this.newPhotoFiles.set(checklistKey, allFiles);
        
        // สร้าง preview ใหม่
        this.renderPhotoPreview(previewContainer, allFiles, checklistId);
        
        // ล้าง input file
        this.clearFileInput(checklistId);
    }

    /**
     * สร้าง Photo Preview Items
     */
    renderPhotoPreview(container, files, checklistId) {
        container.innerHTML = '';
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = this.formBuilder.buildPhotoPreviewItem(e.target.result, index, checklistId);
                    container.insertAdjacentHTML('beforeend', previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * ล้าง file input
     */
    clearFileInput(checklistId) {
        const fileInput = document.getElementById(`photos_${checklistId}`);
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * ลบ Photo Preview (เหมือน add)
     */
    removePhotoPreview(checklistId, index) {
        const checklistKey = String(checklistId);
        
        // ดึงไฟล์เดิมจาก Map
        const currentFiles = this.newPhotoFiles.get(checklistKey) || [];
        
        // ตรวจสอบว่า index ถูกต้องหรือไม่
        if (index < 0 || index >= currentFiles.length) {
            return;
        }
        
        // สร้าง array ใหม่โดยไม่รวมไฟล์ที่ต้องการลบ
        const updatedFiles = currentFiles.filter((_, fileIndex) => fileIndex !== index);
        
        // อัปเดตไฟล์ใน Map ด้วย array ใหม่
        this.newPhotoFiles.set(checklistKey, updatedFiles);
        
        // รีเฟรช preview container แบบ safe
        this.refreshPreviewContainer(checklistId, updatedFiles);
    }

    /**
     * รีเฟรช Preview Container แบบปลอดภัย
     */
    refreshPreviewContainer(checklistId, files) {
        const previewContainer = document.getElementById(`preview_${checklistId}`);
        if (!previewContainer) return;

        // ลบ event listeners เก่า
        this.cleanupPreviewButtons(previewContainer);
        
        // สร้าง preview ใหม่
        if (files.length > 0) {
            this.renderPhotoPreview(previewContainer, files, checklistId);
        } else {
            previewContainer.innerHTML = '';
        }
    }

    /**
     * ล้าง event listeners ของปุ่ม preview
     */
    cleanupPreviewButtons(container) {
        const oldButtons = container.querySelectorAll('.photo-preview-remove');
        oldButtons.forEach(btn => {
            btn.removeEventListener('click', btn._clickHandler);
            btn.disabled = true;
        });
    }

    /**
     * จัดการการลบรูปภาพเดิม - เปลี่ยน UI เป็นสถานะ "ถูกลบ"
     */
    handlePhotoDelete(photoId) {
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (!photoElement) return;

        // เพิ่มใน deleted set
        this.deletedPhotos.add(parseInt(photoId));
        
        // เปลี่ยน UI - เบลอและเพิ่มปุ่ม undo
        photoElement.style.opacity = '0.5';
        photoElement.style.filter = 'blur(2px)';
        
        const deleteBtn = photoElement.querySelector('.delete-photo-btn');
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-undo"></i>';
            deleteBtn.title = 'ยกเลิกการลบ';
            deleteBtn.classList.remove('btn-danger');
            deleteBtn.classList.add('btn-warning');
        }
        
        // เรียก callback เมื่อ UI เปลี่ยน
        if (this.onUIChanged) {
            this.onUIChanged();
        }
    }

    /**
     * ยกเลิกการลบรูป - คืนค่า UI เป็นสถานะปกติ
     */
    undoPhotoDelete(photoId) {
        const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
        if (!photoElement) return;

        // ลบออกจาก deleted set
        this.deletedPhotos.delete(parseInt(photoId));
        
        // คืนค่า UI เดิม
        photoElement.style.opacity = '1';
        photoElement.style.filter = 'none';
        
        const deleteBtn = photoElement.querySelector('.delete-photo-btn');
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.title = 'ลบรูปภาพ';
            deleteBtn.classList.remove('btn-warning');
            deleteBtn.classList.add('btn-danger');
        }
        
        // เรียก callback เมื่อ UI เปลี่ยน
        if (this.onUIChanged) {
            this.onUIChanged();
        }
    }



    /**
     * ตรวจสอบการเปลี่ยนแปลง - เปรียบเทียบข้อมูลเดิมกับปัจจุบัน
     */
    hasFormChanges(originalData) {
        return this.hasStatusChanges(originalData) || 
               this.hasNoteChanges(originalData) || 
               this.hasPhotoChanges();
    }

    /**
     * ตรวจสอบการเปลี่ยนแปลง status
     */
    hasStatusChanges(originalData) {
        const statusInputs = document.querySelectorAll('.status-radio-input:checked');
        for (const input of statusInputs) {
            const checklistId = input.name.replace('status_', '');
            const originalItem = originalData.checklist_items.items.find(
                item => item.checklist_id === checklistId
            );
            
            if (originalItem && (input.value === 'true') !== originalItem.status) {
                return true;
            }
        }
        return false;
    }

    /**
     * ตรวจสอบการเปลี่ยนแปลง notes
     */
    hasNoteChanges(originalData) {
        const noteInputs = document.querySelectorAll('.note-textarea');
        for (const input of noteInputs) {
            const checklistId = input.name.replace('note_', '');
            const originalItem = originalData.checklist_items.items.find(
                item => item.checklist_id === checklistId
            );
            
            const currentNote = input.value.trim();
            const originalNote = originalItem?.note || '';
            
            if (currentNote !== originalNote) {
                return true;
            }
        }
        return false;
    }

    /**
     * ตรวจสอบการเปลี่ยนแปลงรูปภาพ
     */
    hasPhotoChanges() {
        // ตรวจสอบรูปภาพใหม่
        if (this.newPhotoFiles.size > 0) {
            for (const files of this.newPhotoFiles.values()) {
                if (files.length > 0) return true;
            }
        }

        // ตรวจสอบรูปภาพที่ถูกลบ
        return this.deletedPhotos.size > 0;
    }

    /**
     * ดึงไฟล์รูปภาพใหม่ทั้งหมด - ส่งคืน Map ของ checklist_id และไฟล์
     */
    getAllNewPhotoFiles() {
        return this.newPhotoFiles;
    }

    /**
     * ดึงรายการรูปที่ต้องลบ - ส่งคืน Array ของ photo IDs
     */
    getDeletedPhotos() {
        return Array.from(this.deletedPhotos);
    }

    /**
     * รีเซ็ตข้อมูล - ล้างข้อมูลและ DOM elements
     */
    reset() {
        // ล้าง data structures
        this.newPhotoFiles.clear();
        this.deletedPhotos.clear();
        
        // ล้าง DOM elements
        this.resetPreviewContainers();
        this.resetPhotoInputs();
    }

    /**
     * รีเซ็ต preview containers
     */
    resetPreviewContainers() {
        const previewContainers = document.querySelectorAll('[id^="preview_"]');
        previewContainers.forEach(container => {
            if (container) {
                this.cleanupPreviewButtons(container);
                container.innerHTML = '';
            }
        });
    }

    /**
     * รีเซ็ต photo inputs
     */
    resetPhotoInputs() {
        const photoInputs = document.querySelectorAll('.update-photo-input');
        photoInputs.forEach(input => {
            if (input) {
                input.value = '';
                // สร้าง FileList ว่าง
                const dt = new DataTransfer();
                input.files = dt.files;
            }
        });
    }
}
