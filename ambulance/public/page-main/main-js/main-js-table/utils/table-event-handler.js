/**
 * Table Event Handler - จัดการ events และ actions
 * แยกออกมาจาก MainTableManager เพื่อให้ clean code
 */

import { getStoredToken, removeToken } from '/global-api.js';
import { showAlert, checkTokenValid, redirectToLogin, getUserData, showLoading, hideLoading } from '/global-auth-status.js';
import { DeleteModalManager } from '/main-modal-delete.js';
import { DeleteSubmitManager } from '/delete-submit.js';

export class TableEventHandler {
    constructor(dataManager, modalManager, updateModalManager, tableManager = null) {
        this.dataManager = dataManager;
        this.modalManager = modalManager;
        this.updateModalManager = updateModalManager;
        this.tableManager = tableManager;
        this.deleteModalManager = new DeleteModalManager();
    }

    /**
     * เพิ่ม Event Listeners สำหรับ action buttons
     */
    attachTableEventListeners(tableContainer) {
        const actionButtons = tableContainer.querySelectorAll('[data-action]');
        
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const id = e.currentTarget.dataset.id;
                
                this.handleAction(action, id);
            });
        });
    }

    /**
     * จัดการ action ต่างๆ
     */
    async handleAction(action, id) {
        const tokenValidation = await this.validateTokenBeforeAction();
        if (!tokenValidation.valid) {
            return;
        }
        
        const item = this.dataManager.findItemById(id);
        if (!item) return;
        
        switch (action) {
            case 'view':
                this.handleView(item);
                break;
            case 'edit':
                this.handleEdit(item);
                break;
            case 'delete':
                await this.handleDelete(item);
                break;
        }
    }

    /**
     * ตรวจสอบ token ก่อนทำการกระทำ
     */
    async validateTokenBeforeAction() {
        const token = getStoredToken();
        const tokenValidation = await checkTokenValid(token);
        
        if (!tokenValidation.valid) {
            alert(tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่');
            removeToken();
            redirectToLogin();
            return { valid: false };
        }
        
        return { valid: true };
    }

    /**
     * จัดการการดูรายละเอียด
     */
    async handleView(item) {
        try {
            showLoading('กำลังโหลดข้อมูลรายละเอียด...');

            if (this.modalManager) {
                await this.modalManager.showViewModal(item);
            } else {
                hideLoading();
                showAlert('ข้อผิดพลาด', 'ระบบดูรายละเอียดยังไม่พร้อมใช้งาน', 'error');
            }

        } catch (error) {
            hideLoading();
            console.error('Error in handleView:', error);
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถแสดงรายละเอียดได้', 'error');
        }
    }

    /**
     * จัดการการแก้ไข
     */
    async handleEdit(item) {
        try {
            showLoading('กำลังโหลดข้อมูลสำหรับแก้ไข...');

            if (this.updateModalManager) {
                await this.updateModalManager.showModal(item);
            } else {
                hideLoading();
                showAlert('ข้อผิดพลาด', 'ระบบแก้ไขยังไม่พร้อมใช้งาน', 'error');
            }

        } catch (error) {
            hideLoading();
            console.error('Error in handleEdit:', error);
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถแก้ไขข้อมูลได้', 'error');
        }
    }

    /**
     * จัดการการลบ
     */
    async handleDelete(item) {
        try {
            showLoading('กำลังโหลดข้อมูลสำหรับลบ...');

            // ตรวจสอบ role แบบ real-time กับ backend
            const token = getStoredToken();
            const realTimeUser = await getUserData(token);
            
            if (!realTimeUser || realTimeUser.role !== 'admin') {
                hideLoading();
                showAlert('ไม่มีสิทธิ์', 'เฉพาะ admin เท่านั้นที่สามารถลบได้', 'error');
                setTimeout(() => window.location.reload(), 1500);
                return;
            }

            // ตรวจสอบสิทธิ์กับ backend ก่อนเปิด modal
            const permission = await DeleteSubmitManager.checkDeletePermission(item.id);
            
            if (!permission.valid) {
                hideLoading();
                DeleteSubmitManager.showErrorMessage(permission.message);
                return;
            }
            
            hideLoading();
            
            this.deleteModalManager.show(item, () => {
                // Callback เมื่อลบสำเร็จ - ลบแถวจาก table แบบ smooth
                if (this.tableManager) {
                    this.tableManager.removeItemFromTable(item.id);
                } else if (window.mainPageFunctions?.refreshTable) {
                    window.mainPageFunctions.refreshTable();
                }
            });

        } catch (error) {
            hideLoading();
            console.error('Error in handleDelete:', error);
            showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบสิทธิ์ได้', 'error');
        }
    }

    /**
     * อัพเดท modal managers
     */
    updateModalManagers(modalManager, updateModalManager) {
        this.modalManager = modalManager;
        this.updateModalManager = updateModalManager;
    }
} 