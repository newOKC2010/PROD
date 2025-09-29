/**
 * Table Utils - จัดการ HTML builders และ formatters
 * แยกออกมาจาก MainTableManager เพื่อให้ clean code
 */

export class TableUtils {
    constructor() {
        this.thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
    }

    /**
     * สร้าง HTML สำหรับตารางหลัก
     */
    createTableHTML(data, currentUser, pagination) {
        if (data.length === 0) {
            return this.createEmptyTableHTML();
        }

        const tableRows = data.map((item, index) => 
            this.createTableRow(item, index, currentUser, pagination)
        ).join('');

        return `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    ${this.createTableHeader()}
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
        `;
    }

    /**
     * สร้าง table header
     */
    createTableHeader() {
        return `
            <thead class="table-dark">
                <tr>
                    <th scope="col" class="text-center">#</th>
                    <th scope="col" class="text-center">ชื่อรถ</th>
                    <th scope="col" class="text-center">วันที่ตรวจสอบ</th>
                    <th scope="col" class="text-center">ผู้ตรวจสอบ</th>
                    <th scope="col" class="text-center">สถานะ</th>
                    <th scope="col" class="text-center">การจัดการ</th>
                </tr>
            </thead>
        `;
    }

    /**
     * สร้าง HTML เมื่อไม่มีข้อมูล
     */
    createEmptyTableHTML() {
        return `
            <div class="text-center py-4">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">ไม่มีข้อมูล</h5>
                <p class="text-muted">ยังไม่มีรายการตรวจสอบในระบบ</p>
            </div>
        `;
    }

    /**
     * สร้างแถวของตาราง
     */
    createTableRow(item, index, currentUser, pagination) {
        const isAdmin = currentUser?.role === 'admin';
        const rowNumber = (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1;
        
        const checkedDate = this.formatThaiDateTime(item.checked_date);
        const checklistItems = this.getChecklistItemsArray(item.checklist_items);
        const { passedItems, totalItems } = this.countChecklistItems(checklistItems);
        const statusBadge = this.getStatusBadge(passedItems, totalItems);
        const actionButtons = this.createActionButtons(item.id, isAdmin);

        return `
            <tr data-checklist-id="${item.id}">
                <th scope="row" class="text-center" style="color: white; background-color: #495057;">${rowNumber}</th>
                <td class="vehicle-name">
                    <strong>${item.vehicle_name || 'ไม่ระบุ'}</strong>
                </td>
                <td class="text-center">${checkedDate}</td>
                <td class="username-cell">
                    <i class="fas fa-user me-1"></i>
                    ${item.username || 'ไม่ระบุ'}
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">${actionButtons}</td>
            </tr>
        `;
    }

    /**
     * สร้างปุ่ม actions
     */
    createActionButtons(itemId, isAdmin) {
        const deleteButton = isAdmin ? `
            <button type="button" class="btn btn-sm btn-outline-danger" 
                    data-action="delete" data-id="${itemId}" 
                    title="ลบ">
                <i class="fas fa-trash"></i>
            </button>
        ` : '';

        return `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-sm btn-outline-info" 
                        data-action="view" data-id="${itemId}" 
                        title="ดูรายละเอียด">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-warning" 
                        data-action="edit" data-id="${itemId}" 
                        title="แก้ไข">
                    <i class="fas fa-edit"></i>
                </button>
                ${deleteButton}
            </div>
        `;
    }

    /**
     * ดึง checklist items จากโครงสร้างข้อมูล
     */
    getChecklistItemsArray(checklistItems) {
        try {
            if (!checklistItems) return [];
            
            if (checklistItems.items && Array.isArray(checklistItems.items)) {
                return checklistItems.items;
            }
            
            if (Array.isArray(checklistItems)) {
                return checklistItems;
            }
            
            if (typeof checklistItems === 'string') {
                const parsed = JSON.parse(checklistItems);
                return this.getChecklistItemsArray(parsed);
            }
            
            console.warn('Unknown checklist_items structure:', checklistItems);
            return [];
        } catch (error) {
            console.error('Error parsing checklist items:', error, checklistItems);
            return [];
        }
    }

    /**
     * นับ checklist items
     */
    countChecklistItems(checklistItems) {
        const totalItems = checklistItems.length;
        const passedItems = checklistItems.filter(item => item.status === true).length;
        return { passedItems, totalItems };
    }

    /**
     * แปลงวันที่เป็นรูปแบบไทย
     */
    formatThaiDateTime(dateTimeString) {
        if (!dateTimeString) return 'ไม่ระบุ';
        
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
        
        const day = date.getDate();
        const month = this.thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543;
        
        return `${day} ${month} ${year}`;
    }

    /**
     * สร้าง badge สำหรับสถานะ
     */
    getStatusBadge(passed, total) {
        if (total === 0) {
            return '<span class="badge bg-secondary">ไม่มีข้อมูล</span>';
        }
        
        const percentage = (passed / total) * 100;
        
        if (percentage === 100) {
            return `<span class="badge bg-success">${passed}/${total} ผ่าน</span>`;
        } else if (percentage >= 75) {
            return `<span class="badge bg-warning">${passed}/${total} ผ่าน</span>`;
        } else {
            return `<span class="badge bg-danger">${passed}/${total} ผ่าน</span>`;
        }
    }
} 