/**
 * Submit Validator - จัดการ validation และ data preparation
 * แยกออกมาจาก UpdateSubmitManager เพื่อให้ clean code
 */

import { API_ENDPOINTS, getStoredToken } from '/global-api.js';

export class SubmitValidator {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.token = getStoredToken();
    }

    /**
     * ตรวจสอบและเตรียมข้อมูลก่อนส่ง
     */
    async validateAndPrepare(updateData) {
        // ตรวจสอบการเปลี่ยนแปลง
        if (!this.hasChanges(updateData)) {
            return { valid: false, message: 'ไม่มีข้อมูลที่เปลี่ยนแปลง' };
        }

        // ตรวจสอบ ID
        if (!this.isValidId(updateData.id)) {
            return { valid: false, message: 'ไม่พบ ID ของรายการที่ต้องการแก้ไข' };
        }

        // ตรวจสอบ items format
        if (!this.isValidItems(updateData.items)) {
            return { valid: false, message: 'รูปแบบข้อมูล items ไม่ถูกต้อง' };
        }

        // ตรวจสอบการเชื่อมต่อ
        const connected = await this.checkConnection();
        if (!connected) {
            return { valid: false, message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
        }

        // ตรวจสอบขนาดไฟล์
        const formData = this.prepareFormData(updateData);
        const sizeValidation = this.validateDataSize(formData);
        if (!sizeValidation.valid) {
            return sizeValidation;
        }

        return { valid: true };
    }

    /**
     * ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
     */
    hasChanges(updateData) {
        if (!updateData.hasChanges) return false;
        
        const hasItemChanges = updateData.items?.length > 0;
        const hasPhotoChanges = this.hasPhotoChanges(updateData);
        
        return hasItemChanges || hasPhotoChanges;
    }

    /**
     * ตรวจสอบการเปลี่ยนแปลงรูปภาพ
     */
    hasPhotoChanges(updateData) {
        const hasNewPhotos = updateData.photos && Object.keys(updateData.photos).length > 0;
        const hasDeletePhotos = updateData.deletePhotos && Object.keys(updateData.deletePhotos).length > 0;
        return hasNewPhotos || hasDeletePhotos;
    }

    /**
     * ตรวจสอบ ID
     */
    isValidId(id) {
        return id && typeof id === 'number' && id > 0;
    }

    /**
     * ตรวจสอบ items format
     */
    isValidItems(items) {
        return items && Array.isArray(items);
    }

    /**
     * ตรวจสอบการเชื่อมต่อ
     */
    async checkConnection() {
        try {
            const response = await fetch(API_ENDPOINTS.AUTH.STATUS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * เตรียม FormData
     */
    prepareFormData(updateData) {
        const formData = new FormData();

        // ข้อมูลหลัก
        formData.append('id', updateData.id.toString());
        formData.append('items', JSON.stringify(updateData.items));

        // รูปภาพใหม่
        this.appendNewPhotos(formData, updateData.photos);
        
        // รูปภาพที่ต้องลบ
        this.appendDeletePhotos(formData, updateData.deletePhotos);

        return formData;
    }

    /**
     * เพิ่มรูปภาพใหม่ใน FormData
     */
    appendNewPhotos(formData, photos) {
        if (!photos || Object.keys(photos).length === 0) return;

        Object.entries(photos).forEach(([checklistId, files]) => {
            files.forEach(file => {
                formData.append(`photos_${checklistId}`, file);
            });
        });
    }

    /**
     * เพิ่มรายการรูปภาพที่ต้องลบใน FormData
     */
    appendDeletePhotos(formData, deletePhotos) {
        if (!deletePhotos || Object.keys(deletePhotos).length === 0) return;

        Object.entries(deletePhotos).forEach(([checklistId, photoIds]) => {
            if (photoIds.length > 0) {
                formData.append(`delete_photos_${checklistId}`, JSON.stringify(photoIds));
            }
        });
    }

    /**
     * ตรวจสอบขนาดข้อมูล
     */
    validateDataSize(formData) {
        let totalSize = 0;
        
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                totalSize += value.size;
            }
        }
        
        if (totalSize > this.maxFileSize) {
            return {
                valid: false,
                message: `ขนาดไฟล์รวมเกิน ${this.maxFileSize / 1024 / 1024}MB กรุณาลดขนาดไฟล์`
            };
        }
        
        return { valid: true };
    }

    /**
     * หน่วงเวลา
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 