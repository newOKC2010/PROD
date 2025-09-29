import { refreshTable } from '/table-contents.js';
import { API_ENDPOINTS, createAuthHeaders, getStoredToken} from '/global-api.js';
import { showAlert, showToast,checkAdminAccess } from '/global-auth-status.js';
import { updateTableRow } from '/table-update-row.js';

/**
 * แสดง modal แก้ไขรายการ
 */
export async function showUpdateModal(id, currentName, currentDescription = '') {
    try {
        // ตรวจสอบสิทธิ์ admin
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึง หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        const { value: formData } = await Swal.fire({
            title: 'แก้ไขรายการตรวจสอบ',
            html: `
                <div class="modal-update-container">
                    <label for="swal-update-name" class="modal-update-label">
                        ชื่อรายการตรวจสอบ <span class="modal-update-required">*</span>
                    </label>
                    <input id="swal-update-name" class="modal-update-input" 
                           value="${currentName}" placeholder="ระบุชื่อรายการตรวจสอบ">
                    
                    <label for="swal-update-description" class="modal-update-label">
                        คำอธิบาย (ไม่บังคับ)
                    </label>
                    <textarea id="swal-update-description" class="modal-update-textarea" 
                              placeholder="ระบุคำอธิบายเพิ่มเติม" rows="3">${currentDescription}</textarea>
                </div>
            `,
            focusConfirm: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                confirmButton: 'modal-update-confirm',
                cancelButton: 'modal-update-cancel'
            },
            preConfirm: () => {
                const name = document.getElementById('swal-update-name').value.trim();
                const description = document.getElementById('swal-update-description').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('กรุณาระบุชื่อรายการตรวจสอบ');
                    return false;
                }
                
                return { name, description: description || null };
            }
        });

        if (formData) {
            await submitUpdate(id, formData);
        }
    } catch (error) {
        console.error('Update modal error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการแสดง modal แก้ไข', 'error');
    }
}

/**
 * ส่งข้อมูลไป API
 */
async function submitUpdate(id, data) {
    try {

        const token = getStoredToken();
        if (!token) {
            showAlert('ข้อผิดพลาด', 'ไม่พบ token การเข้าสู่ระบบ', 'error');
            return;
        }

        // แสดง loading
        Swal.fire({
            title: 'กำลังบันทึก...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading()
        });

        const response = await fetch(API_ENDPOINTS.MANAGE_CHECKLIST.UPDATE, {
            method: 'PUT',
            headers: createAuthHeaders(token),
            body: JSON.stringify({ id, ...data })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast('แก้ไขรายการสำเร็จ', 'success');
            updateTableRow(id, result.data);
        } else {
            showAlert('ข้อผิดพลาด', result.message || 'เกิดข้อผิดพลาดในการแก้ไขรายการ', 'error');
            await refreshTable();
        }
    } catch (error) {
        console.error('Submit update error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        await refreshTable();
    }
}
