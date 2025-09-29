
import { showAlert, showToast, redirectToMain } from '/global-auth-status.js';
import { storeToken, API_ENDPOINTS } from '/global-api.js';

export async function loginWithProvider() {
    try {
        showToast('กำลังเปลี่ยนเส้นทางไปยังระบบยืนยันตัวตน...', 'info');
        
        setTimeout(() => {
            window.location.href = API_ENDPOINTS.AUTH.PROVIDER_LOGIN;
        }, 500);
        
    } catch (error) {
        console.error('Provider login error:', error);
        showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่', 'error', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
    }
}

export async function handleProviderCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const token = urlParams.get('token');
    const message = urlParams.get('message');
    
    if (success === null) return false;
    
    if (success === 'true' && token) {
        storeToken(token);
        showAlert('เข้าสู่ระบบสำเร็จ', message , 'success', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        setTimeout(() => redirectToMain(), 3000);
        return true;
    } else {
        showAlert('เข้าสู่ระบบไม่สำเร็จ', message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return false;
    }
}

export function initProviderLogin() {
    const providerBtn = document.getElementById('providerLoginBtn');
    if (providerBtn) {
        providerBtn.addEventListener('click', loginWithProvider);
    }
}
