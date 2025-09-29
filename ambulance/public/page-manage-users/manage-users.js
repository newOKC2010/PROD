import { getUserData, checkAdminAccess } from '/global-auth-status.js';
import { getStoredToken } from '/global-api.js';
import { initializeNavigation } from '/global-nav.js';
import { fetchUsers, showError } from '/table-users-contents.js';
import { UsersPaginationManager } from '/table-users-paginations.js';

// ตัวแปรสำหรับเก็บข้อมูล
let usersPagination = null;

async function init() {
    try {
        // ตรวจสอบสิทธิ์ admin
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึงหน้า หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }

        // เริ่มต้น navigation
        await initializeNav();

        // เริ่มต้น pagination
        initializePagination();

        // โหลดข้อมูลผู้ใช้
        await loadUsers();

    } catch (error) {
        console.error('Init error:', error);
    }
}

/**
 * เริ่มต้น navigation system
 */
async function initializeNav() {
    try {
        const token = getStoredToken();
        if (token) {
            const userData = await getUserData(token);
            if (userData) {
                initializeNavigation(userData);
            }
        }
    } catch (error) {
        console.error('Navigation init error:', error);
    }
}

// เริ่มต้น pagination
function initializePagination() {
    usersPagination = new UsersPaginationManager();
    
    usersPagination.setCallbacks({
        onDeleteSuccess: handleDeleteSuccess,
        onUpdateSuccess: handleUpdateSuccess
    });

    // เชื่อมต่อ global functions
    window.updateUsersData = (users) => usersPagination.updateUsers(users);
    window.removeUser = (userId) => usersPagination.removeUser(userId);
}

// โหลดข้อมูลผู้ใช้
async function loadUsers() {
    try {
        const users = await fetchUsers();
        usersPagination.updateUsers(users);
    } catch (error) {
        showError(error.message);
    }
}

// จัดการเมื่อลบผู้ใช้สำเร็จ
function handleDeleteSuccess(userId) {
    usersPagination.removeUser(userId);
}

// จัดการเมื่ออัพเดทผู้ใช้สำเร็จ
function handleUpdateSuccess(userId, updateData) {
    
    // อัพเดท pagination data
    if (usersPagination) {
        usersPagination.pagination.updateDataById(userId, updateData);
    }
}

// เริ่มต้นเมื่อหน้าโหลดเสร็จ
document.addEventListener('DOMContentLoaded', init);
