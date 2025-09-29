/**
 * Main Modal Update Manager - จัดการ Modal แก้ไข Checklist
 * Refactored version - ใช้ utility classes และ event manager
 */

import { UpdateContentManager } from './update-content-manager.js';
import { UpdateSubmitManager } from './update-submit-manager.js';
import { UpdateRolePermission } from './update-role-permission.js';
import { UpdateModalUtils } from './update-modal-utils.js';
import { UpdateEventManager } from './update-event-manager.js';
import { showAlert, hideLoading } from '/global-auth-status.js';

export class MainModalUpdate {
    constructor(options = {}) {
        this.currentUser = options.currentUser;
        this.tableManager = options.tableManager; // ส่งมาจาก main-table.js
        this.modalId = 'updateChecklistModal';
        
        // สร้าง managers
        this.contentManager = new UpdateContentManager();
        this.submitManager = new UpdateSubmitManager();
        this.rolePermission = new UpdateRolePermission(this.currentUser);
        this.eventManager = new UpdateEventManager(this);
        
        // ข้อมูลการทำงาน
        this.currentChecklistData = null;
        this.originalData = null; // เก็บข้อมูลเดิมสำหรับเปรียบเทียบ
        
        this.createModal();
    }

    /**
     * สร้าง Modal HTML - ใช้ utility function
     */
    createModal() {
        if (UpdateModalUtils.modalExists(this.modalId)) {
            return;
        }
        
        const modalHTML = UpdateModalUtils.createModalHTML(this.modalId);
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.eventManager.setupMainEventListeners();
    }

    /**
     * ตั้งค่า Event Listeners สำหรับ form elements
     */
    setupFormEventListeners() {
        this.eventManager.setupFormEventListeners();
    }

    /**
     * แสดง Modal พร้อมโหลดข้อมูล (ดึงข้อมูลใหม่จาก server)
     */
    async showModal(checklistData) {
        try {
            // ดึงข้อมูลใหม่จาก server ด้วย utility function
            const freshData = await UpdateModalUtils.fetchFreshData(checklistData.id);

            // แสดง modal
            const modal = new bootstrap.Modal(document.getElementById(this.modalId));
            modal.show();

            // ตั้งค่าข้อมูล
            this.currentChecklistData = freshData;
            this.originalData = UpdateModalUtils.deepCopy(freshData);

            await this.loadContent();
            
            hideLoading();

        } catch (error) {
            console.error('Error:', error);
            UpdateModalUtils.showBackendError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
    }

    /**
     * โหลดเนื้อหาใน Modal
     */
    async loadContent() {
        try {
            UpdateModalUtils.setLoadingState(true);

            // ตั้งค่า callback สำหรับเมื่อ UI เปลี่ยน
            this.contentManager.setUIChangeCallback(() => {
                this.eventManager.setupDeleteButtonEvents();
            });

            // สร้าง form content
            const formHTML = await this.contentManager.createUpdateForm(
                this.currentChecklistData, 
                this.rolePermission
            );

            const contentContainer = document.getElementById('updateModalContent');
            contentContainer.innerHTML = formHTML;

            // ตั้งค่า event listeners สำหรับ form
            this.setupFormEventListeners();

        } catch (error) {
            console.error('Error loading update content:', error);
            UpdateModalUtils.showBackendError(error.message || 'เกิดข้อผิดพลาดในการโหลดเนื้อหา');
        } finally {
            UpdateModalUtils.setLoadingState(false);
        }
    }

    /**
     * จัดการการส่งข้อมูล - ประมวลผลและส่งข้อมูลไปยัง backend
     */
    async handleSubmit() {
        try {
            UpdateModalUtils.setLoadingState(true);

            // รวบรวมข้อมูลที่เปลี่ยนแปลง
            const updateData = this.collectChangedData();

            if (!updateData.hasChanges) {
                showAlert('แจ้งเตือน', 'ไม่มีข้อมูลที่เปลี่ยนแปลง', 'info');
                return;
            }

            // ส่งข้อมูลไป backend
            const result = await this.submitManager.submitUpdate(updateData);

            if (result.success) {
                // อัพเดทแถวในตาราง (ดึงข้อมูลใหม่จาก server)
                await this.updateTableRow(updateData);
                
                this.hideModal();
                showAlert('สำเร็จ', 'แก้ไขข้อมูลสำเร็จ', 'success');
            } else {
                // ใช้ showBackendError สำหรับ error ทุกกรณี
                UpdateModalUtils.showBackendError(result.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
            }

        } catch (error) {
            console.error('Error submitting update:', error);
            UpdateModalUtils.showBackendError('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
        } finally {
            UpdateModalUtils.setLoadingState(false);
        }
    }

    /**
     * รวบรวมข้อมูลที่เปลี่ยนแปลง - เปรียบเทียบข้อมูลเดิมกับใหม่
     */
    collectChangedData() {
        const changes = {
            id: this.currentChecklistData.id,
            items: [],
            photos: {},
            deletePhotos: {},
            hasChanges: false
        };

        // ตรวจสอบการเปลี่ยนแปลงของแต่ละ item
        const items = UpdateModalUtils.getChecklistItems(this.currentChecklistData);
        
        items.forEach((item, index) => {
            const checklistId = item.checklist_id;
            const originalItem = this.originalData.checklist_items.items[index];
            
            const itemChanges = {};
            let hasItemChanges = false;

            // ตรวจสอบ status change (เฉพาะ admin)
            const statusInput = document.querySelector(`input[name="status_${checklistId}"]:checked`);
            if (statusInput && this.rolePermission.canUpdateStatus()) {
                const newStatus = statusInput.value === 'true';
                if (newStatus !== originalItem.status) {
                    itemChanges.status = newStatus;
                    hasItemChanges = true;
                }
            }

            // ตรวจสอบ note change
            const noteInput = document.querySelector(`textarea[name="note_${checklistId}"]`);
            if (noteInput) {
                const newNote = noteInput.value.trim();
                const originalNote = originalItem.note || '';
                if (newNote !== originalNote) {
                    itemChanges.note = newNote;
                    hasItemChanges = true;
                }
            }

            if (hasItemChanges) {
                itemChanges.checklist_id = checklistId;
                changes.items.push(itemChanges);
                changes.hasChanges = true;
            }
        });

        // ตรวจสอบรูปภาพใหม่
        const newPhotoFiles = this.contentManager.getAllNewPhotoFiles();
        if (newPhotoFiles.size > 0) {
            newPhotoFiles.forEach((files, checklistId) => {
                if (files && files.length > 0) {
                    changes.photos[checklistId] = files;
                    changes.hasChanges = true;
                }
            });
        }

        // ตรวจสอบรูปภาพที่ต้องลบ - แปลงเป็นรูปแบบที่ backend ต้องการ
        const deletedPhotos = this.contentManager.getDeletedPhotos();
        if (deletedPhotos.length > 0) {
            // จัดกลุ่มตาม checklist_id
            deletedPhotos.forEach(photoId => {
                const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
                if (photoElement) {
                    const deleteBtn = photoElement.querySelector('.delete-photo-btn');
                    const checklistId = deleteBtn?.dataset.checklistId;
                    
                    if (checklistId) {
                        if (!changes.deletePhotos[checklistId]) {
                            changes.deletePhotos[checklistId] = [];
                        }
                        changes.deletePhotos[checklistId].push(photoId);
                        changes.hasChanges = true;
                    }
                }
            });
        }

        return changes;
    }

    /**
     * อัพเดทแถวในตาราง - ดึงข้อมูลใหม่จาก server และอัพเดท UI
     */
    async updateTableRow(updateData) {
        if (!this.tableManager) return;

        try {
            // ดึงข้อมูลใหม่จาก server ด้วย utility function
            const freshData = await UpdateModalUtils.fetchFreshData(this.currentChecklistData.id);
            
            // อัพเดทข้อมูลใน tableManager
            const dataIndex = this.tableManager.checklistData.findIndex(
                item => item.id === this.currentChecklistData.id
            );

            if (dataIndex >= 0) {
                this.tableManager.checklistData[dataIndex] = freshData;
                
                // อัพเดท filteredData ด้วย
                const filteredIndex = this.tableManager.filteredData.findIndex(
                    item => item.id === this.currentChecklistData.id
                );
                if (filteredIndex >= 0) {
                    this.tableManager.filteredData[filteredIndex] = freshData;
                }
            }

            // เรนเดอร์ตารางใหม่
            this.tableManager.updateTable();

        } catch (error) {
            console.error('Error refreshing table data:', error);
            // หากมีข้อผิดพลาด ใช้วิธีเดิม (อัพเดทใน memory)
            this.updateTableRowInMemory(updateData);
        }
    }

    /**
     * อัพเดทข้อมูลใน memory (fallback method)
     */
    updateTableRowInMemory(updateData) {
        const dataIndex = this.tableManager.checklistData.findIndex(
            item => item.id === this.currentChecklistData.id
        );

        if (dataIndex >= 0) {
            const updatedItem = { ...this.tableManager.checklistData[dataIndex] };
            
            // อัพเดท checklist items
            updateData.items.forEach(change => {
                const itemIndex = updatedItem.checklist_items.items.findIndex(
                    item => item.checklist_id === change.checklist_id
                );
                
                if (itemIndex >= 0) {
                    if (change.status !== undefined) {
                        updatedItem.checklist_items.items[itemIndex].status = change.status;
                    }
                    if (change.note !== undefined) {
                        updatedItem.checklist_items.items[itemIndex].note = change.note;
                    }
                }
            });

            // อัพเดท timestamp
            updatedItem.updated_at = new Date();

            // แทนที่ข้อมูลเดิม  
            this.tableManager.checklistData[dataIndex] = updatedItem;
            this.tableManager.filteredData[dataIndex] = updatedItem;

            // เรนเดอร์ตารางใหม่
            this.tableManager.updateTable();
        }
    }

    /**
     * ซ่อน Modal
     */
    hideModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
        if (modal) {
            modal.hide();
        }
    }

    /**
     * รีเซ็ต Modal - ล้างข้อมูลและ UI elements
     */
    resetModal() {
        this.currentChecklistData = null;
        this.originalData = null;
        
        // รีเซ็ต managers
        this.contentManager.reset();
        this.eventManager.reset();
        
        // ล้างเนื้อหาใน modal
        UpdateModalUtils.clearModalContent();
    }
}
