/**
 * Modal Content Builder - จัดการการสร้างเนื้อหา Modal สำหรับแสดงรายละเอียด Checklist
 */

import { ModalImageGallery } from './modal-image-gallery.js';

export class ModalContentBuilder {
    constructor() {
        // สร้าง instance ของ ModalImageGallery
        this.imageGallery = new ModalImageGallery();
    }

    /**
     * สร้างเนื้อหาของ Modal
     * @param {Object} data - ข้อมูล checklist
     * @returns {string} HTML content
     */
    createModalContent(data) {
        try {
            const checkedDate = this.formatThaiDateTime(data.checked_date);
            
            return `
            <div class="checklist-view">
                <!-- Header Information -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card border-secondary">
                            <div class="card-header bg-light text-dark">
                                <h6 class="mb-0" style="font-weight: bold;">
                                    <i class="fas fa-ambulance me-2"></i>ข้อมูลรถ
                                </h6>
                            </div>
                            <div class="card-body">
                                <h5 class="text-secondary" style="font-weight: bold;">${data.vehicle_name || 'ไม่ระบุ'}</h5>
                                <p class="text-muted mb-0" style="font-weight: bold;">
                                    <i class="fas fa-calendar me-1"></i>
                                    ${checkedDate}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-light">
                            <div class="card-header bg-light text-dark">
                                <h6 class="mb-0" style="font-weight: bold;">
                                    <i class="fas fa-user me-2"></i>ผู้ตรวจสอบ
                                </h6>
                            </div>
                            <div class="card-body">
                                <h5 class="text-secondary" style="font-weight: bold;">${data.username || 'ไม่ระบุ'}</h5>
                                <p class="text-muted mb-0" style="font-weight: bold;">
                                    ${this.getSummaryText(data.checklist_items)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Checklist Items -->
                <div class="checklist-items">
                    <h5 class="mb-3" style="font-weight: bold;">
                        <i class="fas fa-tasks me-2"></i>รายการตรวจสอบ
                    </h5>
                    ${this.createChecklistItemsHTML(data.checklist_items)}
                </div>
            </div>
            `;
        } catch (error) {
            console.error('Error creating modal content:', error, data);
            return `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    เกิดข้อผิดพลาดในการแสดงข้อมูล
                </div>
            `;
        }
    }

    /**
     * ดึง checklist items จากโครงสร้างข้อมูล
     * @param {Object|Array} checklistItems - ข้อมูล checklist_items
     * @returns {Array} array ของ checklist items
     */
    getChecklistItemsArray(checklistItems) {
        try {
            if (!checklistItems) return [];
            
            // ถ้า checklist_items เป็น object ที่มี property items
            if (checklistItems.items && Array.isArray(checklistItems.items)) {
                return checklistItems.items;
            }
            
            // ถ้า checklist_items เป็น array โดยตรง
            if (Array.isArray(checklistItems)) {
                return checklistItems;
            }
            
            // ถ้าเป็น string (JSON) ให้ parse
            if (typeof checklistItems === 'string') {
                const parsed = JSON.parse(checklistItems);
                return this.getChecklistItemsArray(parsed);
            }
            
            console.warn('Unknown checklist_items structure:', checklistItems);
            return [];
        } catch (error) {
            console.error('Error parsing checklist items:', error, checklistItems);
            return [];
        }
    }

    /**
     * สร้าง HTML สำหรับรายการ checklist
     * @param {Array} items - รายการ checklist items
     * @returns {string} HTML string
     */
    createChecklistItemsHTML(items) {
        const checklistItems = this.getChecklistItemsArray(items);
        
        if (checklistItems.length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    ไม่มีรายการตรวจสอบ
                </div>
            `;
        }
        
        return `
            <div class="checklist-grid">
                ${checklistItems.map((item, index) => this.createChecklistItemHTML(item, index)).join('')}
            </div>
        `;
    }

    /**
     * สร้าง HTML สำหรับรายการ checklist แต่ละอัน
     * @param {Object} item - รายการ checklist item
     * @param {number} index - ลำดับ
     * @returns {string} HTML string
     */
    createChecklistItemHTML(item, index) {
        const status = item.status === true;
        const statusIcon = status ? 
            '<i class="fas fa-check-circle text-white"></i>' : 
            '<i class="fas fa-times-circle text-white"></i>';
        
        const cardClass = status ? 'border-success' : 'border-danger';
        const headerClass = status ? 'bg-success text-white' : 'bg-danger text-white';
        const statusText = status ? 'ผ่าน' : 'ไม่ผ่าน';
        
        // ตรวจสอบว่ามีรูปภาพหรือไม่
        const hasImage = item.photos && item.photos.length > 0;
        
        // สร้าง HTML สำหรับรูปภาพ
        const imageGalleryHTML = hasImage ? 
            this.imageGallery.createImageGalleryHTML(item.photos, item.name) : '';
        
        return `
            <div class="card mb-3 ${cardClass}" data-checklist-item="${index}" style="font-weight: bold;">
                <div class="card-header ${headerClass} py-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex align-items-start flex-grow-1 me-3">
                            <div class="me-2 mt-1">
                                ${statusIcon}
                            </div>
                            <div class="flex-grow-1">
                                <div class="checklist-item-name fw-bold mb-1">${item.name || `รายการที่ ${index + 1}`}</div>
                                <span class="badge ${status ? 'bg-light text-success' : 'bg-light text-danger'} fw-bold">${statusText}</span>
                            </div>
                        </div>
                        <div class="d-flex align-items-center flex-shrink-0">
                            ${hasImage ? `<i class="fas fa-camera text-warning me-2" title="มีรูปภาพ ${item.photos.length} รูป"></i>` : ''}
                            <span class="badge bg-white text-dark fw-bold px-2">#${index + 1}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-body py-2">
                    ${item.note ? `
                        <div class="d-flex align-items-start mb-2">
                            <i class="fas fa-sticky-note text-warning me-2 mt-1"></i>
                            <div class="flex-grow-1">
                                <small class="text-muted">หมายเหตุ:</small>
                                <p class="mb-0 checklist-note-text">${item.note}</p>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${imageGalleryHTML}
                </div>
            </div>
        `;
    }

    /**
     * ตั้งค่า Event Listeners สำหรับรูปภาพหลังจากสร้าง content แล้ว
     * @param {HTMLElement} container - container ที่มี modal content
     */
    setupImageEventListeners(container) {
        // ตั้งค่า event listeners สำหรับรูปภาพในแต่ละ checklist item
        const checklistItems = container.querySelectorAll('[data-checklist-item]');
        
        checklistItems.forEach(item => {
            const imageGallery = item.querySelector('.checklist-image-gallery');
            if (imageGallery) {
                // โหลดรูปภาพพร้อม auth
                this.loadImagesWithAuth(imageGallery);
                
                // ตั้งค่า event listeners สำหรับการคลิกรูปภาพ
                this.imageGallery.setupImageEventListeners(imageGallery);
            }
        });
    }

    /**
     * โหลดรูปภาพทั้งหมดใน gallery พร้อม auth
     * @param {HTMLElement} galleryContainer - container ของ image gallery
     */
    async loadImagesWithAuth(galleryContainer) {
        const imageItems = galleryContainer.querySelectorAll('.checklist-image-item');
        
        // โหลดรูปภาพแต่ละรูปแบบ parallel
        const loadPromises = Array.from(imageItems).map(async (item) => {
            const imageUrl = item.dataset.imageUrl;
            const description = item.dataset.description;
            
            if (imageUrl) {
                await this.imageGallery.loadImageWithAuth(
                    imageUrl, 
                    item, 
                    { description }, 
                    'รูปภาพการตรวจสอบ'
                );
            }
        });

        try {
            await Promise.all(loadPromises);
        } catch (error) {
            console.error('Error loading some images:', error);
        }
    }

    /**
     * แปลงวันที่เป็นรูปแบบไทย (ไม่แสดงเวลา)
     * @param {string} dateString - วันที่ในรูปแบบ ISO
     * @returns {string} วันที่ในรูปแบบไทย
     */
    formatThaiDateTime(dateString) {
        if (!dateString) return 'ไม่ระบุ';
        
        const date = new Date(dateString);
        
        // ตรวจสอบว่า date ถูกต้องหรือไม่
        if (isNaN(date.getTime())) return 'วันที่ไม่ถูกต้อง';
        
        const thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];
        
        const day = date.getDate();
        const month = thaiMonths[date.getMonth()];
        const year = date.getFullYear() + 543;
        
        return `${day} ${month} ${year}`;
    }

    /**
     * สร้างข้อความสรุป
     * @param {Array} items - รายการ checklist items
     * @returns {string} ข้อความสรุป
     */
    getSummaryText(items) {
        const checklistItems = this.getChecklistItemsArray(items);
        
        if (checklistItems.length === 0) {
            return 'ไม่มีรายการตรวจสอบ';
        }
        
        const totalItems = checklistItems.length;
        const passedItems = checklistItems.filter(item => item.status === true).length;
        const percentage = ((passedItems / totalItems) * 100).toFixed(1);
        
        return `ผ่าน ${passedItems}/${totalItems} รายการ (${percentage}%)`;
    }
} 