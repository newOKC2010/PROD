import { showAlert, checkAdminAccess } from '/global-auth-status.js';
import { showAddModal } from '/modal-add-checklist.js';
import { showUpdateModal } from '/modal-update-checklist.js';
import { deleteChecklistTemplate } from '/modal-delete-checklist.js';
import { refreshTable } from '/table-contents.js';
import { isItemActive, getRowData } from '/table-checklist-utils.js';

/**
 * จัดการปุ่มเพิ่ม
 */
async function handleAdd() {
    try {
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึง หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        await showAddModal();
    } catch (error) {
        console.error('Add error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเพิ่มรายการ', 'error');
    }
}

/**
 * จัดการปุ่มแก้ไข
 */
async function handleEdit(id) {
    try {
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึง หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        if (!await isItemActive(id)) {
            alert('ไม่สามารถแก้ไขได้ รายการนี้ถูกปิดใช้งานแล้ว');
            return refreshTable();
        }

        const rowData = getRowData(id);
        if (!rowData) {
            showAlert('ข้อผิดพลาด', 'ไม่พบข้อมูลรายการ', 'error');
            return;
        }

        await showUpdateModal(id, rowData.name);
    } catch (error) {
        console.error('Edit error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการแก้ไขรายการ', 'error');
    }
}

/**
 * จัดการปุ่มลบ
 */
async function handleDelete(id) {
    try {
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึง หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        if (!await isItemActive(id)) {
            alert('ไม่สามารถลบได้ รายการนี้ถูกปิดใช้งานแล้ว');
            return refreshTable();
        }

        await deleteChecklistTemplate(id);
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบรายการ', 'error');
    }
}

/**
 * ตั้งค่าปุ่มทั้งหมด
 */
export function setupButtons() {
    document.addEventListener('click', (e) => {
        if (e.target.id === 'addBtn' || e.target.closest('#addBtn')) {
            e.preventDefault();
            handleAdd();
        }
    });
}

// Export functions ให้ global ใช้
window.addItem = handleAdd;
window.editItem = handleEdit;
window.deleteItem = handleDelete;
