
import { 
    getStoredToken, 
    removeToken 
} from '/global-api.js';
import { 
    getUserData, 
    redirectToLogin,
    checkTokenValid 
} from '/global-auth-status.js';
import { initializeNavigation } from '/global-nav.js';

export class MainAuthManager {
    constructor() {
        this.currentUser = null;
        this.tokenCheckInterval = null;
    }


    async initialize() {
        const result = await this.validateAccess();
        if (result) {
            this.startPeriodicTokenCheck();
        }
        return result;
    }


    startPeriodicTokenCheck() {
        this.tokenCheckInterval = setInterval(async () => {
            const token = getStoredToken();
            if (!token) {
                console.warn('Token หายไป - กำลัง redirect ไป login');
                this.handleAuthFailure();
                return;
            }
            
            const tokenValidation = await checkTokenValid(token);
            if (!tokenValidation.valid) {
                console.warn('Token หมดอายุ - กำลัง redirect ไป login');
                this.handleAuthFailure();
            }
        }, 5 * 60 * 1000); // 5 นาที
    }


    stopPeriodicTokenCheck() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }


    async validateAccess() {
        const token = getStoredToken();
        
        if (!token) {
            redirectToLogin();
            return false;
        }
        
        try {
            const userData = await getUserData(token);
            
            if (userData) {
                this.currentUser = userData;
                initializeNavigation(this.currentUser);
                return true;
            } else {
                this.handleAuthFailure();
                return false;
            }
            
        } catch (error) {
            console.error('Auth validation error:', error);
            this.handleAuthFailure();
            return false;
        }
    }


    async validateTokenBeforeAction() {
        const token = getStoredToken();
        
        if (!token) {
            console.error('Token ไม่พบใน localStorage');
            alert('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            this.handleAuthFailure();
            return false;
        }
        
        try {
            const tokenValidation = await checkTokenValid(token);
            
            if (!tokenValidation.valid) {
                console.error('Token validation failed:', tokenValidation.message);
                alert(tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่');
                this.handleAuthFailure();
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('Token validation error:', error);
            alert('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ กรุณาเข้าสู่ระบบใหม่');
            this.handleAuthFailure();
            return false;
        }
    }


    handleAuthFailure() {
        this.stopPeriodicTokenCheck();
        removeToken();
        redirectToLogin();
    }


    getCurrentUser() {
        return this.currentUser;
    }


    isAuthenticated() {
        return this.currentUser !== null;
    }
} 