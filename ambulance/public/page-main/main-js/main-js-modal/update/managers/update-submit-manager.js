/**
 * Update Submit Manager - จัดการการส่งข้อมูลแก้ไขไป Backend
 * Clean code version - เรียบง่าย สั้นกระชับ
 */

import { API_ENDPOINTS, getStoredToken } from '/global-api.js';
import { SubmitValidator } from '/submit-validator.js';

export class UpdateSubmitManager {
    constructor() {
        this.validator = new SubmitValidator();
    }

    /**
     * ส่งข้อมูลแก้ไข Checklist
     */
    async submitUpdate(updateData) {
        try {
            const formData = this.validator.prepareFormData(updateData);
            const token = getStoredToken();

            const response = await fetch(API_ENDPOINTS.MAIN_CHECK.UPDATE, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await response.json();
            return this.processResponse(response, result);

        } catch (error) {
            console.error('Error submitting update:', error);
            return { success: false, message: this.getErrorMessage(error) };
        }
    }

    /**
     * ประมวลผล response
     */
    processResponse(response, result) {
        if (response.ok && result.success) {
            return { success: true, message: result.message || 'แก้ไขข้อมูลสำเร็จ' };
        }
        return { success: false, message: result.message || `เกิดข้อผิดพลาด (HTTP ${response.status})` };
    }

    /**
     * แปลง error เป็นข้อความ
     */
    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
        }
        return error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล';
    }
}
