// Table Users Submit - จัดการการส่งข้อมูลและปุ่ม

import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';
import { showToast, checkAdminAccess } from '/global-auth-status.js';

// ลบผู้ใช้
export async function deleteUser(userId) {
    try {
        const token = getStoredToken();
        if (!token) {
            throw new Error('ไม่พบ token การเข้าสู่ระบบ');
        }

        const response = await fetch(API_ENDPOINTS.MANAGE_USER.DELETE, {
            method: 'DELETE',
            headers: createAuthHeaders(token),
            body: JSON.stringify({ user_id: userId })
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || 'ไม่สามารถลบผู้ใช้ได้');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

// อัพเดทข้อมูลผู้ใช้
export async function updateUser(userId, updateData) {
    try {
        const token = getStoredToken();
        if (!token) {
            throw new Error('ไม่พบ token การเข้าสู่ระบบ');
        }

        const response = await fetch(API_ENDPOINTS.MANAGE_USER.UPDATE, {
            method: 'PUT',
            headers: createAuthHeaders(token),
            body: JSON.stringify({
                user_id: userId,
                ...updateData
            })
        });

        const result = await response.json();

        if (result.success) {
            return result;
        } else {
            throw new Error(result.message || 'ไม่สามารถอัพเดทผู้ใช้ได้');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

// จัดการคลิกปุ่มลบ
export async function handleDeleteClick(event, onDeleteSuccess) {
    // ตรวจสอบสิทธิ์ admin
    if (!await checkAdminAccess()) {
        alert('ไม่มีสิทธิ์เข้าถึงหน้า หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
        return;
    }

    const button = event.target.closest('.btn-delete');
    const userId = parseInt(button.dataset.userId);
    const row = button.closest('tr');
    const username = row.querySelector('.username')?.textContent || 'ไม่ระบุ';
    
    Swal.fire({
        title: 'ยืนยันการลบ',
        html: `คุณต้องการลบผู้ใช้ <span style="color: #dc3545; font-weight: bold;">"${username}"</span> หรือไม่?<br>การดำเนินการนี้ไม่สามารถยกเลิกได้`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await deleteUser(userId);
                
                // แสดง success message
                showToast(`ลบผู้ใช้ "${username}" สำเร็จ`, 'success');
                
                // อัพเดท pagination
                if (window.removeUser) {
                    window.removeUser(userId);
                } else {
                    // ลบแถวออกจากตาราง (fallback)
                    const row = button.closest('tr');
                    row.remove();
                }
                
                // เรียก callback function
                if (onDeleteSuccess) {
                    onDeleteSuccess(userId);
                }
                
            } catch (error) {
                showToast(error.message, 'error');
            }
        }
    });
}

// จัดการการเปลี่ยนแปลง role
export async function handleRoleChange(event, onUpdateSuccess) {
    // ตรวจสอบสิทธิ์ admin
    if (!await checkAdminAccess()) {
        alert('ไม่มีสิทธิ์เข้าถึงหน้า หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
        // คืนค่าเดิม
        const select = event.target;
        const originalValue = select.dataset.originalValue || select.value;
        select.value = originalValue;
        return;
    }

    const select = event.target;
    const userId = parseInt(select.dataset.userId);
    const newRole = select.value;
    const row = select.closest('tr');
    
    // เก็บค่าเดิมไว้
    const originalValue = select.dataset.originalValue || select.value;
    
    // แสดง loading
    row.classList.add('updating');
    
    updateUser(userId, { role: newRole })
        .then((result) => {
            // อัพเดทค่าเดิม
            select.dataset.originalValue = newRole;
            
            // อัพเดท class
            select.className = `role-select ${newRole}`;
            
            // แสดง success flash
            row.classList.add('success-flash');
            setTimeout(() => {
                row.classList.remove('success-flash');
            }, 1000);
            
            showToast('อัพเดทหน้าที่สำเร็จ', 'success');
            
            if (onUpdateSuccess) {
                onUpdateSuccess(userId, { role: newRole });
            }
        })
        .catch((error) => {
            // คืนค่าเดิม
            select.value = originalValue;
            
            // แสดง error flash
            row.classList.add('error-flash');
            setTimeout(() => {
                row.classList.remove('error-flash');
            }, 1000);
            
            showToast(error.message, 'error');
        })
        .finally(() => {
            row.classList.remove('updating');
        });
}

// จัดการการเปลี่ยนแปลง status
export async function handleStatusToggle(event, onUpdateSuccess) {
    // ตรวจสอบสิทธิ์ admin
    if (!await checkAdminAccess()) {
        alert('ไม่มีสิทธิ์เข้าถึงหน้า หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
        return;
    }

    const toggle = event.target;
    const userId = parseInt(toggle.dataset.userId);
    const currentStatus = toggle.classList.contains('active');
    const newStatus = !currentStatus;
    const row = toggle.closest('tr');
    
    // แสดง loading
    row.classList.add('updating');
    
    updateUser(userId, { users_active: newStatus })
        .then((result) => {
            // อัพเดท UI
            if (newStatus) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
            
            // แสดง success flash
            row.classList.add('success-flash');
            setTimeout(() => {
                row.classList.remove('success-flash');
            }, 1000);
            
            showToast(`${newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ผู้ใช้สำเร็จ`, 'success');
            
            if (onUpdateSuccess) {
                onUpdateSuccess(userId, { users_active: newStatus });
            }
        })
        .catch((error) => {
            // แสดง error flash
            row.classList.add('error-flash');
            setTimeout(() => {
                row.classList.remove('error-flash');
            }, 1000);
            
            showToast(error.message, 'error');
        })
        .finally(() => {
            row.classList.remove('updating');
        });
}
