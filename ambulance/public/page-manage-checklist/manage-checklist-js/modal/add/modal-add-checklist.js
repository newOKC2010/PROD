import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';
import { showAlert, showToast } from '/global-auth-status.js';
import { refreshTable } from '/table-contents.js';

/**
 * แสดง modal เพิ่มรายการ
 */
export async function showAddModal() {
    try {
        // ตรวจสอบ token
        const token = getStoredToken();
        if (!token) {
            showAlert('ข้อผิดพลาด', 'ไม่พบ token การเข้าสู่ระบบ', 'error');
            return;
        }

        const { value: formData } = await Swal.fire({
            title: 'เพิ่มรายการตรวจสอบ',
            html: `
                <div class="modal-add-container">
                    <label for="swal-input-name" class="modal-add-label">
                        ชื่อรายการตรวจสอบ <span class="modal-add-required">*</span>
                    </label>
                    <input id="swal-input-name" class="modal-add-input" 
                           placeholder="ระบุชื่อรายการตรวจสอบ">
                </div>
            `,
            focusConfirm: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: true,
            confirmButtonText: 'บันทึก',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                confirmButton: 'modal-add-confirm',
                cancelButton: 'modal-add-cancel'
            },
            preConfirm: () => {
                const name = document.getElementById('swal-input-name').value.trim();
                
                if (!name) {
                    Swal.showValidationMessage('กรุณาระบุชื่อรายการตรวจสอบ');
                    return false;
                }
                
                return { name };
            }
        });

        if (formData) {
            await submitAdd(formData, token);
        }
    } catch (error) {
        console.error('Add modal error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการแสดง modal', 'error');
    }
}

/**
 * ส่งข้อมูลไป API
 */
async function submitAdd(data, token) {
    try {
        // แสดง loading
        Swal.fire({
            title: 'กำลังบันทึก...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(API_ENDPOINTS.MANAGE_CHECKLIST.CREATE, {
            method: 'POST',
            headers: createAuthHeaders(token),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast('เพิ่มรายการสำเร็จ', 'success');
            await refreshTable();
        } else {
            showAlert('ข้อผิดพลาด', result.message || 'เกิดข้อผิดพลาดในการเพิ่มรายการ', 'error');
        }
    } catch (error) {
        console.error('Submit add error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
}
