/**
 * Delete Modal Manager - ไฟล์หลักจัดการ modal สำหรับการลบ
 * รวมทุก components เข้าด้วยกัน
 */

import { DeleteContentBuilder } from './delete-contents.js';
import { DeleteModalController } from './delete-modal.js';
import { DeleteSubmitManager } from './delete-submit.js';

export class DeleteModalManager {
    constructor() {
        this.currentItem = null;
        this.onDeleteSuccess = null;
        this.modalController = new DeleteModalController();
        this.createModal();
    }

    /**
     * สร้าง modal HTML
     */
    createModal() {
        const modalHTML = DeleteContentBuilder.createModalHTML();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalController.init();
    }

    /**
     * แสดง modal
     */
    show(item, onSuccess) {
        this.currentItem = item;
        this.onDeleteSuccess = onSuccess;

        // อัปเดตข้อมูล
        DeleteContentBuilder.updateContent(item);

        // แสดง modal
        this.modalController.show(() => this.confirmDelete());
    }

    /**
     * ซ่อน modal
     */
    hide() {
        this.modalController.hide();
        this.currentItem = null;
        this.onDeleteSuccess = null;
    }

    /**
     * ยืนยันการลบ
     */
    async confirmDelete() {
        if (!this.currentItem) return;

        this.modalController.setLoading(true);

        try {
            const result = await DeleteSubmitManager.deleteItem(this.currentItem.id);

            if (result.success) {
                // เก็บ callback และ itemId ก่อนที่จะ hide
                const successCallback = this.onDeleteSuccess;
                
                DeleteSubmitManager.showSuccessMessage();
                
                // เรียก callback ก่อน (ขณะที่ยังมีข้อมูล)
                if (successCallback) successCallback();
                
                // ปิด modal หลังจาก callback เสร็จแล้ว
                this.hide();
            } else {
                DeleteSubmitManager.showErrorMessage(result.message);
            }
        } catch (error) {  
            DeleteSubmitManager.showErrorMessage('เกิดข้อผิดพลาดในการลบ');
        } finally {
            this.modalController.setLoading(false);
        }
    }
} 