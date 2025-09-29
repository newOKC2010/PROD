import { getStoredToken, storeToken, removeToken } from '/global-api.js';
import { 
    checkTokenValid, 
    loginUser, 
    redirectToMain, 
    showAlert, 
    showToast   
} from '/global-auth-status.js';
import { initPasswordToggle } from '/global-toggle.js';
import { initProviderLogin } from '/login-provider.js';

window.addEventListener('DOMContentLoaded', async () => {
    initPasswordToggle();
    initProviderLogin();
    
    const { handleProviderCallback } = await import('/login-provider.js');
    const isOAuthCallback = await handleProviderCallback();
    
    if (isOAuthCallback) return;
    
    const token = getStoredToken();
    if (token) {
        const tokenCheck = await checkTokenValid(token);
        if (tokenCheck.valid) {
            redirectToMain();
        } else {
            removeToken();
        }
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกอีเมลและรหัสผ่าน', 'warning');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'กำลังเข้าสู่ระบบ...';
    
    try {
        const result = await loginUser(email, password);
        
        if (result.success) {
            storeToken(result.data.token);
            
            showToast('เข้าสู่ระบบสำเร็จ', 'success');
            
            setTimeout(() => {
                redirectToMain();
            }, 1000);
            
        } else {
            showAlert(
                'เข้าสู่ระบบไม่สำเร็จ', 
                result.data?.message || result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 
                'error'
            );
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'เข้าสู่ระบบ';
    }
});
