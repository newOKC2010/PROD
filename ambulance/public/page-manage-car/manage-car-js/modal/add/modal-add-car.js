import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';
import { showAlert, showToast } from '/global-auth-status.js';
import { refreshTable } from '/table-car-contents.js';

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
            title: 'เพิ่มรายการรถพยาบาล',
            html: `
                <div class="modal-add-container">
                    <label for="swal-input-license" class="modal-add-label">
                        หมายเลขทะเบียนรถ <span class="modal-add-required">*</span>
                    </label>
                    <input id="swal-input-license" class="modal-add-input" 
                           placeholder="ระบุหมายเลขทะเบียนรถ">
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
                const license_plate = document.getElementById('swal-input-license').value.trim();
                
                if (!license_plate) {
                    Swal.showValidationMessage('กรุณาระบุหมายเลขทะเบียนรถ');
                    return false;
                }
                
                return { license_plate };
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

        const response = await fetch(API_ENDPOINTS.MANAGE_CAR.CREATE, {
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
