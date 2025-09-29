/**
 * Update Event Manager - จัดการ events ทั้งหมดสำหรับ Update Modal
 * รวมการจัดการ form events, photo events, และ modal events
 */

export class UpdateEventManager {
    constructor(modalInstance) {
        this.modal = modalInstance;
        this.photoPreviewEventSetup = false;
    }

    /**
     * ตั้งค่า event listeners หลักสำหรับ modal
     */
    setupMainEventListeners() {
        this.setupSubmitButtonEvent();
        this.setupModalEvents();
    }

    /**
     * ตั้งค่า event listener สำหรับปุ่ม submit
     */
    setupSubmitButtonEvent() {
        const submitBtn = document.getElementById('updateSubmitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.modal.handleSubmit();
            });
        }
    }

    /**
     * ตั้งค่า event listeners สำหรับ modal lifecycle
     */
    setupModalEvents() {
        const modalElement = document.getElementById(this.modal.modalId);
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', () => {
                this.modal.resetModal();
            });
        }
    }

    /**
     * ตั้งค่า event listeners สำหรับ form elements
     */
    setupFormEventListeners() {
        this.setupPhotoUploadEvents();
        this.setupDeleteButtonEvents();
        this.setupPhotoPreviewEvents();
        this.setupStatusChangeEvents();
        this.setupNoteChangeEvents();
    }

    /**
     * ตั้งค่า event listeners สำหรับ photo upload
     */
    setupPhotoUploadEvents() {
        const photoInputs = document.querySelectorAll('.update-photo-input');
        photoInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handlePhotoUpload(e);
            });
        });
    }

    /**
     * ตั้งค่า event listeners สำหรับปุ่มลบรูปภาพเดิม
     */
    setupDeleteButtonEvents() {
        const deleteButtons = document.querySelectorAll('.delete-photo-btn');
        deleteButtons.forEach(btn => {
            // ลบ event listener เดิมทั้งหมด
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // เพิ่ม event listener ใหม่
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const photoId = newBtn.dataset.photoId;
                const checklistId = newBtn.dataset.checklistId;
                
                if (newBtn.classList.contains('btn-warning')) {
                    // ถ้ากำลังจะ undo
                    this.modal.contentManager.undoPhotoDelete(photoId);
                } else {
                    // ถ้ากำลังจะลบ
                    this.modal.contentManager.handlePhotoDelete(photoId, checklistId);
                }
            }, { once: false });
        });
    }

    /**
     * ตั้งค่า event listeners สำหรับ photo preview (รูปใหม่)
     */
    setupPhotoPreviewEvents() {
        // ใช้ event delegation แต่ป้องกัน duplicate
        if (!this.photoPreviewEventSetup) {
            document.addEventListener('click', (e) => {
                if (e.target.closest('.photo-preview-remove')) {
                    this.handlePhotoPreviewRemove(e);
                }
            });
            this.photoPreviewEventSetup = true;
        }
    }

    /**
     * จัดการการลบ photo preview
     * @param {Event} e - event object
     */
    handlePhotoPreviewRemove(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = e.target.closest('.photo-preview-remove');
        
        // ป้องกันการคลิกซ้ำ
        if (btn.disabled || btn.dataset.processing === 'true') {
            return;
        }
        
        const checklistId = btn.dataset.checklistId;
        const index = parseInt(btn.dataset.index);

        // ทำเครื่องหมายว่ากำลังประมวลผล
        btn.dataset.processing = 'true';
        btn.disabled = true;

        this.modal.contentManager.removePhotoPreview(checklistId, index);
        
        // รีเซ็ตสถานะหลังจากประมวลผลเสร็จ
        setTimeout(() => {
            if (btn.parentNode) {
                btn.dataset.processing = 'false';
                btn.disabled = false;
            }
        }, 100);
    }

    /**
     * ตั้งค่า event listeners สำหรับการเปลี่ยน status
     */
    setupStatusChangeEvents() {
        const statusInputs = document.querySelectorAll('.status-radio-input');
        statusInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleStatusChange(e);
            });
        });
    }

    /**
     * ตั้งค่า event listeners สำหรับการเปลี่ยน note
     */
    setupNoteChangeEvents() {
        const noteInputs = document.querySelectorAll('.note-textarea');
        noteInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleNoteChange(e);
            });
        });
    }

    /**
     * จัดการ photo upload event
     * @param {Event} event - upload event
     */
    handlePhotoUpload(event) {
        const input = event.target;
        const checklistId = input.dataset.checklistId;
        
        this.modal.contentManager.handlePhotoUpload(input, checklistId);
    }

    /**
     * จัดการ status change event
     * @param {Event} event - change event
     */
    handleStatusChange(event) {
        // Status changes จะถูก collect ใน handleSubmit()
        // ไม่ต้องทำอะไรเพิ่มเติมที่นี่
    }

    /**
     * จัดการ note change event
     * @param {Event} event - input event
     */
    handleNoteChange(event) {
        // Note changes จะถูก collect ใน handleSubmit()
        // ไม่ต้องทำอะไรเพิ่มเติมที่นี่
    }

    /**
     * ล้าง event listeners ทั้งหมด
     */
    cleanup() {
        // Reset photo preview event setup flag
        this.photoPreviewEventSetup = false;
        
        // ล้าง photo elements
        const previewContainers = document.querySelectorAll('[id^="preview_"]');
        previewContainers.forEach(container => {
            if (container.parentNode) {
                container.innerHTML = '';
            }
        });
        
        const photoInputs = document.querySelectorAll('.update-photo-input');
        photoInputs.forEach(input => {
            if (input.parentNode) {
                input.value = '';
                input.files = null;
            }
        });
    }

    /**
     * รีเซ็ต event manager สำหรับการใช้งานครั้งใหม่
     */
    reset() {
        this.cleanup();
    }
} 