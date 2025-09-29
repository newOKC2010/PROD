/**
 * Main Modal Add Manager - จัดการ Modal เพิ่ม Checklist ใหม่
 */

import { AddDataManager } from '/add-data-manager.js';
import { AddFormBuilder } from '/add-form-builder.js';
import { ModalManager } from '/main-modal-manager.js';
import { FormHandler } from '/main-form-handler.js';

export class MainModalAdd {
    constructor() {
        this.dataManager = new AddDataManager();
        this.formBuilder = new AddFormBuilder();
        this.modalManager = new ModalManager();
        this.formHandler = new FormHandler(this.formBuilder, this.modalManager);
        
        this.vehiclesData = [];
        this.checklistsData = [];
        
        this.initializeModal();
    }

    /**
     * เริ่มต้น Modal
     */
    initializeModal() {
        this.modalManager.createModalHTML();
        this.setupEventListeners();
    }

    /**
     * ตั้งค่า Event Listeners
     */
    setupEventListeners() {
        const modalElement = document.getElementById('addChecklistModal');
        
        // เมื่อ Modal เปิด
        modalElement.addEventListener('shown.bs.modal', () => {
            this.loadInitialData();
        });

        // เมื่อ Modal ปิด - clear ข้อมูลรูปภาพ
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.resetForm();
        });
        
        // ตั้งค่า Event Listeners สำหรับ FormHandler
        this.formHandler.setupEventListeners();
    }

    /**
     * แสดง Modal
     */
    async showModal() {
        await this.modalManager.showModal();
    }

    /**
     * ซ่อน Modal
     */
    hideModal() {
        this.modalManager.hideModal();
    }

    /**
     * โหลดข้อมูลเริ่มต้น
     */
    async loadInitialData() {
        try {
            this.modalManager.setLoading(true);
            
            // โหลดข้อมูลรถและ checklist templates แบบ parallel
            const [vehiclesResult, checklistsResult] = await Promise.all([
                this.dataManager.loadVehicles(),
                this.dataManager.loadChecklistTemplates()
            ]);

            if (vehiclesResult.success && checklistsResult.success) {
                this.vehiclesData = vehiclesResult.data;
                this.checklistsData = checklistsResult.data;
                
                // สร้าง Form
                this.buildForm();
            } else {
                throw new Error(vehiclesResult.message || checklistsResult.message || 'ไม่สามารถโหลดข้อมูลได้');
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.modalManager.showError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
        } finally {
            this.modalManager.setLoading(false);
        }
    }

    /**
     * สร้าง Form
     */
    buildForm() {
        const formHTML = this.formBuilder.createForm(this.vehiclesData, this.checklistsData);
        
        // แสดง Form ใน Modal
        this.modalManager.displayForm(formHTML);
        
        // เก็บ reference ของ formBuilder ใน global scope เพื่อใช้ใน removePhotoPreview
        window.currentFormBuilder = this.formBuilder;
        
        // ส่ง formBuilder reference ไปยัง modalManager
        this.modalManager.setFormBuilder(this.formBuilder);
        
        // ส่งข้อมูลให้ FormHandler
        this.formHandler.setChecklistsData(this.checklistsData);
        this.formHandler.setVehiclesData(this.vehiclesData);
        
        // สร้าง Vehicle Dropdown และตั้งค่า Event Listeners
        this.formHandler.createVehicleDropdown(this.vehiclesData);
        this.formHandler.setupFormEventListeners();
    }

    /**
     * รีเซ็ตฟอร์ม (เรียกจาก Modal Event)
     */
    resetForm() {
        // รีเซ็ต FormBuilder (รวมถึงรูปภาพ)
        if (this.formBuilder && typeof this.formBuilder.resetForm === 'function') {
            this.formBuilder.resetForm();
        }
        
        // รีเซ็ต FormHandler
        if (this.formHandler && typeof this.formHandler.resetForm === 'function') {
            this.formHandler.resetForm();
        }
        
        // รีเซ็ต Modal
        this.modalManager.resetModal();
        
        // รีเซ็ตข้อมูล
        this.vehiclesData = [];
        this.checklistsData = [];
        
        // ล้าง global reference
        if (window.currentFormBuilder) {
            window.currentFormBuilder = null;
        }
    }
} 