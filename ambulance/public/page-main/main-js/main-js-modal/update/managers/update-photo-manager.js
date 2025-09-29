/**
 * Update Photo Manager - จัดการรูปภาพใน Update Modal
 * Refactored version - ใช้ PhotoUtils เพื่อให้ clean code
 */

import { PhotoUtils } from '/photo-utils.js';

export class UpdatePhotoManager {
    constructor() {
        this.utils = new PhotoUtils();
    }

    /**
     * สร้าง URL สำหรับรูปภาพ
     */
    buildImageUrl(photoPath) {
        return this.utils.buildImageUrl(photoPath);
    }

    /**
     * สร้าง HTML สำหรับรูปภาพที่มีอยู่
     */
    createExistingPhotoHTML(photo, canDelete = false) {
        return this.utils.createExistingPhotoHTML(photo, canDelete);
    }

    /**
     * สร้าง HTML สำหรับรูปภาพใหม่
     */
    createNewPhotoHTML(photoPreview, index, checklistId) {
        return this.utils.createNewPhotoHTML(photoPreview, index, checklistId);
    }

    /**
     * จัดการการเลือกไฟล์
     */
    async handleFileSelection(input, checklistId, previewContainer) {
        const files = Array.from(input.files);
        
        if (files.length === 0) {
            previewContainer.innerHTML = '';
            return;
        }

        // ตรวจสอบไฟล์
        const validation = this.utils.validateFiles(files);
        if (!validation.valid) {
            const { UpdateModalUtils } = await import('/update-modal-utils.js');
            UpdateModalUtils.showBackendError('ข้อผิดพลาดในการเลือกไฟล์:\n' + validation.errors.join('\n'));
            input.value = '';
            previewContainer.innerHTML = '';
            return;
        }

        // สร้าง preview
        try {
            const previews = await this.createPreviews(files);
            const previewHTML = this.buildPreviewHTML(previews, checklistId);
            
            previewContainer.innerHTML = `<div class="row g-2">${previewHTML}</div>`;
            this.setupRemoveListeners(previewContainer, checklistId);

        } catch (error) {
            console.error('Error creating photo previews:', error);
            const { UpdateModalUtils } = await import('/update-modal-utils.js');
            UpdateModalUtils.showBackendError('เกิดข้อผิดพลาดในการสร้าง preview รูปภาพ');
            input.value = '';
            previewContainer.innerHTML = '';
        }
    }

    /**
     * สร้าง previews สำหรับไฟล์ทั้งหมด
     */
    async createPreviews(files) {
        return await Promise.all(
            files.map(file => this.utils.createPhotoPreview(file))
        );
    }

    /**
     * สร้าง HTML สำหรับ preview ทั้งหมด
     */
    buildPreviewHTML(previews, checklistId) {
        return previews.map((preview, index) => 
            this.createNewPhotoHTML(preview, index, checklistId)
        ).join('');
    }

    /**
     * ตั้งค่า event listeners สำหรับปุ่มลบรูปภาพใหม่
     */
    setupRemoveListeners(container, checklistId) {
        const removeButtons = container.querySelectorAll('.remove-new-photo');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fileIndex = parseInt(e.target.closest('.remove-new-photo').dataset.fileIndex);
                this.removeFile(checklistId, fileIndex);
            });
        });
    }

    /**
     * ลบไฟล์จาก input
     */
    removeFile(checklistId, fileIndex) {
        const input = document.querySelector(`.update-photo-input[data-checklist-id="${checklistId}"]`);
        const previewContainer = document.getElementById(`newPhotoPreview_${checklistId}`);
        
        if (!input || !input.files) return;

        // สร้าง FileList ใหม่โดยไม่รวมไฟล์ที่ต้องการลบ
        input.files = this.utils.createFileListWithoutIndex(input.files, fileIndex);
        
        // อัพเดท preview
        this.handleFileSelection(input, checklistId, previewContainer);
    }

    /**
     * ลบรูปภาพที่มีอยู่ (soft delete)
     */
    markPhotoForDeletion(photoId, checklistId) {
        const photoElement = this.getPhotoElement(photoId);
        if (!photoElement) return;

        this.applyDeleteVisuals(photoElement);
        this.addDeleteMarker(photoElement, photoId, checklistId);
        this.updateDeleteButton(photoElement, photoId, 'undo');
    }

    /**
     * ยกเลิกการลบรูปภาพ
     */
    unmarkPhotoForDeletion(photoId) {
        const photoElement = this.getPhotoElement(photoId);
        if (!photoElement) return;

        this.removeDeleteVisuals(photoElement);
        this.removeDeleteMarker(photoElement);
        this.updateDeleteButton(photoElement, photoId, 'delete');
    }

    /**
     * ดึง photo element
     */
    getPhotoElement(photoId) {
        return document.querySelector(`.delete-photo-btn[data-photo-id="${photoId}"]`)?.closest('.col-md-3');
    }

    /**
     * เพิ่ม visual indicators สำหรับการลบ
     */
    applyDeleteVisuals(photoElement) {
        photoElement.classList.add('photo-marked-delete');
        photoElement.style.opacity = '0.5';
        
        const overlay = this.utils.createDeleteOverlay();
        photoElement.querySelector('.photo-item').appendChild(overlay);
    }

    /**
     * ลบ visual indicators
     */
    removeDeleteVisuals(photoElement) {
        photoElement.classList.remove('photo-marked-delete');
        photoElement.style.opacity = '1';
        
        const overlay = photoElement.querySelector('.delete-overlay');
        if (overlay) overlay.remove();
    }

    /**
     * เพิ่ม delete marker
     */
    addDeleteMarker(photoElement, photoId, checklistId) {
        const marker = this.utils.createDeleteMarker(photoId, checklistId);
        photoElement.appendChild(marker);
    }

    /**
     * ลบ delete marker
     */
    removeDeleteMarker(photoElement) {
        const marker = photoElement.querySelector('.photo-delete-marker');
        if (marker) marker.remove();
    }

    /**
     * อัพเดทปุ่มลบ
     */
    updateDeleteButton(photoElement, photoId, action) {
        const deleteBtn = photoElement.querySelector('.delete-photo-btn');
        if (!deleteBtn) return;

        if (action === 'undo') {
            deleteBtn.innerHTML = '<i class="fas fa-undo"></i>';
            deleteBtn.title = 'ยกเลิกการลบ';
            deleteBtn.classList.remove('btn-danger');
            deleteBtn.classList.add('btn-warning');
            deleteBtn.onclick = () => this.unmarkPhotoForDeletion(photoId);
        } else {
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.title = 'ลบรูปภาพ';
            deleteBtn.classList.remove('btn-warning');
            deleteBtn.classList.add('btn-danger');
            deleteBtn.onclick = () => this.markPhotoForDeletion(photoId);
        }
    }

    /**
     * รวบรวมข้อมูลรูปภาพที่ต้องลบ
     */
    getPhotosToDelete() {
        return this.utils.getPhotosToDelete();
    }

    /**
     * รวบรวมไฟล์รูปภาพใหม่
     */
    getNewPhotos() {
        return this.utils.getNewPhotos();
    }

    /**
     * ล้างรูปภาพทั้งหมด
     */
    clearAllPhotos() {
        this.utils.clearPhotoInputs();
        this.utils.clearPreviewContainers();
        this.clearMarkedPhotos();
    }

    /**
     * ล้าง marked photos
     */
    clearMarkedPhotos() {
        const markedPhotos = document.querySelectorAll('.photo-marked-delete');
        markedPhotos.forEach(photo => {
            const photoId = photo.querySelector('.delete-photo-btn')?.dataset.photoId;
            if (photoId) {
                this.unmarkPhotoForDeletion(photoId);
            }
        });
    }
}
