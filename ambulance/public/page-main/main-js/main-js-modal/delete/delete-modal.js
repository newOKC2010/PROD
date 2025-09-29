/**
 * Delete Modal Controller - จัดการการแสดง/ซ่อน modal และ events
 */

export class DeleteModalController {
    constructor() {
        this.modal = null;
        this.onConfirm = null;
    }

    /**
     * เริ่มต้น modal
     */
    init() {
        this.modal = document.getElementById('deleteModal');
        this.bindEvents();
    }

    /**
     * ผูก events
     */
    bindEvents() {
        const cancelBtn = document.getElementById('deleteCancelBtn');
        const confirmBtn = document.getElementById('deleteConfirmBtn');

        // ปิด modal เมื่อคลิกพื้นหลัง
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });

        // ปุ่มยกเลิก
        cancelBtn.addEventListener('click', () => this.hide());

        // ปุ่มยืนยันลบ
        confirmBtn.addEventListener('click', () => {
            if (this.onConfirm) this.onConfirm();
        });
    }

    /**
     * แสดง modal
     */
    show(onConfirmCallback) {
        this.onConfirm = onConfirmCallback;
        this.modal.style.display = 'block';
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
    }

    /**
     * ซ่อน modal
     */
    hide() {
        this.modal.classList.remove('show');
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.onConfirm = null;
        }, 300);
    }

    /**
     * ตั้งค่าสถานะ loading
     */
    setLoading(loading) {
        const confirmBtn = document.getElementById('deleteConfirmBtn');
        confirmBtn.disabled = loading;
        confirmBtn.textContent = loading ? 'กำลังลบ...' : 'ลบ';
    }
}
