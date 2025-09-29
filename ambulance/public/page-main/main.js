import { MainAuthManager } from '/main-auth-manager.js';
import { MainComponentInitializer } from '/main-component-initializer.js';
import { MainEventHandler } from '/main-event-handler.js';


let authManager = null;
let componentInitializer = null;
let eventHandler = null;


window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 เริ่มต้นระบบ Main Page...');
    await initializeApplication();
});


async function initializeApplication() {
    try {
        authManager = new MainAuthManager();
        const isAuthenticated = await authManager.initialize();
        
        if (!isAuthenticated) {
            console.warn('❌ Authentication ล้มเหลว');
            return;
        }
        
        componentInitializer = new MainComponentInitializer();
        await componentInitializer.initialize(authManager.getCurrentUser());
        

        eventHandler = new MainEventHandler(authManager, componentInitializer);
        eventHandler.initialize();
        
        console.log('🎉 Application เริ่มต้นสำเร็จ');
        
        window.debugAuth = () => {
            console.log('=== AUTH DEBUG INFO ===');
            console.log('Current User:', authManager?.getCurrentUser());
            console.log('Is Authenticated:', authManager?.isAuthenticated());
            console.log('Stored Token:', localStorage.getItem('token'));
            console.log('Token Length:', localStorage.getItem('token')?.length || 0);
        };
        
    } catch (error) {
        console.error('💥 Application initialization error:', error);
        console.error('Error Stack:', error.stack);
        
        if (window.Swal) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเริ่มต้นระบบได้ กรุณารีเฟรชหน้า',
                icon: 'error',
                confirmButtonText: 'รีเฟรช',
                allowOutsideClick: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            alert('เกิดข้อผิดพลาดในการเริ่มต้นระบบ กรุณารีเฟรชหน้า');
            window.location.reload();
        }
        
        authManager?.handleAuthFailure();
    }
}


