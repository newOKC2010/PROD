
import { MainTableManager } from '/main-table.js';
import { SearchFilterManager } from '/main-search.js';
import { MainModalAdd } from '/main-modal-add.js';

export class MainComponentInitializer {
    constructor() {
        this.tableManager = null;
        this.searchFilterManager = null;
        this.modalAddManager = null;
        this.currentUser = null;
    }


    async initialize(currentUser) {
        this.currentUser = currentUser;
        
        const pageType = this.detectPageType();
        
        if (pageType === 'main') {
            await this.setupMainPage();
        } else if (pageType === 'manage') {
            this.setupManagePage();
        } else {
            this.setupUnknownPage();
        }
    }


    detectPageType() {
        const isMainPage = document.getElementById('checklistTable') !== null;
        const isManagePage = document.querySelector('.manage-car-box, .manage-checklist-box, .manage-users-box') !== null;
        
        if (isMainPage) return 'main';
        if (isManagePage) return 'manage';
        return 'unknown';
    }


    async setupMainPage() {
        console.log('Setting up main checklist page...');
        
        await this.loadRequiredScripts();
        
        this.initializeModernDropdowns();
        
        this.initializeTableManager();
        this.initializeSearchFilterManager();
        this.initializeModalAddManager();
        
        console.log('Main checklist page setup complete');
    }


    setupManagePage() {
        console.log('Management page detected - basic setup only');
    }


    setupUnknownPage() {
        console.log('Unknown page type - basic setup only');
    }


    loadRequiredScripts() {
        return new Promise((resolve) => {
            let scriptsLoaded = 0;
            const totalScripts = 2;
            
            const checkAllLoaded = () => {
                scriptsLoaded++;
                if (scriptsLoaded === totalScripts) {
                    resolve();
                }
            };
            
            this.loadScript('main-modern-dropdown.js', checkAllLoaded);
            
            this.loadScript('main-calendar.js', checkAllLoaded);
        });
    }


    loadScript(src, callback) {
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.onload = callback;
            script.onerror = callback;
            document.head.appendChild(script);
        } else {
            callback();
        }
    }


    initializeModernDropdowns() {
        if (window.initializeModernDropdowns) {
            console.log('Initializing modern dropdowns...');
            window.initializeModernDropdowns();
            
            this.validateDropdownInitialization();
        }
    }


    validateDropdownInitialization() {
        const itemsDropdown = document.getElementById('itemsPerPageDropdown');
        
        if (itemsDropdown && itemsDropdown.modernDropdownInstance) {
            console.log('Items per page dropdown initialized successfully');
        } else {
            console.warn('Items per page dropdown not initialized');
            this.retryDropdownInitialization(itemsDropdown);
        }
    }


    retryDropdownInitialization(itemsDropdown) {
        setTimeout(() => {
            if (itemsDropdown && !itemsDropdown.modernDropdownInstance) {
                itemsDropdown.modernDropdownInstance = new window.ModernDropdown(itemsDropdown);
                console.log('Items per page dropdown initialized on retry');
            }
        }, 100);
    }


    initializeTableManager() {
        const elements = this.getTableElements();
        
        if (!elements.tableContainer) {
            console.log('Table container not found - not on main checklist page');
            return;
        }
        
        this.tableManager = new MainTableManager({
            ...elements,
            currentUser: this.currentUser
        });
        
        this.tableManager.loadChecklistData();
    }


    getTableElements() {
        return {
            tableContainer: document.getElementById('checklistTable'),
            paginationContainer: document.getElementById('paginationContainer'),
            infoContainer: document.getElementById('tableInfo'),
            itemsPerPageSelect: document.getElementById('itemsPerPage'),
            loadingIndicator: document.getElementById('loadingIndicator')
        };
    }


    initializeSearchFilterManager() {
        const searchFilterContainer = document.getElementById('searchContainer');
        
        if (!searchFilterContainer) {
            console.log('Search filter container not found - not on main checklist page');
            return;
        }
        
        if (!this.tableManager) {
            console.log('Table manager not initialized - skipping search filter');
            return;
        }
        
        this.searchFilterManager = new SearchFilterManager({
            tableManager: this.tableManager,
            searchContainer: searchFilterContainer
        });
    }


    initializeModalAddManager() {
        const addNewBtn = document.getElementById('addNewBtn');
        
        if (!addNewBtn) {
            console.log('Add new button not found - not on main checklist page');
            return;
        }
        
        this.modalAddManager = new MainModalAdd();
        console.log('Modal Add Manager initialized');
    }


    getManagers() { 
        return {
            tableManager: this.tableManager,
            searchFilterManager: this.searchFilterManager,
            modalAddManager: this.modalAddManager
        };
    }
} 