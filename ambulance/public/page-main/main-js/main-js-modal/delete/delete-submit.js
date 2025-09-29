/**
 * Delete Submit Manager - จัดการการส่งข้อมูลลบไป API
 */

import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';
import { showAlert } from '/global-auth-status.js';

export class DeleteSubmitManager {
    /**
     * ตรวจสอบสิทธิ์การลบกับ backend
     */
    static async checkDeletePermission(itemId) {
        const token = getStoredToken();
        
        try {
            const response = await fetch(API_ENDPOINTS.MAIN_CHECK.VIEW, {
                method: 'GET',
                headers: createAuthHeaders(token)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                return { valid: false, message: result.message };
            }
            
            // ตรวจสอบว่า item ยังมีอยู่ไหม
            const itemExists = result.data.some(item => item.id == itemId);
            if (!itemExists) {
                return { valid: false, message: 'ไม่พบรายการที่ต้องการลบ' };
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' };
        }
    }

    /**
     * ส่งคำขอลบไป API
     */
    static async deleteItem(itemId) {
        const token = getStoredToken();
        
        const response = await fetch(API_ENDPOINTS.MAIN_CHECK.DELETE, {
            method: 'DELETE',
            headers: createAuthHeaders(token),
            body: JSON.stringify({ id: itemId })
        });

        return await response.json();
    }

    /**
     * แสดงข้อความสำเร็จ
     */
    static showSuccessMessage() {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'ลบรายการเรียบร้อยแล้ว' });
    }

    /**
     * แสดงข้อความข้อผิดพลาด
     */
    static showErrorMessage(message) {
        showAlert('เกิดข้อผิดพลาด', message || 'ไม่สามารถลบได้', 'error');
        setTimeout(() => window.location.reload(), 1500);
    }
}
