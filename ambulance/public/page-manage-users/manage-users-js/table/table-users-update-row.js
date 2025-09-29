// Table Users Update Row - จัดการการอัพเดทแถวในตาราง

import { handleDeleteClick, handleRoleChange, handleStatusToggle } from '/table-users-submit.js';

// ติดตั้ง Event Listeners สำหรับแถวในตาราง
export function setupRowEventListeners(row, callbacks = {}) {
    // ปุ่มลบ
    const deleteButton = row.querySelector('.btn-delete');
    if (deleteButton) {
        deleteButton.addEventListener('click', async (event) => {
            await handleDeleteClick(event, callbacks.onDeleteSuccess);
        });
    }
    
    // Role dropdown
    const roleSelect = row.querySelector('.role-select');
    if (roleSelect) {
        // เก็บค่าเดิมไว้
        roleSelect.dataset.originalValue = roleSelect.value;
        
        roleSelect.addEventListener('change', async (event) => {
            await handleRoleChange(event, callbacks.onUpdateSuccess);
        });
    }
    
    // Status toggle
    const statusToggle = row.querySelector('.status-toggle');
    if (statusToggle) {
        statusToggle.addEventListener('click', async (event) => {
            await handleStatusToggle(event, callbacks.onUpdateSuccess);
        });
    }
}

// ติดตั้ง Event Listeners สำหรับทั้งตาราง
export function setupTableEventListeners(callbacks = {}) {
    const tableBody = document.getElementById('users-table-body');
    
    if (!tableBody) return;
    
    // ใช้ Event Delegation เพื่อจัดการ events ของแถวทั้งหมด
    tableBody.addEventListener('click', async (event) => {
        // ปุ่มลบ
        if (event.target.closest('.btn-delete')) {
            await handleDeleteClick(event, callbacks.onDeleteSuccess);
        }
        
        // Status toggle
        if (event.target.closest('.status-toggle')) {
            await handleStatusToggle(event, callbacks.onUpdateSuccess);
        }
    });
    
    // Role dropdown change
    tableBody.addEventListener('change', async (event) => {
        if (event.target.classList.contains('role-select')) {
            await handleRoleChange(event, callbacks.onUpdateSuccess);
        }
    });
}

// อัพเดทข้อมูลในแถวหลังจากการเปลี่ยนแปลง
export function updateRowData(userId, newData) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) return;
    
    // อัพเดท role
    if (newData.role !== undefined) {
        const roleSelect = row.querySelector('.role-select');
        if (roleSelect) {
            roleSelect.value = newData.role;
            roleSelect.className = `role-select ${newData.role}`;
            roleSelect.dataset.originalValue = newData.role;
        }
    }
    
    // อัพเดท status
    if (newData.users_active !== undefined) {
        const statusToggle = row.querySelector('.status-toggle');
        if (statusToggle) {
            if (newData.users_active) {
                statusToggle.classList.add('active');
            } else {
                statusToggle.classList.remove('active');
            }
        }
    }
    
    // อัพเดท username
    if (newData.username !== undefined) {
        const usernameSpan = row.querySelector('.username');
        if (usernameSpan) {
            usernameSpan.textContent = newData.username || 'ไม่ระบุ';
        }
    }
    
    // อัพเดท email
    if (newData.email !== undefined) {
        const emailSpan = row.querySelector('.email');
        if (emailSpan) {
            emailSpan.textContent = newData.email || 'ไม่ระบุ';
        }
    }
}

// ลบแถวจากตาราง
export function removeRow(userId) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
        row.remove();
        
        // ตรวจสอบว่าตารางว่างหรือไม่
        const tableBody = document.getElementById('users-table-body');
        const noDataDiv = document.getElementById('no-data');
        
        if (tableBody && tableBody.children.length === 0) {
            noDataDiv.style.display = 'block';
        }
    }
}

// เพิ่มแถวใหม่ลงในตาราง
export function addRow(user, callbacks = {}) {
    const tableBody = document.getElementById('users-table-body');
    const noDataDiv = document.getElementById('no-data');
    
    if (!tableBody) return;
    
    // ซ่อน no-data div
    if (noDataDiv) {
        noDataDiv.style.display = 'none';
    }
    
    // สร้างแถวใหม่
    const index = tableBody.children.length;
    const row = document.createElement('tr');
    row.dataset.userId = user.id;
    
    row.innerHTML = `
        <td>
            <span class="row-number">${index + 1}</span>
        </td>
        <td>
            <span class="username">${user.username || 'ไม่ระบุ'}</span>
        </td>
        <td>
            <span class="email">${user.email || 'ไม่ระบุ'}</span>
        </td>
        <td>
            <select class="role-select ${user.role || 'user'}" data-user-id="${user.id}">
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
        </td>
        <td>
            <span class="status-toggle ${user.users_active ? 'active' : ''}" 
                  data-user-id="${user.id}"></span>
        </td>
        <td>
            <div class="action-buttons">
                <button class="btn-delete" data-user-id="${user.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    tableBody.appendChild(row);
    
    // ติดตั้ง Event Listeners สำหรับแถวใหม่
    setupRowEventListeners(row, callbacks);
    
    return row;
}
