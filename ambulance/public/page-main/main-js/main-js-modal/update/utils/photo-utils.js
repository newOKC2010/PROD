/**
 * Photo Utils - จัดการ utility functions สำหรับรูปภาพ
 * แยกออกมาจาก UpdatePhotoManager เพื่อให้ clean code
 */

import { API_ENDPOINTS } from '/global-api.js';

export class PhotoUtils {
    constructor() {
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.maxFiles = 10;
        this.imageEndpoint = API_ENDPOINTS.MAIN_CHECK.IMG;
    }

    /**
     * สร้าง URL สำหรับรูปภาพ
     */
    buildImageUrl(photoPath) {
        if (photoPath.startsWith('http')) return photoPath;
        
        let cleanPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
        
        if (cleanPath.startsWith('img/')) {
            cleanPath = cleanPath.slice(4);
        }
        
        return `${this.imageEndpoint}/${cleanPath}`;
    }

    /**
     * ตรวจสอบไฟล์รูปภาพ
     */
    validateFiles(files) {
        const errors = [];
        
        if (files.length > this.maxFiles) {
            errors.push(`สามารถเลือกได้สูงสุด ${this.maxFiles} ไฟล์`);
        }

        files.forEach(file => {
            if (!this.allowedTypes.includes(file.type)) {
                errors.push(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`);
            } else if (file.size > this.maxFileSize) {
                errors.push(`ไฟล์ ${file.name} ขนาดใหญ่เกิน ${this.maxFileSize / 1024 / 1024}MB`);
            }
        });

        return { valid: errors.length === 0, errors };
    }

    /**
     * สร้าง preview รูปภาพ
     */
    createPhotoPreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    file,
                    dataUrl: e.target.result,
                    size: this.formatFileSize(file.size),
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * แปลงขนาดไฟล์เป็นรูปแบบที่อ่านง่าย
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * สร้าง HTML สำหรับรูปภาพที่มีอยู่
     */
    createExistingPhotoHTML(photo, canDelete = false) {
        const imageUrl = this.buildImageUrl(photo.photo_path);
        const deleteButton = canDelete ? this.createDeleteButton(photo) : '';
        const description = photo.description ? this.createDescription(photo.description) : '';
        
        return `
            <div class="col-md-3 mb-2">
                <div class="photo-item position-relative">
                    <img src="${imageUrl}" class="existing-photo" 
                         style="width: 100%; height: 120px; object-fit: cover; cursor: pointer;" 
                         alt="รูปภาพ" data-photo-id="${photo.id}"
                         onclick="this.requestFullscreen()">
                    ${deleteButton}
                    ${description}
                </div>
            </div>
        `;
    }

    /**
     * สร้างปุ่มลบ
     */
    createDeleteButton(photo) {
        return `
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 delete-photo-btn"
                    data-photo-id="${photo.id}" data-checklist-id="${photo.checklist_id || ''}"
                    title="ลบรูปภาพ">
                <i class="fas fa-times"></i>
            </button>
        `;
    }

    /**
     * สร้าง description
     */
    createDescription(description) {
        return `
            <div class="photo-description">
                <small class="text-muted">${description}</small>
            </div>
        `;
    }

    /**
     * สร้าง HTML สำหรับรูปภาพใหม่
     */
    createNewPhotoHTML(photoPreview, index, checklistId) {
        return `
            <div class="col-md-3 mb-2">
                <div class="photo-item position-relative">
                    <img src="${photoPreview.dataUrl}" class="new-photo" 
                         style="width: 100%; height: 120px; object-fit: cover;" 
                         alt="รูปภาพใหม่">
                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 remove-new-photo"
                            data-file-index="${index}" data-checklist-id="${checklistId}"
                            title="ลบรูปภาพ">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="photo-info position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-1">
                        <small>
                            ${photoPreview.name}<br>
                            ${photoPreview.size}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * สร้าง delete overlay
     */
    createDeleteOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'delete-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-danger bg-opacity-75';
        overlay.innerHTML = '<i class="fas fa-trash text-white fa-2x"></i>';
        return overlay;
    }

    /**
     * สร้าง delete marker
     */
    createDeleteMarker(photoId, checklistId) {
        const marker = document.createElement('input');
        marker.type = 'hidden';
        marker.className = 'photo-delete-marker';
        marker.dataset.photoId = photoId;
        marker.dataset.checklistId = checklistId;
        return marker;
    }

    /**
     * สร้าง FileList ใหม่โดยไม่รวมไฟล์ที่ต้องการลบ
     */
    createFileListWithoutIndex(files, excludeIndex) {
        const dt = new DataTransfer();
        Array.from(files).forEach((file, index) => {
            if (index !== excludeIndex) {
                dt.items.add(file);
            }
        });
        return dt.files;
    }

    /**
     * ล้าง input files
     */
    clearPhotoInputs() {
        const photoInputs = document.querySelectorAll('.update-photo-input');
        photoInputs.forEach(input => input.value = '');
    }

    /**
     * ล้าง preview containers
     */
    clearPreviewContainers() {
        const previewContainers = document.querySelectorAll('[id^="newPhotoPreview_"]');
        previewContainers.forEach(container => container.innerHTML = '');
    }

    /**
     * รวบรวมข้อมูลรูปภาพที่ต้องลบ
     */
    getPhotosToDelete() {
        const markers = document.querySelectorAll('.photo-delete-marker');
        const deleteData = {};
        
        markers.forEach(marker => {
            const photoId = parseInt(marker.dataset.photoId);
            const checklistId = marker.dataset.checklistId;
            
            if (!isNaN(photoId) && photoId > 0 && checklistId && checklistId !== 'undefined') {
                if (!deleteData[checklistId]) {
                    deleteData[checklistId] = [];
                }
                deleteData[checklistId].push(photoId);
            }
        });
        
        return deleteData;
    }

    /**
     * รวบรวมไฟล์รูปภาพใหม่
     */
    getNewPhotos() {
        const photoInputs = document.querySelectorAll('.update-photo-input');
        const newPhotos = {};
        
        photoInputs.forEach(input => {
            if (input.files && input.files.length > 0) {
                const checklistId = input.dataset.checklistId;
                newPhotos[checklistId] = Array.from(input.files);
            }
        });
        
        return newPhotos;
    }
} 