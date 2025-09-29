/**
 * Form Handler - จัดการ Event Listeners และการ Submit ของ Form
 */

import { AddFormValidator } from './add-form-validator.js';
import { AddSubmitManager } from './add-submit-manager.js';
import { AddDropdown } from './add-dropdown.js';
import { showAlert } from '/global-auth-status.js';

export class FormHandler {
    constructor(formBuilder, modalManager) {
        this.formBuilder = formBuilder;
        this.modalManager = modalManager;
        this.validator = new AddFormValidator();
        this.submitManager = new AddSubmitManager();
        this.vehicleDropdown = null;
        this.checklistsData = [];
    }

    /**
     * ตั้งค่า Event Listeners หลัก
     */
    setupEventListeners() {
        const modalElement = document.getElementById('addChecklistModal');
        
        // เมื่อ Modal ปิด
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.resetForm();
        });
    }

    /**
     * ตั้งค่า Event Listeners สำหรับ Form
     */
    setupFormEventListeners() {
        // Submit Form
        const submitBtn = document.getElementById('submitAddForm');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Cancel Button
        const cancelBtn = document.getElementById('cancelAddForm');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        // Close Button (X) in Header
        const closeBtn = document.querySelector('#addChecklistModal .btn-close');
        if (closeBtn) {
            // ลบ data-bs-dismiss ออกเพื่อไม่ให้ปิดอัตโนมัติ
            closeBtn.removeAttribute('data-bs-dismiss');
            closeBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }

        // Photo Upload Event Listeners
        this.setupPhotoEventListeners();
        
        // Status Radio Event Listeners
        this.setupStatusEventListeners();
    }

    /**
     * สร้าง Vehicle Dropdown
     */
    createVehicleDropdown(vehiclesData) {
        const container = document.getElementById('vehicleDropdownContainer');
        if (!container) return;

        // เตรียมข้อมูลสำหรับ dropdown
        const dropdownData = vehiclesData.map(vehicle => ({
            value: vehicle.id,
            text: this.formBuilder.formatVehicleName(vehicle),
            name: this.formBuilder.formatVehicleName(vehicle)
        }));

        // สร้าง dropdown
        this.vehicleDropdown = new AddDropdown(container, {
            placeholder: '🚗 เลือกรถยนต์',
            searchable: true
        });

        // ตั้งค่าข้อมูล
        this.vehicleDropdown.setData(dropdownData);

        // ฟัง event เมื่อมีการเลือก
        container.addEventListener('change', (e) => {
            const selectedValue = e.detail?.value || e.target?.value;
            const hiddenInput = document.getElementById('vehicleSelect');
            if (hiddenInput) {
                hiddenInput.value = selectedValue || '';
            }
        });
    }

    /**
     * ตั้งค่า Event Listeners สำหรับรูปภาพ
     */
    setupPhotoEventListeners() {
        const photoInputs = document.querySelectorAll('.photo-upload-input');
        
        photoInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handlePhotoSelection(e);
            });
        });
    }

    /**
     * ตั้งค่า Event Listeners สำหรับ Status Radio
     */
    setupStatusEventListeners() {
        const radioOptions = document.querySelectorAll('.status-radio-option');
        
        radioOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleStatusSelection(e);
            });
        });
    }

    /**
     * จัดการการเลือกรูปภาพ
     */
    handlePhotoSelection(event) {
        const input = event.target;
        const checklistId = input.dataset.checklistId;
        const previewContainer = document.getElementById(`preview_${checklistId}`);
        
        if (input.files && previewContainer) {
            this.formBuilder.updatePhotoPreview(input.files, previewContainer, checklistId);
        }
    }

    /**
     * จัดการการเลือก Status
     */
    handleStatusSelection(event) {
        const option = event.currentTarget;
        const checklistId = option.dataset.checklistId;
        const status = option.dataset.status;
        
        // อัปเดต UI
        this.formBuilder.updateStatusSelection(checklistId, status);
    }

    /**
     * จัดการการส่งฟอร์ม
     */
    async handleSubmit() {
        try {
            // Validate Form (Frontend validation - ไม่ปิด modal)
            const validationResult = this.validator.validateForm();
            if (!validationResult.valid) {
                this.modalManager.showError(validationResult.message, false); // ไม่ปิด modal
                return;
            }

            this.modalManager.setLoading(true);
            
            // เตรียมข้อมูลสำหรับส่ง
            const formData = this.collectFormData();
            
            // ส่งข้อมูล
            const result = await this.submitManager.submitChecklist(formData);
            
            if (result.success) {
                this.modalManager.hideModal();
                
                // Refresh table ถ้ามี
                if (window.mainPageFunctions?.refreshTable) {
                    window.mainPageFunctions.refreshTable();
                }
                
                // แสดง SweetAlert หลังจาก refresh
                setTimeout(() => {
                    showAlert('สำเร็จ', 'เพิ่มการตรวจสอบสำเร็จ', 'success');
                }, 500);
            } else {
                // จัดการ error จาก backend - ปิด modal
                const shouldCloseModal = result.shouldCloseModal !== false; // default เป็น true สำหรับ backend error
                this.modalManager.showError(result.message || 'ไม่สามารถเพิ่มการตรวจสอบได้', shouldCloseModal);
                return;
            }
            
        } catch (error) {
            // Frontend error - ไม่ปิด modal
            this.modalManager.showError('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message, false);
        } finally {
            this.modalManager.setLoading(false);
        }
    }

    /**
     * จัดการการยกเลิก
     */
    handleCancel() {
        // ตรวจสอบว่ามีข้อมูลในฟอร์มหรือไม่
        const hasData = this.checkFormHasData();
        
        if (hasData) {
            // แสดง confirmation dialog
            Swal.fire({
                title: 'ยืนยันการยกเลิก',
                text: 'คุณต้องการยกเลิกการเพิ่มข้อมูล? ข้อมูลที่กรอกจะหายทั้งหมด',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'ใช่, ยกเลิก',
                cancelButtonText: 'ไม่, กลับไปแก้ไข'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.modalManager.hideModal();
                }
            });
        } else {
            // ไม่มีข้อมูล ปิดเลย
            this.modalManager.hideModal();
        }
    }

    /**
     * ตรวจสอบว่าฟอร์มมีข้อมูลหรือไม่
     */
    checkFormHasData() {
        // ตรวจสอบ vehicle selection
        const vehicleInput = document.getElementById('vehicleSelect');
        if (vehicleInput && vehicleInput.value) {
            return true;
        }

        // ตรวจสอบ status selections
        const statusInputs = document.querySelectorAll('input[name^="status_"]:checked');
        if (statusInputs.length > 0) {
            return true;
        }

        // ตรวจสอบ notes
        const noteInputs = document.querySelectorAll('textarea[name^="note_"]');
        for (let note of noteInputs) {
            if (note.value.trim()) {
                return true;
            }
        }

        // ตรวจสอบรูปภาพ
        if (this.formBuilder && this.formBuilder.photoFiles && this.formBuilder.photoFiles.size > 0) {
            return true;
        }

        return false;
    }

    /**
     * รวบรวมข้อมูลจากฟอร์ม
     */
    collectFormData() {
        const vehicleSelect = document.getElementById('vehicleSelect');
        
        // ตรวจสอบว่า vehicleSelect มีอยู่และมีค่า
        if (!vehicleSelect || !vehicleSelect.value) {
            throw new Error('กรุณาเลือกรถยนต์');
        }
        
        const formData = new FormData();
        
        // ข้อมูลหลัก - Backend ต้องการ vehicle_id เป็น number
        const vehicleId = parseInt(vehicleSelect.value, 10);
        
        // ตรวจสอบว่า vehicleId ถูกต้อง
        if (isNaN(vehicleId) || vehicleId <= 0) {
            throw new Error('กรุณาเลือกรถยนต์');
        }

        // ดึงข้อมูลรถจาก vehiclesData
        const selectedVehicle = this.vehiclesData?.find(v => v.id === vehicleId);
        const vehicleName = selectedVehicle ? this.formBuilder.formatVehicleName(selectedVehicle) : null;
        
        // สร้างข้อมูลในรูปแบบ JSON ตาม CreateChecklistRequest
        const requestData = this.createRequestDataWithNames(vehicleId, vehicleName);
        
        // รวบรวมข้อมูล checklist items
        this.checklistsData.forEach(checklist => {
            const statusInput = document.querySelector(`input[name="status_${checklist.id}"]:checked`);
            const noteInput = document.getElementById(`note_${checklist.id}`);
            
            if (statusInput) {
                const item = this.createItemDataWithNames(checklist, statusInput, noteInput);
                requestData.items.push(item);
                
                // เพิ่มรูปภาพจาก FormBuilder Map
                const photos = this.formBuilder.photoFiles.get(checklist.id.toString()) || [];
                photos.forEach((file) => {
                    formData.append(`photos_${checklist.id}`, file);
                });
            }
        });
        
        // ตรวจสอบว่ามี items หรือไม่
        if (requestData.items.length === 0) {
            throw new Error('กรุณาเลือกสถานะสำหรับรายการตรวจสอบอย่างน้อย 1 รายการ');
        }
        
        // เพิ่มข้อมูล JSON หลักลงใน FormData
        formData.append('vehicle_id', requestData.vehicle_id.toString());
        if (requestData.vehicle_name) {
            formData.append('vehicle_name', requestData.vehicle_name);
        }
        formData.append('items', JSON.stringify(requestData.items));
        
        return formData;
    }

    /**
     * รีเซ็ตฟอร์ม
     */
    resetForm() {
        // รีเซ็ต dropdown
        if (this.vehicleDropdown) {
            this.vehicleDropdown.destroy();
            this.vehicleDropdown = null;
        }
        
        // รีเซ็ตข้อมูล
        this.checklistsData = [];
    }

    /**
     * ตั้งค่าข้อมูล Checklist
     */
    setChecklistsData(data) {
        this.checklistsData = data;
    }

    /**
     * ตั้งค่าข้อมูล Vehicles
     */
    setVehiclesData(data) {
        this.vehiclesData = data;
    }

    /**
     * เปิดใช้งาน name validation (เมื่อ backend พร้อมรับ name fields)
     * เปลี่ยน enableNameValidation เป็น true เมื่อต้องการเปิดใช้งาน
     */
    enableNameValidation = true;

    /**
     * สร้าง request data พร้อม name validation
     */
    createRequestDataWithNames(vehicleId, vehicleName) {
        const requestData = {
            vehicle_id: vehicleId,
            items: []
        };

        // เพิ่ม vehicle_name หาก enabled
        if (this.enableNameValidation && vehicleName) {
            requestData.vehicle_name = vehicleName;
        }

        return requestData;
    }

    /**
     * สร้าง item data พร้อม name validation
     */
    createItemDataWithNames(checklist, statusInput, noteInput) {
        const item = {
            checklist_id: parseInt(checklist.id, 10),
            status: statusInput.value === 'true',
            note: noteInput ? noteInput.value.trim() : ''
        };

        // เพิ่ม checklist name หาก enabled
        if (this.enableNameValidation && checklist.name) {
            item.name = checklist.name;
        }

        return item;
    }
} 