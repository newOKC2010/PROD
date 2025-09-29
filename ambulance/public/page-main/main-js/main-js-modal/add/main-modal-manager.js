/**
 * Modal Manager - จัดการการแสดงผลและสถานะของ Modal
 */

export class ModalManager {
    constructor() {
        this.modal = null;
        this.isLoading = false;
        this.formBuilder = null; // เก็บ reference ของ formBuilder
    }

    /**
     * สร้าง HTML สำหรับ Modal
     */
    createModalHTML() {
        const modalHTML = `
            <div class="modal fade" id="addChecklistModal" tabindex="-1" aria-hidden="true" 
                 data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header" style="background-color: #98ec77;">
                            <h5 class="modal-title text-white">
                                <i class="fas fa-plus-circle me-2 text-white"></i>
                                เพิ่มการตรวจสอบใหม่
                            </h5>
                            <button type="button" class="btn-close" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="modal-add-container" id="addModalContainer">
                                <!-- Loading State -->
                                <div id="addModalLoading" class="text-center py-5">
                                    <div class="spinner-border" style="color: #98ec77;" role="status">
                                        <span class="visually-hidden">กำลังโหลด...</span>
                                    </div>
                                    <div class="mt-2">กำลังโหลดข้อมูล...</div>
                                </div>
                                
                                <!-- Form Content -->
                                <div id="addModalContent" style="display: none;">
                                    <!-- Form จะถูกสร้างโดย FormBuilder -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // เพิ่ม Modal เข้าไปใน body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // สร้าง Bootstrap Modal instance พร้อมป้องกันการปิดโดยไม่ได้ตั้งใจ
        this.modal = new bootstrap.Modal(document.getElementById('addChecklistModal'), {
            backdrop: 'static',  // ป้องกันการปิดเมื่อกดพื้นหลัง
            keyboard: false      // ป้องกันการปิดเมื่อกด ESC
        });
    }

    /**
     * แสดง Modal
     */
    async showModal() {
        if (this.modal) {
            this.modal.show();
        }
    }

    /**
     * ซ่อน Modal
     */
    hideModal() {
        if (this.modal) {
            this.modal.hide();
            // Clear รูปภาพเมื่อปิด modal
            this.clearPhotoData();
        }
    }

    /**
     * ตั้งค่าสถานะ Loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        const submitBtn = document.getElementById('submitAddForm');
        const loadingElement = document.getElementById('addModalLoading');
        const contentElement = document.getElementById('addModalContent');
        
        if (loading) {
            if (submitBtn) submitBtn.disabled = true;
            if (loadingElement) loadingElement.style.display = 'block';
            if (contentElement) contentElement.style.display = 'none';
        } else {
            if (submitBtn) submitBtn.disabled = false;
            if (loadingElement) loadingElement.style.display = 'none';
            if (contentElement) contentElement.style.display = 'block';
        }
    }

    /**
     * แสดง Form ใน Modal
     */
    displayForm(formHTML) {
        const container = document.getElementById('addModalContent');
        container.innerHTML = formHTML;
        container.style.display = 'block';
    }

    /**
     * รีเซ็ต Modal
     */
    resetModal() {
        const container = document.getElementById('addModalContent');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
        
        // แสดง Loading state
        const loading = document.getElementById('addModalLoading');
        if (loading) {
            loading.style.display = 'block';
        }
        
        this.isLoading = false;
    }

    /**
     * แสดงข้อความ Error (แยกระหว่าง frontend กับ backend)
     */
    showError(message, shouldCloseModal = false) {
        // ตรวจสอบว่าเป็น error message แบบ object หรือ string
        if (typeof message === 'object' && message.type === 'list') {
            this.showListError(message, shouldCloseModal);
        } else {
            this.showSimpleError(message, shouldCloseModal);
        }
    }

    /**
     * แสดงข้อความ Error แบบง่าย
     */
    showSimpleError(message, shouldCloseModal = false) {
        const errorConfig = {
            title: 'เกิดข้อผิดพลาด',
            text: message,
            icon: 'error',
            confirmButtonText: 'ตกลง'
        };

        if (shouldCloseModal) {
            // Error จาก backend - ปิด modal หลังจากแสดง error
            errorConfig.willClose = () => {
                this.hideModal();
            };
            // เพิ่ม callback เมื่อกดปุ่ม OK
            errorConfig.preConfirm = () => {
                this.hideModal();
                return true;
            };
        }

        Swal.fire(errorConfig);
    }

    /**
     * แสดงข้อความ Error แบบรายการ
     */
    showListError(errorData, shouldCloseModal = false) {
        let htmlContent = `<div style="text-align: left;">`;
        htmlContent += `<p style="margin-bottom: 15px; font-weight: 500;">${errorData.title}</p>`;
        
        // สร้าง scrollable list สำหรับรายการเยอะ
        const listStyle = errorData.items.length > 10 
            ? 'max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px; background-color: #f9f9f9;'
            : '';
            
        htmlContent += `<ul style="margin: 0; padding-left: 20px; list-style-type: none; ${listStyle}">`;
        
        errorData.items.forEach((item) => {
            htmlContent += `<li style="margin-bottom: 6px; line-height: 1.4; position: relative; padding-left: 20px;">
                <span style="position: absolute; left: 0; color: #dc3545; font-weight: bold;">•</span>
                ${item}
            </li>`;
        });
        
        htmlContent += `</ul></div>`;

        const errorConfig = {
            title: 'เกิดข้อผิดพลาด',
            html: htmlContent,
            icon: 'error',
            confirmButtonText: 'ตกลง',
            width: '600px',
            customClass: {
                content: 'text-left'
            }
        };

        if (shouldCloseModal) {
            // Error จาก backend - ปิด modal หลังจากแสดง error
            errorConfig.willClose = () => {
                this.hideModal();
            };
            errorConfig.preConfirm = () => {
                this.hideModal();
                return true;
            };
        }

        Swal.fire(errorConfig);
    }

    /**
     * แสดงข้อความ Success
     */
    showSuccess(message) {
        Swal.fire({
            title: 'สำเร็จ',
            text: message,
            icon: 'success',
            confirmButtonText: 'ตกลง',
            timer: 2000
        });
    }

    /**
     * ตั้งค่า FormBuilder reference
     */
    setFormBuilder(formBuilder) {
        this.formBuilder = formBuilder;
    }

    /**
     * Clear ข้อมูลรูปภาพเมื่อปิด modal
     */
    clearPhotoData() {
        if (this.formBuilder && typeof this.formBuilder.resetForm === 'function') {
            this.formBuilder.resetForm();
        }
        
        // ล้าง global reference
        if (window.currentFormBuilder) {
            window.currentFormBuilder.resetForm();
        }
    }
} 