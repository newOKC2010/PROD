/**
 * Update Role Permission Manager - จัดการสิทธิ์การแก้ไขตาม role
 */

import { API_ENDPOINTS } from '/global-api.js';

export class UpdateRolePermission {
    constructor(currentUser) {
        this.currentUser = currentUser;
        this.isAdmin = currentUser?.role === 'admin';
        this.imageEndpoint = API_ENDPOINTS.MAIN_CHECK.IMG;
    }

    /**
     * สร้าง URL สำหรับรูปภาพ
     * @param {string} photoPath - path ของรูปภาพ
     * @returns {string} URL ที่สมบูรณ์
     */
    buildImageUrl(photoPath) {
        if (photoPath.startsWith('http')) {
            return photoPath;
        }
        
        // ลบ leading slash หากมี
        let cleanPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
        
        // ถ้า path ขึ้นต้นด้วย "img/" ให้ตัดออก เพราะ API endpoint เป็น /img แล้ว
        if (cleanPath.startsWith('img/')) {
            cleanPath = cleanPath.slice(4); // ตัด "img/" ออก (4 ตัวอักษร)
        }
        
        // ใช้ API_ENDPOINTS.MAIN_CHECK.IMG
        return `${this.imageEndpoint}/${cleanPath}`;
    }

    /**
     * ตรวจสอบสิทธิ์แก้ไข status (เฉพาะ admin)
     */
    canUpdateStatus() {
        return this.isAdmin;
    }

    /**
     * ตรวจสอบสิทธิ์แก้ไข note (ทุกคน)
     */
    canUpdateNote() {
        return true;
    }

    /**
     * ตรวจสอบสิทธิ์เพิ่มรูปภาพ (ทุกคน)
     */
    canAddPhoto() {
        return true;
    }

    /**
     * ตรวจสอบสิทธิ์ลบรูปภาพ (เฉพาะ admin)
     */
    canDeletePhoto() {
        return this.isAdmin;
    }

    /**
     * สร้าง HTML สำหรับ status controls
     */
    createStatusControls(checklistId, currentStatus, itemName) {
        if (!this.canUpdateStatus()) {
            // ถ้าไม่มีสิทธิ์แก้ไข status แสดงเป็น badge เท่านั้น
            const statusBadge = currentStatus ? 
                '<span class="badge bg-success">ผ่าน</span>' :
                '<span class="badge bg-danger">ไม่ผ่าน</span>';
            
            return `
                <div class="status-display">
                    <label class="form-label fw-bold">สถานะ (ไม่สามารถแก้ไขได้)</label>
                    <div class="p-2 bg-light rounded">
                        ${statusBadge}
                        <small class="text-muted ms-2">เฉพาะ Admin เท่านั้นที่สามารถแก้ไขสถานะได้</small>
                    </div>
                </div>
            `;
        }

        // สำหรับ admin - แสดง radio buttons
        return `
            <div class="status-controls">
                <label class="form-label fw-bold">สถานะการตรวจสอบ</label>
                <div class="status-options">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input status-radio-input" type="radio" 
                               name="status_${checklistId}" id="pass_${checklistId}" 
                               value="true" ${currentStatus ? 'checked' : ''}>
                        <label class="form-check-label text-success fw-bold" for="pass_${checklistId}">
                            <i class="fas fa-check-circle me-1"></i>ผ่าน
                        </label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input status-radio-input" type="radio" 
                               name="status_${checklistId}" id="fail_${checklistId}" 
                               value="false" ${!currentStatus ? 'checked' : ''}>
                        <label class="form-check-label text-danger fw-bold" for="fail_${checklistId}">
                            <i class="fas fa-times-circle me-1"></i>ไม่ผ่าน
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * สร้าง HTML สำหรับ photo controls
     */
    createPhotoControls(checklistId, existingPhotos = []) {
        // ใช้ method ใหม่จาก content manager
        const canDelete = this.canDeletePhoto();
        return this.createPhotoUpload?.(checklistId, existingPhotos, canDelete) || this.createLegacyPhotoControls(checklistId, existingPhotos);
    }

    /**
     * สร้าง photo controls แบบเดิม (fallback)
     */
    createLegacyPhotoControls(checklistId, existingPhotos = []) {
        let html = '<div class="photo-controls">';
        
        // แสดงรูปภาพที่มีอยู่
        if (existingPhotos.length > 0) {
            html += '<div class="existing-photos mb-3">';
            html += '<label class="form-label fw-bold">รูปภาพปัจจุบัน</label>';
            html += '<div class="row g-2">';
            
            existingPhotos.forEach(photo => {
                const imageUrl = this.buildImageUrl(photo.photo_path);
                html += `
                    <div class="col-md-3 photo-item" data-photo-id="${photo.id}">
                        <div class="position-relative">
                            <img src="${imageUrl}" 
                                 style="width: 100%; height: 120px; object-fit: cover;" 
                                 alt="รูปภาพ">
                            ${this.canDeletePhoto() ? `
                                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 delete-photo-btn"
                                        data-photo-id="${photo.id}" data-checklist-id="${checklistId}"
                                        title="ลบรูปภาพ">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            if (!this.canDeletePhoto()) {
                html += '<small class="text-muted">เฉพาะ Admin เท่านั้นที่สามารถลบรูปภาพได้</small>';
            }
            
            html += '</div>';
        }

        // เพิ่มรูปภาพใหม่
        if (this.canAddPhoto()) {
            html += `
                <div class="add-photos">
                    <label class="form-label fw-bold">เพิ่มรูปภาพใหม่</label>
                    <input type="file" class="form-control update-photo-input" 
                           data-checklist-id="${checklistId}"
                           accept="image/*" multiple>
                    <div class="form-text">เลือกรูปภาพหลายไฟล์ได้ (JPG, PNG, GIF)</div>
                    <div id="newPhotoPreview_${checklistId}" class="mt-2"></div>
                </div>
            `;
        } else {
            html += '<small class="text-muted">คุณไม่มีสิทธิ์เพิ่มรูปภาพ</small>';
        }
        
        html += '</div>';
        return html;
    }

    /**
     * สร้าง HTML สำหรับ note controls
     */
    createNoteControls(checklistId, currentNote = '') {
        if (!this.canUpdateNote()) {
            return `
                <div class="note-display">
                    <label class="form-label fw-bold">หมายเหตุ (ไม่สามารถแก้ไขได้)</label>
                    <div class="p-2 bg-light rounded">
                        ${currentNote || '<em class="text-muted">ไม่มีหมายเหตุ</em>'}
                    </div>
                </div>
            `;
        }

        return `
            <div class="note-controls">
                <label class="form-label fw-bold">หมายเหตุ</label>
                <textarea class="form-control note-textarea" 
                          name="note_${checklistId}" 
                          rows="3" 
                          placeholder="ระบุหมายเหตุเพิ่มเติม...">${currentNote}</textarea>
                <div class="form-text">สามารถระบุรายละเอียดเพิ่มเติมได้</div>
            </div>
        `;
    }

    /**
     * ตรวจสอบว่ามีสิทธิ์แก้ไขอะไรบ้าง
     */
    getPermissionSummary() {
        return {
            canUpdateStatus: this.canUpdateStatus(),
            canUpdateNote: this.canUpdateNote(),
            canAddPhoto: this.canAddPhoto(),
            canDeletePhoto: this.canDeletePhoto(),
            userRole: this.currentUser?.role || 'unknown'
        };
    }

    /**
     * สร้าง warning message สำหรับสิทธิ์
     */
    createPermissionWarning() {
        if (this.isAdmin) {
            return ''; // Admin ไม่ต้องแสดง warning
        }

        return `
            <div class="alert alert-info mb-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>หมายเหตุ:</strong> คุณสามารถแก้ไขได้เฉพาะ <strong>หมายเหตุ</strong> และ <strong>เพิ่มรูปภาพ</strong> เท่านั้น 
                สำหรับการแก้ไขสถานะและลบรูปภาพต้องมีสิทธิ์ Admin
            </div>
        `;
    }
}
