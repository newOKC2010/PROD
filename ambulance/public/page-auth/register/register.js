import { getStoredToken, removeToken } from '/global-api.js';
import { 
    checkTokenValid, 
    registerUser, 
    redirectToMain, 
    redirectToLogin,
    showAlert 
} from '/global-auth-status.js';
import { initPasswordToggle } from '/global-toggle.js';

window.addEventListener('DOMContentLoaded', async () => {
    initPasswordToggle();
    
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

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const cid = document.getElementById('cid').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const registerBtn = document.getElementById('registerBtn');
    

    if (!username || !email || !cid || !password || !confirmPassword) {
        showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        return;
    }
    

    if (password !== confirmPassword) {
        showAlert('รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านอีกครั้ง', 'error', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        return;
    }
    

    if (password.length < 6) {
        showAlert('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'warning', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        return;
    }
    

    if (!/^[0-9]{13}$/.test(cid)) {
        showAlert('เลขบัตรประชาชนไม่ถูกต้อง', 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก', 'warning', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        return;
    }
    

    registerBtn.disabled = true;
    registerBtn.textContent = 'กำลังสมัครสมาชิก...';
    
    try {
        const userData = { username, email, cid, password };
        const result = await registerUser(userData);
        
        if (result.success) {
            showAlert(
                'สมัครสมาชิกสำเร็จ!', 
                'คุณได้สมัครสมาชิกเรียบร้อยแล้ว กำลังเปลี่ยนไปหน้าเข้าสู่ระบบ', 
                'success',
                {
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }
            );
            
            setTimeout(() => {
                redirectToLogin();
            }, 2000);
            
        } else {
            showAlert(
                'สมัครสมาชิกไม่สำเร็จ', 
                result.data?.message || result.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก', 
                'error',
                {
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }
            );
        }
        
    } catch (error) {
        console.error('Register error:', error);
        showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่', 'error', {
            allowOutsideClick: false,
            allowEscapeKey: false
        });
    } finally {

        registerBtn.disabled = false;
        registerBtn.textContent = 'สมัครสมาชิก';
    }
});
