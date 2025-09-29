export class PaginationManager {
    constructor(options = {}) {
        this.currentPage = 1;
        this.itemsPerPage = options.itemsPerPage || 5;
        this.totalItems = 0;
        this.totalPages = 0;
        this.data = [];
        this.filteredData = [];
        
        this.tableContainer = options.tableContainer;
        this.paginationContainer = options.paginationContainer;
        this.itemsPerPageSelect = options.itemsPerPageSelect;
        this.infoContainer = options.infoContainer;
        
        this.onPageChange = options.onPageChange || (() => {});
        this.onItemsPerPageChange = options.onItemsPerPageChange || (() => {});
        
        this.init();
    }

    init() {
        this.setupItemsPerPageSelect();
        this.setupEventListeners();
    }

    setupItemsPerPageSelect() {
        if (!this.itemsPerPageSelect) return;
        
        if (this.itemsPerPageSelect.closest('.modern-dropdown')) {
            return;
        }
        
        this.itemsPerPageSelect.innerHTML = `
            <option value="5" ${this.itemsPerPage === 5 ? 'selected' : ''}>5 รายการ</option>
            <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 รายการ</option>
            <option value="20" ${this.itemsPerPage === 20 ? 'selected' : ''}>20 รายการ</option>
        `;
    }
    

    setupEventListeners() {
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.addEventListener('change', (e) => {
                const newItemsPerPage = parseInt(e.target.value);
                
                this.itemsPerPage = newItemsPerPage;
                this.currentPage = 1;
                
                this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
                
                this.updatePagination();
                this.updateInfo();
                
                this.onItemsPerPageChange(this.itemsPerPage);
            });
        }
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.totalPages > 1) {
                    this.updatePagination();
                }
            }, 250);
        });
    }
    

    updateData(data, filteredData = null) {
        this.data = data || [];
        this.filteredData = filteredData || this.data;
        this.totalItems = this.filteredData.length;
        
        this.totalPages = this.totalItems > 0 ? Math.ceil(this.totalItems / this.itemsPerPage) : 0;
        
        if (this.totalPages === 0) {
            this.currentPage = 1;
        } else if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        } else if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        
        this.updatePagination();
        this.updateInfo();
    }
    

    getCurrentPageData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredData.slice(startIndex, endIndex);
    }
    

    updatePagination() {
        if (!this.paginationContainer) return;
        
        const pagination = this.createPaginationHTML();
        this.paginationContainer.innerHTML = pagination;
        
        this.addPaginationEventListeners();
    }
    

    createPaginationHTML() {
        if (this.totalPages <= 1) return '';
        
        let html = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center pagination-responsive">';
        
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link d-flex align-items-center justify-content-center" href="#" data-page="1" aria-label="First" title="หน้าแรก">
                    <span aria-hidden="true">&laquo;&laquo;</span>
                </a>
            </li>
        `;
        
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link d-flex align-items-center justify-content-center" href="#" data-page="${this.currentPage - 1}" aria-label="Previous" title="หน้าก่อนหน้า">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        const { start, end } = this.getPageRange();
        
        if (start > 1) {
            html += `<li class="page-item d-none d-md-block"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (start > 2) {
                html += `<li class="page-item disabled d-none d-md-block"><span class="page-link">...</span></li>`;
            }
        }
        
        for (let i = start; i <= end; i++) {
            const isMobileVisible = Math.abs(i - this.currentPage) <= 1;
            const mobileClass = isMobileVisible ? '' : 'd-none d-md-block';
            
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''} ${mobileClass}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        if (end < this.totalPages) {
            if (end < this.totalPages - 1) {
                html += `<li class="page-item disabled d-none d-md-block"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item d-none d-md-block"><a class="page-link" href="#" data-page="${this.totalPages}">${this.totalPages}</a></li>`;
        }
        
        html += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link d-flex align-items-center justify-content-center" href="#" data-page="${this.currentPage + 1}" aria-label="Next" title="หน้าถัดไป">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        html += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <a class="page-link d-flex align-items-center justify-content-center" href="#" data-page="${this.totalPages}" aria-label="Last" title="หน้าสุดท้าย">
                    <span aria-hidden="true">&raquo;&raquo;</span>
                </a>
            </li>
        `;
        
        html += '</ul></nav>';
        
        if (!document.getElementById('pagination-mobile-css')) {
            const style = document.createElement('style');
            style.id = 'pagination-mobile-css';
            style.textContent = `
                .pagination-responsive .page-link {
                    min-width: 40px;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem 0.75rem;
                }
                
                @media (max-width: 768px) {
                    .pagination-responsive {
                        flex-wrap: wrap;
                        gap: 2px;
                    }
                    
                    .pagination-responsive .page-item {
                        margin: 0 1px;
                    }
                    
                    .pagination-responsive .page-link {
                        min-width: 35px;
                        min-height: 35px;
                        padding: 0.375rem 0.5rem;
                        font-size: 0.875rem;
                    }
                    
                    .pagination-responsive .page-item.active .page-link {
                        font-weight: bold;
                    }
                }
                
                @media (max-width: 480px) {
                    .pagination-responsive .page-link {
                        min-width: 32px;
                        min-height: 32px;
                        padding: 0.25rem 0.375rem;
                        font-size: 0.8rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        return html;
    }
    
    getPageRange() {
        const isMobile = window.innerWidth <= 768;
        const maxVisible = isMobile ? 3 : 5;
        
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        return { start, end };
    }
    

    addPaginationEventListeners() {
        const pageLinks = this.paginationContainer.querySelectorAll('.page-link[data-page]');
        
        pageLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                let targetElement = e.target;
                let page = targetElement.dataset.page;
                
                if (!page && targetElement.parentElement) {
                    page = targetElement.parentElement.dataset.page;
                }
                
                page = parseInt(page);
                
                if (page && page !== this.currentPage && page >= 1 && page <= this.totalPages) {
                    this.goToPage(page);
                }
            });
        });
    }
    

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.updatePagination();
        this.updateInfo();
        this.onPageChange(page, this.getCurrentPageData());
    }
    

    goToFirstPage() {
        if (this.totalPages > 0) {
            this.goToPage(1);
        }
    }
    

    goToLastPage() {
        if (this.totalPages > 0) {
            this.goToPage(this.totalPages);
        }
    }
    

    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }
    

    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }
    

    updateInfo() {
        if (!this.infoContainer) return;
        
        if (this.totalItems === 0) {
            this.infoContainer.innerHTML = 'ไม่มีข้อมูล';
            return;
        }
        
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        
        this.infoContainer.innerHTML = `
            แสดง ${startItem} - ${endItem} จากทั้งหมด ${this.totalItems} รายการ
        `;
    }
    

    reset() {
        this.currentPage = 1;
        this.updatePagination();
        this.updateInfo();
    }
    

    changeItemsPerPage(itemsPerPage) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        this.updatePagination();
        this.updateInfo();
        
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.value = itemsPerPage;
        }
        
        this.onItemsPerPageChange(this.itemsPerPage);
    }
    

    getState() {
        return {
            currentPage: this.currentPage,
            itemsPerPage: this.itemsPerPage,
            totalItems: this.totalItems,
            totalPages: this.totalPages
        };
    }
    

    setItemsPerPage(itemsPerPage) {
        if (itemsPerPage > 0 && itemsPerPage !== this.itemsPerPage) {
            this.changeItemsPerPage(itemsPerPage);
        }
    }
    
    
    addData(newData) {
        if (Array.isArray(newData)) {
            this.data.push(...newData);
            this.filteredData.push(...newData);
        } else {
            this.data.push(newData);
            this.filteredData.push(newData);
        }
        
        this.updateData(this.data, this.filteredData);
        
        this.goToLastPage();
    }
    

    removeData(filterFunction) {
        this.data = this.data.filter(filterFunction);
        this.filteredData = this.filteredData.filter(filterFunction);
        
        this.updateData(this.data, this.filteredData);
    }
    

    removeDataById(id, idField = 'id') {
        this.removeData(item => item[idField] != id);
    }
    

    updateDataById(id, updatedData, idField = 'id') {
        const dataIndex = this.data.findIndex(item => item[idField] == id);
        if (dataIndex !== -1) {
            this.data[dataIndex] = { ...this.data[dataIndex], ...updatedData };
        }
        
        const filteredIndex = this.filteredData.findIndex(item => item[idField] == id);
        if (filteredIndex !== -1) {
            this.filteredData[filteredIndex] = { ...this.filteredData[filteredIndex], ...updatedData };
        }
        
        this.updateData(this.data, this.filteredData);
    }
}
