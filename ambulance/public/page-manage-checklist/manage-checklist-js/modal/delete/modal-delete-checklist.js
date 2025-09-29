import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';
import { checkAdminAccess, showAlert, showToast } from '/global-auth-status.js';
import { removeTableRow } from '/table-update-row.js';

/**
 * ลบ checklist template
 */
export async function deleteChecklistTemplate(id) {
    try {
        // ตรวจสอบสิทธิ์และยืนยันการลบ
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึง หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        // ดึงชื่อรายการ
        const itemName = getItemName(id);
        const confirmed = await confirmDelete(itemName);
        if (!confirmed) return;

        // ลบข้อมูล
        const result = await performDelete(id);
        if (result.success) {
            showToast('ลบรายการสำเร็จ', 'success');
            removeTableRow(id);
        } else {
            showAlert('ลบไม่สำเร็จ', result.message, 'error');
        }

    } catch (error) {
        console.error('Delete error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบรายการ', 'error');
    }
}

/**
 * ดึงชื่อรายการจากตาราง
 */
function getItemName(id) {
    const row = document.querySelector(`button[onclick="deleteItem(${id})"]`)?.closest('tr');
    const nameCell = row?.querySelector('.table-name');
    return nameCell ? nameCell.textContent.trim() : 'รายการนี้';
}

/**
 * ยืนยันการลบ
 */
async function confirmDelete(itemName) {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ',
        html: `คุณต้องการลบรายการ<br><strong style="color: #dc3545;">"${itemName}"</strong><br>หรือไม่?`,
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: false,
        buttonsStyling: false,
        customClass: {
            confirmButton: 'modal-delete-confirm',
            cancelButton: 'modal-delete-cancel'
        }
    });
    
    return result.isConfirmed;
}

/**
 * ส่ง API ลบข้อมูล
 */
async function performDelete(id) {
    const token = getStoredToken();
    if (!token) {
        return { success: false, message: 'ไม่พบ token การเข้าสู่ระบบ' };
    }

    try {
        const response = await fetch(API_ENDPOINTS.MANAGE_CHECKLIST.DELETE, {
            method: 'DELETE',
            headers: createAuthHeaders(token),
            body: JSON.stringify({ id })
        });

        const result = await response.json();
        return {
            success: response.ok && result.success,
            message: result.message || 'ไม่สามารถลบรายการได้'
        };

    } catch (error) {
        console.error('API delete error:', error);
        return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' };
    }
}
