// Table Users Contents - จัดการการแสดงข้อมูลในตาราง

import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';

// ดึงข้อมูลผู้ใช้จาก API
export async function fetchUsers() {
    try {
        const token = getStoredToken();
        if (!token) {
            throw new Error('ไม่พบ token การเข้าสู่ระบบ');
        }

        const response = await fetch(API_ENDPOINTS.MANAGE_USER.VIEW, {
            method: 'GET',
            headers: createAuthHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.data || [];
        } else {
            throw new Error(result.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

// สร้าง HTML row สำหรับแต่ละผู้ใช้
export function createUserRow(user, index) {
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
    
    return row;
}

// แสดงข้อมูลในตาราง (สำหรับใช้โดยตรงหากไม่มี pagination)
export function displayUsers(users) {
    const tableBody = document.getElementById('users-table-body');
    const noDataDiv = document.getElementById('no-data');
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '';
        noDataDiv.style.display = 'block';
        return;
    }
    
    noDataDiv.style.display = 'none';
    tableBody.innerHTML = '';
    
    users.forEach((user, index) => {
        const row = createUserRow(user, index);
        tableBody.appendChild(row);
    });
}

// แสดง error message
export function showError(message) {
    const tableBody = document.getElementById('users-table-body');
    const noDataDiv = document.getElementById('no-data');
    
    tableBody.innerHTML = '';
    noDataDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p style="color: #dc3545;">${message}</p>
    `;
    noDataDiv.style.display = 'block';
}

// โหลดข้อมูลและส่งไปยัง pagination
export async function loadAndDisplayUsers() {
    try {
        const users = await fetchUsers();
        
        // ส่งข้อมูลไปยัง pagination
        if (window.updateUsersData) {
            window.updateUsersData(users);
        } else {
            // fallback หากไม่มี pagination
            displayUsers(users);
        }
    } catch (error) {
        showError(error.message);
    }
}
