/**
 * Modal Image Gallery Manager - จัดการการแสดงรูปภาพใน modal
 */

import { API_BASE_URL, API_ENDPOINTS, getStoredToken } from '/global-api.js';

export class ModalImageGallery {
    constructor() {
        // ใช้ API_BASE_URL จาก global-api.js
        this.baseImageUrl = API_BASE_URL;
        this.imageEndpoint = API_ENDPOINTS.MAIN_CHECK.IMG;
        this.currentLightboxImages = [];
        this.currentLightboxIndex = 0;
        this.lightboxModal = null;
        
        this.createLightboxModal();
    }

    /**
     * สร้าง HTML สำหรับแสดงรูปภาพ
     * @param {Array} photos - รายการรูปภาพ
     * @param {string} itemName - ชื่อรายการ checklist
     * @returns {string} HTML string
     */
    createImageGalleryHTML(photos, itemName = '') {
        if (!photos || photos.length === 0) {
            return `
                <div class="checklist-no-images">
                    <div>
                        <i class="fas fa-image"></i>
                    </div>
                    <div>ไม่มีรูปภาพ</div>
                </div>
            `;
        }

        const imagesHTML = photos.map((photo, index) => {
            const imageUrl = this.buildImageUrl(photo.photo_path);
            return `
                <div class="checklist-image-item" 
                     data-image-url="${imageUrl}" 
                     data-description="${this.escapeHtml(photo.description || '')}"
                     data-index="${index}">
                    <div class="checklist-image-loading">
                        <i class="fas fa-spinner"></i>
                        กำลังโหลด...
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="checklist-image-gallery">
                <div class="checklist-image-gallery-title">
                    <i class="fas fa-images"></i>
                    รูปภาพการตรวจสอบ (${photos.length} รูป)
                </div>
                <div class="checklist-image-grid">
                    ${imagesHTML}
                </div>
            </div>
        `;
    }

    /**
     * สร้าง URL สำหรับรูปภาพ
     * @param {string} photoPath - path ของรูปภาพ
     * @returns {string} URL ที่สมบูรณ์
     */
    buildImageUrl(photoPath) {
        if (photoPath.startsWith('http')) {
            return photoPath;
        }
        
        // ลบ leading slash หากมี
        let cleanPath = photoPath.startsWith('/') ? photoPath.slice(1) : photoPath;
        
        // ถ้า path ขึ้นต้นด้วย "src/img/" ให้ตัดออก เพราะ API endpoint เป็น /img แล้ว
        if (cleanPath.startsWith('img/')) {
            cleanPath = cleanPath.slice(4); // ตัด "img/" ออก (4 ตัวอักษร)
        }
        
        // ใช้ API_ENDPOINTS.MAIN_CHECK.IMG
        return `${this.imageEndpoint}/${cleanPath}`;
    }

    /**
     * Escape HTML เพื่อป้องกัน XSS
     * @param {string} text - ข้อความที่ต้องการ escape
     * @returns {string} ข้อความที่ escape แล้ว
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * ตั้งค่า Event Listeners สำหรับรูปภาพ
     * @param {HTMLElement} container - container ที่มีรูปภาพ
     */
    setupImageEventListeners(container) {
        const imageItems = container.querySelectorAll('.checklist-image-item');
        
        imageItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // เก็บรายการรูปภาพทั้งหมดใน gallery นี้
                this.currentLightboxImages = Array.from(imageItems).map(imgItem => ({
                    url: imgItem.dataset.imageUrl,
                    description: imgItem.dataset.description || '',
                    element: imgItem
                }));
                
                this.currentLightboxIndex = index;
                this.showLightbox();
            });
        });
    }

    /**
     * สร้าง Lightbox Modal
     */
    createLightboxModal() {
        if (document.getElementById('imageLightboxModal')) {
            return;
        }

        const modalHTML = `
            <div class="modal fade image-lightbox-modal" id="imageLightboxModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="lightboxTitle">ดูรูปภาพ</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <img id="lightboxImage" src="" alt="" />
                            <button type="button" class="lightbox-nav-button lightbox-nav-prev" id="lightboxPrev">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button type="button" class="lightbox-nav-button lightbox-nav-next" id="lightboxNext">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <div class="lightbox-image-counter" id="lightboxCounter">
                                1 / 1
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        this.lightboxModal = new bootstrap.Modal(document.getElementById('imageLightboxModal'));
        this.setupLightboxEventListeners();
    }

    /**
     * ตั้งค่า Event Listeners สำหรับ Lightbox
     */
    setupLightboxEventListeners() {
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');
        const lightboxModal = document.getElementById('imageLightboxModal');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showPreviousImage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showNextImage());
        }

        // Keyboard navigation
        lightboxModal.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.showPreviousImage();
            } else if (e.key === 'ArrowRight') {
                this.showNextImage();
            } else if (e.key === 'Escape') {
                this.lightboxModal.hide();
            }
        });

        // Focus modal for keyboard events
        lightboxModal.addEventListener('shown.bs.modal', () => {
            lightboxModal.focus();
        });
    }

    /**
     * แสดง Lightbox
     */
    showLightbox() {
        if (this.currentLightboxImages.length === 0) return;

        this.updateLightboxContent();
        this.lightboxModal.show();
    }

    /**
     * อัพเดทเนื้อหาใน Lightbox
     */
    updateLightboxContent() {
        const currentImage = this.currentLightboxImages[this.currentLightboxIndex];
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxCounter = document.getElementById('lightboxCounter');
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        if (lightboxImage && currentImage) {
            lightboxImage.src = currentImage.url;
            lightboxImage.alt = currentImage.description;
        }

        if (lightboxTitle) {
            lightboxTitle.textContent = currentImage.description || 'ดูรูปภาพ';
        }

        if (lightboxCounter) {
            lightboxCounter.textContent = `${this.currentLightboxIndex + 1} / ${this.currentLightboxImages.length}`;
        }

        // ซ่อน/แสดงปุ่มนำทาง
        if (prevBtn) {
            prevBtn.style.display = this.currentLightboxImages.length > 1 ? 'flex' : 'none';
        }
        if (nextBtn) {
            nextBtn.style.display = this.currentLightboxImages.length > 1 ? 'flex' : 'none';
        }
    }

    /**
     * แสดงรูปภาพก่อนหน้า
     */
    showPreviousImage() {
        if (this.currentLightboxImages.length <= 1) return;
        
        this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.currentLightboxImages.length) % this.currentLightboxImages.length;
        this.updateLightboxContent();
    }

    /**
     * แสดงรูปภาพถัดไป
     */
    showNextImage() {
        if (this.currentLightboxImages.length <= 1) return;
        
        this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.currentLightboxImages.length;
        this.updateLightboxContent();
    }

    /**
     * ปิด Lightbox
     */
    hideLightbox() {
        if (this.lightboxModal) {
            this.lightboxModal.hide();
        }
    }

    /**
     * โหลดรูปภาพพร้อม Authorization header
     * @param {string} imageUrl - URL ของรูปภาพ
     * @param {HTMLElement} container - container ของรูปภาพ
     * @param {Object} photo - ข้อมูลรูปภาพ
     * @param {string} itemName - ชื่อรายการ
     */
    async loadImageWithAuth(imageUrl, container, photo, itemName) {
        try {
            // ดึง token จาก global-api.js
            const token = getStoredToken();
            
            if (!token) {
                throw new Error('No authentication token');
            }

            // สร้าง fetch request พร้อม Authorization header
            const response = await fetch(imageUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // แปลง response เป็น blob
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // สร้าง img element
            const img = document.createElement('img');
            img.src = objectUrl;
            img.alt = this.escapeHtml(photo.description || itemName);
            img.loading = 'lazy';
            
            // สร้าง overlay
            const overlay = document.createElement('div');
            overlay.className = 'checklist-image-overlay';
                            overlay.textContent = photo.description || '';

            // แทนที่ loading state ด้วยรูปภาพ
            container.innerHTML = '';
            container.appendChild(img);
            container.appendChild(overlay);

            // อัพเดท data-image-url ด้วย object URL
            container.dataset.imageUrl = objectUrl;

        } catch (error) {
            console.error('Error loading image:', error);
            container.innerHTML = `
                <div class="checklist-image-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>ไม่สามารถโหลดรูปภาพได้</div>
                </div>
            `;
        }
    }
} 