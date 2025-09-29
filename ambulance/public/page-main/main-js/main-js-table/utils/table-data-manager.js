/**
 * Table Data Manager - จัดการ data operations และ API calls
 * แยกออกมาจาก MainTableManager เพื่อให้ clean code
 */

import { API_ENDPOINTS, createAuthHeaders, removeToken, getStoredToken } from '/global-api.js';
import { showAlert, showToast, checkTokenValid, redirectToLogin } from '/global-auth-status.js';

export class TableDataManager {
    constructor() {
        this.checklistData = [];
        this.filteredData = [];
    }

    /**
     * โหลดข้อมูล checklist จาก API
     */
    async loadChecklistData() {
        try {
            const token = getStoredToken();
            
            const tokenValidation = await this.validateToken(token);
            if (!tokenValidation.valid) {
                await showAlert(
                    'หมดอายุการเข้าสู่ระบบ', 
                    tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่', 
                    'warning'
                );
                removeToken();
                redirectToLogin();
                return { success: false };
            }
            
            const response = await fetch(API_ENDPOINTS.MAIN_CHECK.VIEW, {
                method: 'GET',
                headers: createAuthHeaders(token)
            });
            
            return await this.processResponse(response);
            
        } catch (error) {
            console.error('Load checklist error:', error);
            showAlert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
            return { success: false };
        }
    }

    /**
     * ประมวลผล response จาก API
     */
    async processResponse(response) {
        if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
                this.checklistData = result.data;
                this.filteredData = [...this.checklistData];
                showToast('โหลดข้อมูลสำเร็จ', 'success');
                return { success: true, data: this.checklistData };
            } else {
                showAlert('ข้อผิดพลาด', result.message || 'ไม่สามารถโหลดข้อมูลได้', 'error');
                return { success: false };
            }
        } else {
            showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error');
            return { success: false };
        }
    }

    /**
     * ตรวจสอบ token
     */
    async validateToken(token = null) {
        // ถ้าไม่มี token ส่งเข้ามา ให้ดึงจาก localStorage
        const tokenToValidate = token || getStoredToken();
        
        if (!tokenToValidate) {
            console.error('❌ Token ไม่พบใน localStorage หรือไม่ได้ส่งเข้ามา');
            return { 
                valid: false, 
                message: 'ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่' 
            };
        }
        
        return await checkTokenValid(tokenToValidate);
    }

    /**
     * อัพเดทแถวเดียวในตาราง
     */
    updateTableRow(checklistId, updatedData) {
        try {
            const dataIndex = this.checklistData.findIndex(item => item.id === checklistId);
            const filteredIndex = this.filteredData.findIndex(item => item.id === checklistId);

            if (dataIndex >= 0) {
                this.checklistData[dataIndex] = { ...this.checklistData[dataIndex], ...updatedData };
                
                if (filteredIndex >= 0) {
                    this.filteredData[filteredIndex] = { ...this.filteredData[filteredIndex], ...updatedData };
                }

                console.log('Table row updated successfully');
                return true;
            } else {
                console.warn('Checklist item not found for update:', checklistId);
                return false;
            }
        } catch (error) {
            console.error('Error updating table row:', error);
            return false;
        }
    }

    /**
     * ค้นหาข้อมูลตาม ID
     */
    findItemById(id) {
        return this.checklistData.find(item => item.id.toString() === id);
    }

    /**
     * ดึงข้อมูลทั้งหมด
     */
    getAllData() {
        return {
            checklistData: this.checklistData,
            filteredData: this.filteredData
        };
    }

    /**
     * ตั้งค่าข้อมูลที่กรองแล้ว
     */
    setFilteredData(filteredData) {
        this.filteredData = filteredData;
    }

    /**
     * รีเซ็ตข้อมูล
     */
    resetData() {
        this.checklistData = [];
        this.filteredData = [];
    }

    /**
     * ตรวจสอบว่ามีข้อมูลหรือไม่
     */
    hasData() {
        return this.checklistData.length > 0;
    }

    /**
     * ดึงสถิติข้อมูล
     */
    getDataStats() {
        return {
            total: this.checklistData.length,
            filtered: this.filteredData.length
        };
    }

    /**
     * ลบข้อมูล item ตาม ID
     */
    removeItemById(itemId) {
        try {
            const dataIndex = this.checklistData.findIndex(item => item.id == itemId);
            const filteredIndex = this.filteredData.findIndex(item => item.id == itemId);

            let removed = false;

            if (dataIndex >= 0) {
                this.checklistData.splice(dataIndex, 1);
                removed = true;
            }

            if (filteredIndex >= 0) {
                this.filteredData.splice(filteredIndex, 1);
                removed = true;
            }

            if (!removed) {
                console.warn('Item not found for removal:', itemId);
            }

            return removed;
        } catch (error) {
            console.error('Error removing item:', error);
            return false;
        }
    }
} 