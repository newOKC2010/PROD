/**
 * Checklist Modal Manager - จัดการ Modal สำหรับแสดงรายละเอียด Checklist
 */

import { getStoredToken } from '/global-api.js';
import { API_ENDPOINTS } from '/global-api.js';
import { ModalContentBuilder } from '/modal-content-builder.js';
import { ModalPrintManager } from '/modal-print-manager.js';
import { hideLoading } from '/global-auth-status.js';

export class ChecklistModalManager {
    constructor(options = {}) {
        this.currentUser = options.currentUser;
        this.modalId = 'checklistViewModal';
        
        // สร้าง instance ของ helper classes
        this.contentBuilder = new ModalContentBuilder();
        this.printManager = new ModalPrintManager();
        
        this.createModal();
    }
    
    /**
     * สร้าง Modal HTML
     */
    createModal() {
        // ตรวจสอบว่ามี modal อยู่แล้วหรือไม่
        if (document.getElementById(this.modalId)) {
            return;
        }
        
        const modalHTML = `
            <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="${this.modalId}Label" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header bg-primary">
                            <h5 class="modal-title text-white" id="${this.modalId}Label">
                                <i class="fas fa-clipboard-list me-2 text-white"></i>
                                รายละเอียดการตรวจสอบรถ
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="modalContent">
                                <!-- Content will be loaded here -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" style="font-weight: bold; background-color:rgb(255, 255, 255); color:rgb(104, 104, 104); border: none;">ปิด</button>
                            <button type="button" class="btn btn-primary" id="printBtn" style="font-weight: bold;">
                                <i class="fas fa-print me-1"></i>พิมพ์
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // เพิ่ม modal เข้าไปใน body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // เพิ่ม event listener สำหรับปุ่มพิมพ์
        this.setupEventListeners();
    }
    
    /**
     * ตั้งค่า Event Listeners
     */
    setupEventListeners() {
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', async () => {
                try {
                    await this.printManager.printModal();
                } catch (error) {
                    console.error('Print error:', error);
                    alert('เกิดข้อผิดพลาดในการพิมพ์ กรุณาลองใหม่');
                }
            });
        }
    }
    
    /**
     * แสดง Modal พร้อมข้อมูล (ตรวจสอบข้อมูลจาก server ก่อน)
     * @param {Object} checklistData - ข้อมูล checklist
     */
    async showViewModal(checklistData) {
        try {
            // ตรวจสอบข้อมูลจาก server ก่อน
            const response = await fetch(`${API_ENDPOINTS.MAIN_CHECK.VIEW}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${getStoredToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const result = await response.json();
                Swal.fire({
                    title: 'ข้อผิดพลาด',
                    text: result.message || 'ไม่สามารถดึงข้อมูลได้',
                    icon: 'error',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    window.location.reload();
                });
                return;
            }

            const result = await response.json();
            if (!result.success) {
                Swal.fire({
                    title: 'ข้อผิดพลาด',
                    text: result.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล',
                    icon: 'error',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    window.location.reload();
                });
                return;
            }

            // หาข้อมูลที่ต้องการ
            const freshData = result.data.find(item => item.id === checklistData.id);
            if (!freshData) {
                Swal.fire({
                    title: 'ข้อมูลถูกลบแล้ว',
                    text: 'ข้อมูลการตรวจสอบนี้ถูกลบไปแล้ว',
                    icon: 'warning',
                    confirmButtonText: 'ตกลง'
                }).then(() => {
                    window.location.reload();
                });
                return;
            }

            // แสดง modal
            const modal = new bootstrap.Modal(document.getElementById(this.modalId));
            modal.show();

            const modalContent = document.getElementById('modalContent');
            modalContent.innerHTML = this.contentBuilder.createModalContent(freshData);
            this.contentBuilder.setupImageEventListeners(modalContent);
            
            hideLoading();

        } catch (error) {
      
            console.error('Error:', error);
            Swal.fire({
                title: 'ข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
                icon: 'error',
                confirmButtonText: 'ตกลง'
            }).then(() => {
                window.location.reload();
            });
        }
    }


    
    /**
     * ปิด Modal
     */
    hideModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
        if (modal) {
            modal.hide();
        }
    }
}
