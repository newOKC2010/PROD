/**
 * Update Modal Utilities - Clean code version
 * เฉพาะ methods ที่จำเป็นเท่านั้น
 */

import { API_ENDPOINTS } from '/global-api.js';
import { getStoredToken } from '/global-api.js';

export class UpdateModalUtils {
    /**
     * สร้าง Modal HTML structure
     */
    static createModalHTML(modalId) {
        return `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title text-dark" id="${modalId}Label">
                                <i class="fas fa-edit me-2"></i>
                                แก้ไขการตรวจสอบรถ
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="updateLoadingIndicator" class="text-center py-4" style="display: none;">
                                <div class="spinner-border text-warning" role="status">
                                    <span class="visually-hidden">กำลังโหลด...</span>
                                </div>
                                <p class="mt-2">กำลังโหลดข้อมูล...</p>
                            </div>
                            <div id="updateModalContent">
                                <!-- Content will be loaded here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" style="font-weight: bold; background-color:rgb(255, 255, 255); color:rgb(104, 104, 104); border: none;">ยกเลิก</button>
                            <button type="button" class="btn btn-warning" id="updateSubmitBtn">
                                <i class="fas fa-save me-1"></i>บันทึกการแก้ไข
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ดึงข้อมูลใหม่จาก server
     */
    static async fetchFreshData(checklistId) {
        const response = await fetch(`${API_ENDPOINTS.MAIN_CHECK.VIEW}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'ไม่สามารถดึงข้อมูลได้');
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        }

        const freshData = result.data.find(item => item.id === checklistId);
        if (!freshData) {
            throw new Error('ข้อมูลการตรวจสอบนี้ถูกลบไปแล้ว ไม่สามารถแก้ไขได้');
        }

        return freshData;
    }

    /**
     * แสดง error จาก backend และ reload หน้าเว็บเมื่อปิด
     */
    static showBackendError(message) {
        Swal.fire({
            title: 'ข้อผิดพลาด',
            text: message,
            icon: 'error',
            confirmButtonText: 'ตกลง'
        }).then(() => {
            window.location.reload();
        });
    }

    /**
     * ตั้งค่าสถานะ loading ของ modal
     */
    static setLoadingState(loading) {
        const loadingIndicator = document.getElementById('updateLoadingIndicator');
        const submitBtn = document.getElementById('updateSubmitBtn');

        if (loadingIndicator) {
            loadingIndicator.style.display = loading ? 'block' : 'none';
        }

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.innerHTML = loading ? 
                '<i class="fas fa-spinner fa-spin me-1"></i>กำลังบันทึก...' :
                '<i class="fas fa-save me-1"></i>บันทึกการแก้ไข';
        }
    }

    /**
     * ตรวจสอบว่า modal element มีอยู่หรือไม่
     */
    static modalExists(modalId) {
        return !!document.getElementById(modalId);
    }

    /**
     * สำเนาข้อมูลแบบ deep copy
     */
    static deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * ดึง checklist items จากข้อมูล
     */
    static getChecklistItems(checklistData) {
        try {
            if (checklistData?.checklist_items?.items) {
                return checklistData.checklist_items.items;
            }
            return [];
        } catch (error) {
            console.error('Error getting checklist items:', error);
            return [];
        }
    }

    /**
     * แปลงวันที่เป็นรูปแบบไทย
     */
    static formatThaiDate(dateString) {
        if (!dateString) return 'ไม่ระบุ';
        
        try {
            const date = new Date(dateString);
            const thaiMonths = [
                'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
            ];
            
            const day = date.getDate();
            const month = thaiMonths[date.getMonth()];
            const year = date.getFullYear() + 543;
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            return `${day} ${month} ${year} เวลา ${hours}:${minutes}`;
        } catch (error) {
            return 'รูปแบบวันที่ไม่ถูกต้อง';
        }
    }

    /**
     * ล้างเนื้อหาใน modal content
     */
    static clearModalContent(contentId = 'updateModalContent') {
        const contentContainer = document.getElementById(contentId);
        if (contentContainer) {
            contentContainer.innerHTML = '';
        }
    }
} 