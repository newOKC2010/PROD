import { getUserData,checkAdminAccess } from '/global-auth-status.js';
import { getStoredToken } from '/global-api.js';
import { initializeNavigation } from '/global-nav.js';
import { loadTable } from '/table-contents.js';
import { setupButtons } from '/table-submit-manager.js';


/**
 * เริ่มต้นหน้า manage-checklist
 */
async function init() {
    try {
        // ตรวจสอบสิทธิ์ admin
        if (!await checkAdminAccess()) {
            alert('ไม่มีสิทธิ์เข้าถึงหน้า หรือ บัญชีถูกระงับ เปลี่ยน สถานะการใช้งาน');
            return;
        }
        // เริ่มต้น navigation
        await initializeNav();

        // สร้างเนื้อหาหน้า
        createContent();
        setupButtons();
        await loadTable();

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

/**
 * สร้างเนื้อหาหน้า
 */
function createContent() {
    const container = document.querySelector('.container');
    
    const content = `
        <div class="content-wrapper">
            <!-- Add Button Section -->
            <div class="table-header">
                <h3 class="table-title">รายการตรวจสอบทั้งหมด</h3>
                <button id="addBtn" class="btn-add">
                    <i class="fas fa-plus"></i>
                    เพิ่มรายการ
                </button>
            </div>

            <!-- Items Per Page Selection -->
            <div class="table-controls">
                <div class="items-per-page">
                    <label for="itemsPerPage">แสดง:</label>
                    <select id="itemsPerPage" class="form-select">
                        <option value="5">5 รายการ</option>
                        <option value="10">10 รายการ</option>
                    </select>
                </div>
            </div>

            <!-- Loading State -->
            <div id="loading" class="loading-state">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>

            <!-- Table Container -->
            <div id="tableContainer" class="table-container" style="display: none;">
                <table id="checklistTable" class="checklist-table">
                    <thead>
                        <tr>
                            <th>ลำดับ</th>
                            <th>ชื่อรายการตรวจสอบ</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination-wrapper">
                <div id="paginationInfo" class="pagination-info"></div>
                <div id="pagination" class="pagination-container"></div>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="empty-state" style="display: none;">
                <div class="empty-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h3>ไม่มีรายการตรวจสอบ</h3>
                <p>เริ่มต้นด้วยการเพิ่มรายการใหม่</p>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', content);
}

// เริ่มต้นเมื่อหน้าโหลดเสร็จ
document.addEventListener('DOMContentLoaded', init);
