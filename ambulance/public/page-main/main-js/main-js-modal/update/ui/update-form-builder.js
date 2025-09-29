/**
 * Update Form Builder - จัดการการสร้าง HTML forms และ UI components
 * แยกออกมาจาก UpdateContentManager เพื่อให้ clean code
 */

import { UpdateModalUtils } from './update-modal-utils.js';

export class UpdateFormBuilder {
    constructor(photoManager) {
        this.photoManager = photoManager;
    }

    /**
     * สร้าง Update Form HTML หลัก
     */
    async buildUpdateForm(checklistData, rolePermission) {
        const vehicleInfo = this.buildVehicleInfo(checklistData);
        const permissionWarning = rolePermission.createPermissionWarning();
        const checklistItems = UpdateModalUtils.getChecklistItems(checklistData);
        
        const itemsHTML = await this.buildChecklistItems(checklistItems, rolePermission);

        return `
            <div class="update-form-container">
                ${vehicleInfo}
                ${permissionWarning}
                <div class="checklist-items">
                    <h6 class="mb-3">
                        <i class="fas fa-list-check me-2"></i>
                        รายการตรวจสอบ
                    </h6>
                    ${itemsHTML}
                </div>
            </div>
        `;
    }

    /**
     * สร้างข้อมูลรถยนต์ - แสดงข้อมูลพื้นฐานของการตรวจสอบ
     */
    buildVehicleInfo(checklistData) {
        const checkedDate = UpdateModalUtils.formatThaiDate(checklistData.checked_date);
        
        return `
            <div class="vehicle-info-card mb-4">
                <div class="card border-secondary">
                    <div class="card-header bg-light text-dark">
                        <h6 class="mb-0" style="font-weight: bold;">
                            <i class="fas fa-car me-2"></i>
                            ข้อมูลการตรวจสอบ
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>ชื่อรถ:</strong> ${checklistData.vehicle_name || 'ไม่ระบุ'}
                            </div>
                            <div class="col-md-6">
                                <strong>วันที่ตรวจสอบ:</strong> ${checkedDate}
                            </div>
                            <div class="col-md-6 mt-2">
                                <strong>ผู้ตรวจสอบ:</strong> ${checklistData.username || 'ไม่ระบุ'}
                            </div>
                            <div class="col-md-6 mt-2">
                                <strong>ID:</strong> #${checklistData.id}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * สร้าง checklist items ทั้งหมด
     */
    async buildChecklistItems(checklistItems, rolePermission) {
        let itemsHTML = '';
        
        for (let i = 0; i < checklistItems.length; i++) {
            const item = checklistItems[i];
            const itemHTML = await this.buildSingleItem(item, rolePermission, i + 1);
            itemsHTML += itemHTML;
        }
        
        return itemsHTML;
    }

    /**
     * สร้าง form สำหรับแต่ละ checklist item
     */
    async buildSingleItem(item, rolePermission, itemNumber) {
        const checklistId = item.checklist_id;
        const existingPhotos = this.getItemPhotos(item);
        
        const statusControls = rolePermission.createStatusControls(checklistId, item.status, item.name);
        const noteControls = rolePermission.createNoteControls(checklistId, item.note);
        const photoControls = this.buildPhotoSection(checklistId, existingPhotos, rolePermission.canDeletePhoto());

        return `
            <div class="checklist-item-form mb-4">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">
                            <span class="badge bg-secondary me-2">${itemNumber}</span>
                            ${item.name}
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">${statusControls}</div>
                            <div class="col-md-6">${noteControls}</div>
                        </div>
                        <hr>
                        <div class="photos-section">
                            <h6><i class="fas fa-camera me-2"></i>รูปภาพ</h6>
                            ${photoControls}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ดึง photos สำหรับ item
     */
    getItemPhotos(item) {
        try {
            return (item.photos && Array.isArray(item.photos)) ? item.photos : [];
        } catch (error) {
            console.error('Error getting item photos:', error);
            return [];
        }
    }

    /**
     * สร้างส่วน Photo Section - รวมรูปเดิมและการอัพโหลดใหม่
     */
    buildPhotoSection(checklistId, existingPhotos = [], canDelete = false) {
        const existingPhotosHTML = this.buildExistingPhotos(checklistId, existingPhotos, canDelete);
        const uploadSectionHTML = this.buildPhotoUploadSection(checklistId);
        
        return `
            <div class="photo-upload-section">
                ${existingPhotosHTML}
                ${uploadSectionHTML}
            </div>
        `;
    }

    /**
     * สร้างส่วนแสดงรูปภาพเดิม
     */
    buildExistingPhotos(checklistId, existingPhotos, canDelete) {
        if (existingPhotos.length === 0) return '';

        let photosHTML = '';
        existingPhotos.forEach(photo => {
            const imageUrl = this.photoManager.buildImageUrl(photo.photo_path);
            const deleteButton = canDelete ? this.buildDeleteButton(photo.id, checklistId) : '';
            
            photosHTML += `
                <div class="col-md-3 photo-item" data-photo-id="${photo.id}">
                    <div class="position-relative">
                        <img src="${imageUrl}" 
                             style="width: 100%; height: 120px; object-fit: cover;" 
                             alt="รูปภาพ">
                        ${deleteButton}
                    </div>
                </div>
            `;
        });

        return `
            <div class="existing-photos mb-3">
                <h6><i class="fas fa-images me-2"></i>รูปภาพปัจจุบัน</h6>
                <div class="row g-2" id="existingPhotos_${checklistId}">
                    ${photosHTML}
                </div>
            </div>
        `;
    }

    /**
     * สร้างปุ่มลบรูปภาพ
     */
    buildDeleteButton(photoId, checklistId) {
        return `
            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 delete-photo-btn"
                    data-photo-id="${photoId}" data-checklist-id="${checklistId}"
                    title="ลบรูปภาพ">
                <i class="fas fa-times"></i>
            </button>
        `;
    }

    /**
     * สร้างส่วนอัพโหลดรูปภาพใหม่
     */
    buildPhotoUploadSection(checklistId) {
        return `
            <div class="add-photos">
                <label for="photos_${checklistId}" class="photo-upload-label">
                    <i class="fas fa-camera"></i>
                    เพิ่มรูปภาพ (สามารถเลือกหลายรูป)
                </label>
                <input type="file" class="photo-upload-input update-photo-input" 
                       id="photos_${checklistId}" name="photos_${checklistId}"
                       data-checklist-id="${checklistId}"
                       accept="image/*" multiple>
                <div class="photo-preview-container" id="preview_${checklistId}">
                    <!-- Photo previews จะถูกแสดงที่นี่ -->
                </div>
            </div>
        `;
    }

    /**
     * สร้าง Photo Preview Item สำหรับรูปใหม่
     */
    buildPhotoPreviewItem(imageSrc, index, checklistId) {
        return `
            <div class="photo-preview-item" data-index="${index}" data-checklist-id="${checklistId}">
                <img src="${imageSrc}" alt="Preview" class="photo-preview-img">
                <button type="button" class="photo-preview-remove" 
                        data-checklist-id="${checklistId}" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
} 