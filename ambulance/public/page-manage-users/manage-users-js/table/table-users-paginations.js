// Table Users Paginations - จัดการระบบแบ่งหน้า

import { PaginationManager } from '/global-pagination.js';
import { createUserRow } from '/table-users-contents.js';
import { setupRowEventListeners } from '/table-users-update-row.js';

export class UsersPaginationManager {
    constructor() {
        this.pagination = null;
        this.allUsers = [];
        this.callbacks = {};
        this.init();
    }

    init() {
        this.pagination = new PaginationManager({
            tableContainer: document.getElementById('users-table-body'),
            paginationContainer: document.getElementById('pagination-container'),
            infoContainer: document.getElementById('pagination-info'),
            itemsPerPageSelect: document.getElementById('items-per-page'),
            itemsPerPage: 5,
            onPageChange: (page, data) => this.renderUsers(data),
            onItemsPerPageChange: (itemsPerPage) => this.renderUsers(this.pagination.getCurrentPageData())
        });
    }

    // อัพเดทข้อมูลผู้ใช้
    updateUsers(users) {
        this.allUsers = users;
        this.pagination.updateData(users);
        this.renderUsers(this.pagination.getCurrentPageData());
    }

    // แสดงผู้ใช้ในตาราง
    renderUsers(users) {
        const tableBody = document.getElementById('users-table-body');
        const noDataDiv = document.getElementById('no-data');
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = '';
            noDataDiv.style.display = 'block';
            return;
        }

        noDataDiv.style.display = 'none';
        tableBody.innerHTML = '';

        const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;

        users.forEach((user, index) => {
            const row = createUserRow(user, startIndex + index);
            setupRowEventListeners(row, this.callbacks);
            tableBody.appendChild(row);
        });
    }

    // ลบผู้ใช้
    removeUser(userId) {
        this.allUsers = this.allUsers.filter(user => user.id !== userId);
        this.pagination.removeDataById(userId);
        this.renderUsers(this.pagination.getCurrentPageData());
    }

    // ตั้งค่า callbacks
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    // ดึงข้อมูลปัจจุบัน
    getCurrentUsers() {
        return this.pagination.getCurrentPageData();
    }
}
