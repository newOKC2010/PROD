import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';
import { showToast } from '/global-auth-status.js';
import { PaginationManager } from '/global-pagination.js';

// Pagination instance - export ให้ใช้จากข้างนอกได้
export let paginationManager = null;

/**
 * โหลดข้อมูล car
 */
async function loadData() {
    const token = getStoredToken();
    if (!token) return [];

    try {
        const response = await fetch(API_ENDPOINTS.MANAGE_CAR.VIEW, {
            headers: createAuthHeaders(token)
        });
        
        const result = await response.json();
        return result.success ? result.data || [] : [];
    } catch (error) {
        console.error('Load data error:', error);
        showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
        return [];
    }
}

/**
 * สร้างแถวตาราง
 */
function createRow(item, index) {
    return `
        <tr>
            <td class="table-index">${index + 1}</td>
            <td class="table-name">${item.license_plate || 'ไม่ระบุ'}</td>
            <td class="table-actions">
                <div class="action-buttons">
                    <button class="btn-action btn-edit" onclick="editItem(${item.id})" title="แก้ไข">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteItem(${item.id})" title="ลบ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * แสดงข้อมูลในตาราง (สำหรับ pagination)
 */
function renderTable(pageData) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;

    if (pageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">ไม่มีข้อมูลในหน้านี้</td></tr>';
        return;
    }

    // คำนวณ index ที่ถูกต้องสำหรับแต่ละหน้า
    const currentPage = paginationManager ? paginationManager.currentPage : 1;
    const itemsPerPage = paginationManager ? paginationManager.itemsPerPage : 5;
    const startIndex = (currentPage - 1) * itemsPerPage;

    tableBody.innerHTML = pageData.map((item, index) => 
        createRow(item, startIndex + index)
    ).join('');
}

/**
 * แสดงข้อมูลในตาราง
 */
function showTable(data) {
    const loading = document.getElementById('loading');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');

    // ซ่อน loading
    if (loading) {
        loading.style.display = 'none';
    }

    if (data.length === 0) {
        // แสดง empty state
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        
        // ซ่อน pagination
        const paginationWrapper = document.querySelector('.pagination-wrapper');
        if (paginationWrapper) paginationWrapper.style.display = 'none';
    } else {
        // แสดงตาราง
        if (emptyState) emptyState.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
        
        // แสดง pagination
        const paginationWrapper = document.querySelector('.pagination-wrapper');
        if (paginationWrapper) paginationWrapper.style.display = 'block';
    }
}

/**
 * เริ่มต้น pagination
 */
function initPagination(data) {
    const paginationContainer = document.getElementById('pagination');
    const infoContainer = document.getElementById('paginationInfo');
    const itemsPerPageSelect = document.getElementById('itemsPerPage');

    if (!paginationContainer || !infoContainer || !itemsPerPageSelect) {
        console.error('Pagination elements not found');
        return;
    }

    paginationManager = new PaginationManager({
        paginationContainer: paginationContainer,
        infoContainer: infoContainer,
        itemsPerPageSelect: itemsPerPageSelect,
        itemsPerPage: 5,
        onPageChange: (page, pageData) => {
            renderTable(pageData);
        },
        onItemsPerPageChange: (itemsPerPage) => {
            renderTable(paginationManager.getCurrentPageData());
        }
    });

    // อัปเดตข้อมูล
    paginationManager.updateData(data);
}

/**
 * โหลดและแสดงตาราง
 */
export async function loadTable() {
    const data = await loadData();
    showTable(data);
    
    if (data.length > 0) {
        if (!paginationManager) {
            initPagination(data);
        } else {
            paginationManager.updateData(data);
        }
        
        // แสดงข้อมูลหน้าแรก
        renderTable(paginationManager.getCurrentPageData());
    }
}

/**
 * รีเฟรชตาราง (สำหรับใช้หลังจาก add/edit/delete)
 */
export async function refreshTable() {
    await loadTable();
}
