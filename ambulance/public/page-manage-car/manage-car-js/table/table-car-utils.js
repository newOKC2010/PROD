import { checkAdminAccess } from '/global-auth-status.js';
import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';

/**
 * ตรวจสอบว่ารายการยัง active อยู่หรือไม่
 */
export async function isItemActive(id) {
    try {
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึง หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        const token = getStoredToken();
        if (!token) return false;

        const response = await fetch(API_ENDPOINTS.MANAGE_CAR.VIEW, {
            headers: createAuthHeaders(token)
        });
        
        const result = await response.json();
        return response.ok && result.success && result.data.some(item => item.id == id);
    } catch {
        return false;
    }
}

/**
 * ดึงข้อมูลจากแถว
 */
export function getRowData(id) {
    try {
        const row = document.querySelector(`button[onclick="editItem(${id})"]`)?.closest('tr');
        if (!row) return null;

        return {
            id,
            license_plate: row.querySelector('.table-name')?.textContent.trim() || ''
        };
    } catch {
        return null;
    }
}

/**
 * ตั้งค่าตาราง (function เดิมที่มีอยู่แล้ว)
 */
export function setupTable() {
    console.log('table-car-utils.js initialized');
}
