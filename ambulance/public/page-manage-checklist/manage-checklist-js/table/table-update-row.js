import { refreshTable, paginationManager } from '/table-contents.js';

/**
 * อัปเดตแถวเดียวในตาราง (หลังจาก edit)
 */
export function updateTableRow(id, updatedData) {
    try {
        // อัปเดตข้อมูลใน pagination manager โดยไม่ re-render
        if (paginationManager) {
            updatePaginationData(id, updatedData);
        }

        // หาแถวที่ต้องการอัปเดต
        const row = document.querySelector(`button[onclick="editItem(${id})"]`)?.closest('tr');
        if (!row) {
            console.warn(`Row with ID ${id} not found`);
            return;
        }

        // อัปเดตชื่อในตาราง
        const nameCell = row.querySelector('.table-name');
        if (nameCell && updatedData.name) {
            nameCell.textContent = updatedData.name;
            
            // เพิ่ม effect highlight เพื่อแสดงว่าได้อัปเดตแล้ว
            nameCell.style.backgroundColor = '#d4edda';
            nameCell.style.transition = 'background-color 0.5s ease';
            
            // ลบ highlight หลังจาก 2 วินาที
            setTimeout(() => {
                nameCell.style.backgroundColor = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Error updating table row:', error);
    }
}

/**
 * อัปเดตข้อมูลใน pagination manager โดยไม่ re-render
 */
function updatePaginationData(id, updatedData) {
    // อัปเดตใน data array
    const dataIndex = paginationManager.data.findIndex(item => item.id == id);
    if (dataIndex !== -1) {
        paginationManager.data[dataIndex] = { ...paginationManager.data[dataIndex], ...updatedData };
    }
    
    // อัปเดตใน filteredData array
    const filteredIndex = paginationManager.filteredData.findIndex(item => item.id == id);
    if (filteredIndex !== -1) {
        paginationManager.filteredData[filteredIndex] = { ...paginationManager.filteredData[filteredIndex], ...updatedData };
    }
}

/**
 * ลบแถวจากตาราง (หลังจาก delete)
 */
export function removeTableRow(id) {
    try {
        // ลบข้อมูลจาก pagination manager
        if (paginationManager) {
            paginationManager.removeDataById(id);
        }

        // หาแถวที่ต้องการลบ
        const row = document.querySelector(`button[onclick="deleteItem(${id})"]`)?.closest('tr');
        if (row) {
            // เพิ่ม animation ก่อนลบ
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            row.style.transform = 'translateX(-100%)';
            
            setTimeout(() => {
                row.remove();
                updateTableAfterDelete();
            }, 300);
        } else {
            // ถ้าไม่เจอแถว ให้อัปเดตการแสดงผลใหม่
            updateTableAfterDelete();
        }
    } catch (error) {
        console.error('Error removing table row:', error);
    }
}

/**
 * อัปเดตตารางหลังจากลบข้อมูล
 */
function updateTableAfterDelete() {
    if (!paginationManager) return;

    // ตรวจสอบว่าหน้าปัจจุบันยังมีข้อมูลหรือไม่
    const currentPageData = paginationManager.getCurrentPageData();
    
    if (currentPageData.length === 0 && paginationManager.currentPage > 1) {
        // ถ้าหน้าปัจจุบันไม่มีข้อมูล ให้ไปหน้าก่อนหน้า
        paginationManager.goToPreviousPage();
    } else {
        // แสดงข้อมูลใหม่
        renderCurrentPage();
    }

    // จัดการการแสดง empty state
    handleEmptyState();
}

/**
 * แสดงข้อมูลหน้าปัจจุบัน
 */
function renderCurrentPage() {
    const currentPageData = paginationManager.getCurrentPageData();
    const tableBody = document.getElementById('tableBody');
    
    if (!tableBody) return;

    if (currentPageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">ไม่มีข้อมูลในหน้านี้</td></tr>';
        return;
    }

    // คำนวณ index ที่ถูกต้อง
    const currentPage = paginationManager.currentPage;
    const itemsPerPage = paginationManager.itemsPerPage;
    const startIndex = (currentPage - 1) * itemsPerPage;

    tableBody.innerHTML = currentPageData.map((item, index) => 
        createTableRow(item, startIndex + index)
    ).join('');
}

/**
 * สร้างแถวตาราง
 */
function createTableRow(item, index) {
    return `
        <tr>
            <td class="table-index">${index + 1}</td>
            <td class="table-name">${item.name}</td>
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
 * จัดการการแสดง empty state
 */
function handleEmptyState() {
    const totalItems = paginationManager.totalItems;
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const paginationWrapper = document.querySelector('.pagination-wrapper');

    if (totalItems === 0) {
        // แสดง empty state
        if (tableContainer) tableContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (paginationWrapper) paginationWrapper.style.display = 'none';
    } else {
        // แสดงตาราง
        if (emptyState) emptyState.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
        if (paginationWrapper) paginationWrapper.style.display = 'block';
    }
}

/**
 * เพิ่มแถวใหม่ในตาราง (หลังจาก add)
 */
export function addTableRow(newData) {
    refreshTable();
}
