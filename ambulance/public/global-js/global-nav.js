/**
 * Main Navigation System - Navbar และ Sidebar
 */

import { 
    logoutUser, 
    redirectToLogin,
    showConfirm 
} from '/global-auth-status.js';
import { getStoredToken, removeToken } from '/global-api.js';

let currentUser = null;
let isDesktop = window.innerWidth >= 1024;

// ตรวจสอบการเปลี่ยนขนาดหน้าจอ
window.addEventListener('resize', () => {
    const wasDesktop = isDesktop;
    isDesktop = window.innerWidth >= 1024;
    
    // ถ้าเปลี่ยนจาก mobile เป็น desktop หรือในทางกลับกัน
    if (wasDesktop !== isDesktop) {
        updateSidebarDisplay();
    }
});

/**
 * สร้าง Navbar HTML Structure
 * @returns {string} HTML string ของ navbar
 */
function createNavbarHTML() {
    return `
        <nav class="navbar">
            <button class="sidebar-menu-btn ${isDesktop ? 'desktop-hidden' : ''}" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i>
            </button>
            <!--<div class="navbar-brand">
                <i class="fas fa-ambulance"></i>
                ระบบตรวจสอบรถกู้ชีพ
            </div>-->
            <div class="navbar-user">
                <span >ยินดีต้อนรับคุณ ${currentUser.username}</span>
            </div>
        </nav>
    `;
}

/**
 * เพิ่ม Navbar เข้าไปใน DOM
 */
function initializeNavbar() {
    // ตรวจสอบว่ามี navbar อยู่แล้วหรือไม่
    if (document.querySelector('.navbar')) return;
    
    const navbarHTML = createNavbarHTML();
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);
}

/**
 * สร้าง Sidebar HTML Structure
 * @returns {string} HTML string ของ sidebar
 */
function createSidebarHTML() {
    return `
        <div class="sidebar ${isDesktop ? 'desktop-sidebar' : ''}" id="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-brand">
                    <i class="fas fa-ambulance"></i>
                    <span>ระบบตรวจสอบรถกู้ชีพ</span>
                </div>
                <button class="sidebar-toggle ${isDesktop ? 'desktop-hidden' : ''}" id="sidebarToggle">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="sidebar-content">
                <div class="sidebar-user">
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-info">
                        <div class="user-name" id="sidebarUserName">ผู้ใช้งาน</div>
                        <div class="user-role" id="sidebarUserRole">role</div>
                    </div>
                </div>
                
                <nav class="sidebar-nav">
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="/main" class="nav-link">
                                <i class="fas fa-home"></i>
                                <span>หน้าหลัก</span>
                            </a>
                        </li>
                        
                        <li class="nav-item" data-admin-only>
                            <a href="/manage-car" class="nav-link">
                                <i class="fas fa-car"></i>
                                <span>จัดการข้อมูลรถ</span>
                            </a>
                        </li>
                        
                        <li class="nav-item" data-admin-only>
                            <a href="/manage-checklist" class="nav-link">
                                <i class="fas fa-list-check"></i>
                                <span>จัดการรายการตรวจ</span>
                            </a>
                        </li>
                        
                        <li class="nav-item" data-admin-only>
                            <a href="/manage-users" class="nav-link">
                                <i class="fas fa-users"></i>
                                <span>จัดการผู้ใช้</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            
            <div class="sidebar-footer">
                <button class="logout-btn" id="sidebarLogoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </div>
        
        <div class="sidebar-overlay ${isDesktop ? 'desktop-hidden' : ''}" id="sidebarOverlay"></div>
    `;
}

/**
 * เพิ่ม Sidebar เข้าไปใน DOM
 */
function initializeSidebar() {
    // ตรวจสอบว่ามี sidebar อยู่แล้วหรือไม่
    if (document.getElementById('sidebar')) return;
    
    const sidebarHTML = createSidebarHTML();
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    
    // อัปเดตข้อมูลผู้ใช้ใน sidebar
    updateSidebarUserInfo();
    
    // ตั้งค่า event listeners สำหรับ sidebar
    setupSidebarEventListeners();
    
    // ตั้งค่าเนื้อหาตาม role
    setupRoleBasedContent();
    
    // ตั้งค่าการแสดงผลตามหน้าจอ
    updateSidebarDisplay();
    
    // เพิ่ม margin-left ให้ content บน desktop
    updateContentLayout();
}

/**
 * อัปเดตการแสดงผล sidebar ตามขนาดหน้าจอ
 */
function updateSidebarDisplay() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.querySelector('.sidebar-menu-btn');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (!sidebar) return;
    
    if (isDesktop) {
        // Desktop: แสดง sidebar เลย
        sidebar.classList.add('desktop-sidebar');
        sidebar.classList.add('active');
        
        if (overlay) overlay.classList.add('desktop-hidden');
        if (menuBtn) menuBtn.classList.add('desktop-hidden');
        if (sidebarToggle) sidebarToggle.classList.add('desktop-hidden');
        
        document.body.style.overflow = 'auto';
    } else {
        // Mobile: ซ่อน sidebar และแสดง burger menu
        sidebar.classList.remove('desktop-sidebar');
        sidebar.classList.remove('active');
        
        if (overlay) overlay.classList.remove('desktop-hidden');
        if (menuBtn) menuBtn.classList.remove('desktop-hidden');
        if (sidebarToggle) sidebarToggle.classList.remove('desktop-hidden');
        
        document.body.style.overflow = 'auto';
    }
    
    updateContentLayout();
}

/**
 * อัปเดต layout ของ content
 */
function updateContentLayout() {
    const mainContent = document.querySelector('.main-content') || document.body;
    
    if (isDesktop) {
        mainContent.style.marginLeft = '300px';
    } else {
        mainContent.style.marginLeft = '0';
    }
}

/**
 * อัปเดตข้อมูลผู้ใช้ใน sidebar
 */
function updateSidebarUserInfo() {
    if (!currentUser) return;
    
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    
    if (sidebarUserName) {
        sidebarUserName.textContent = currentUser.username || 'ผู้ใช้งาน';
    }
    
    if (sidebarUserRole) {
        const roleText = currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน';
        sidebarUserRole.textContent = roleText;
    }
}

/**
 * ตั้งค่าเนื้อหาตาม role ของผู้ใช้
 */
function setupRoleBasedContent() {
    if (!currentUser) return;
    
    const adminMenus = document.querySelectorAll('[data-admin-only]');
    const isAdmin = currentUser.role === 'admin';
    
    adminMenus.forEach(menu => {
        if (isAdmin) {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    });
}

/**
 * ตั้งค่า Event Listeners สำหรับ sidebar
 */
function setupSidebarEventListeners() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * จัดการการออกจากระบบ
 */
async function handleLogout() {
    const confirmed = await showConfirm('คุณแน่ใจหรือไม่ที่จะออกจากระบบ', {
        confirmButton: 'logout-confirm-btn',
        cancelButton: 'logout-cancel-btn'
    });
    
    if (!confirmed) return;

    const token = getStoredToken();
    
    if (!token) {
        redirectToLogin();
        return;
    }
    
    try {
        await logoutUser(token);
        removeToken();
    } catch (error) {
        console.error('Logout error:', error);
        removeToken();
    } finally {
        redirectToLogin();
    }
}

/**
 * เปิด sidebar (สำหรับ mobile เท่านั้น)
 */
function openSidebar() {
    if (isDesktop) return; // ไม่ทำงานบน desktop
    
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
        sidebar.classList.add('active');
    }
    
    if (overlay) {
        overlay.classList.add('active');
    }
    
    document.body.style.overflow = 'hidden';
}


function closeSidebar() {
    if (isDesktop) return;
    
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
        sidebar.classList.remove('active');
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    document.body.style.overflow = 'auto';
}


function toggleSidebar() {
    if (isDesktop) return;
    
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar && sidebar.classList.contains('active')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}



function initializeNavigation(userData) {
    currentUser = userData;
    
    initializeNavbar();
    initializeSidebar();
    
    updateSidebarUserInfo();
    
    setupRoleBasedContent();
}


window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.initializeNavigation = initializeNavigation;

export {
    initializeNavigation,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    updateSidebarUserInfo,
    setupRoleBasedContent
};
