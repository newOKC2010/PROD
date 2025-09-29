document.addEventListener('DOMContentLoaded', function() {
    console.log('หน้าสมัครสมาชิกถูกโหลดเมื่อ:', new Date().toLocaleString());
    
    const registerForm = document.getElementById('register-form');
    const passwordToggle = document.getElementById('password-toggle');
    const confirmPasswordToggle = document.getElementById('confirm-password-toggle');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const eyeIcon = document.getElementById('eye-icon');
    const confirmEyeIcon = document.getElementById('confirm-eye-icon');
    
    // ฟังก์ชัน toggle การแสดงรหัสผ่าน
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            // สลับประเภทของ input ระหว่าง password กับ text
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // สลับไอคอนตา
            if (type === 'password') {
                eyeIcon.className = 'fa-solid fa-eye';
            } else {
                eyeIcon.className = 'fa-solid fa-eye-slash';
            }
        });
    }
    
    // ฟังก์ชัน toggle การแสดงรหัสผ่านยืนยัน
    if (confirmPasswordToggle) {
        confirmPasswordToggle.addEventListener('click', function() {
            // สลับประเภทของ input ระหว่าง password กับ text
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            
            // สลับไอคอนตา
            if (type === 'password') {
                confirmEyeIcon.className = 'fa-solid fa-eye';
            } else {
                confirmEyeIcon.className = 'fa-solid fa-eye-slash';
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fullname = document.getElementById('fullname').value.trim();
            const cid = document.getElementById('cid').value.trim();
            const email = document.getElementById('email').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // ตรวจสอบว่าข้อมูลครบทุกฟิลด์หรือไม่
            // ตรวจสอบข้อมูลที่จำเป็น
            const validations = [
                { value: fullname, message: 'กรุณากรอกชื่อ-นามสกุล', field: 'fullname' },
                { value: email, message: 'กรุณากรอกอีเมล', field: 'email' },
                { value: cid, message: 'กรุณากรอกเลขประจำตัวประชาชน', field: 'cid' },
                { value: username, message: 'กรุณากรอกชื่อผู้ใช้', field: 'username' },
                { value: password, message: 'กรุณากรอกรหัสผ่าน', field: 'password' },
                { value: confirmPassword, message: 'กรุณากรอกยืนยันรหัสผ่าน', field: 'confirm-password' }
            ];
            
            for (const validation of validations) {
                if (!validation.value) {
                    alert(validation.message);
                    document.getElementById(validation.field).focus();
                    return;
                }
            }
            
            // ตรวจสอบความยาวเลขประจำตัวประชาชน
            if (cid.length !== 13) {
                alert('เลขประจำตัวประชาชนต้องมี 13 หลัก');
                document.getElementById('cid').focus();
                return;
            }
            
            // ตรวจสอบรหัสผ่านตรงกัน
            if (password !== confirmPassword) {
                alert('รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน');
                document.getElementById('confirm-password').focus();
                return;
            }
            // ตรวจสอบรูปแบบการกรอกข้อมูลพื้นฐาน
            const thaiNamePattern = /^[ก-๙\s]+$/;
            const usernamePattern = /^[a-zA-Z0-9_]+$/;
            const cidPattern = /^\d{13}$/;
            
            if (!thaiNamePattern.test(fullname)) {
                alert('ชื่อ-นามสกุลต้องเป็นภาษาไทยเท่านั้น');
                document.getElementById('fullname').focus();
                return;
            }
            
            if (!usernamePattern.test(username)) {
                alert('ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น');
                document.getElementById('username').focus();
                return;
            }
            
            if (!cidPattern.test(cid)) {
                alert('เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น');
                document.getElementById('cid').focus();
                return;
            }
            // ปิดใช้งานปุ่มขณะส่งข้อมูล
            const submitButton = document.querySelector('.form-button');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'กำลังดำเนินการ...';
            
            try {
                // ส่งข้อมูลไปลงทะเบียนที่ backend โดย backend จะทำการตรวจสอบเลขบัตรประชาชน
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username, 
                        password, 
                        full_name: fullname, 
                        email,
                        cid
                    })
                });
                
                // เปิดใช้งานปุ่มอีกครั้ง
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
                    window.location.href = '/login.html';
                } else {
                    // จัดการข้อความผิดพลาดตามรูปแบบที่ได้รับจาก backend
                    let errorMessage = 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
                    
                    if (data && data.message) {
                        if (data.message.includes('ไม่พบหมายเลขบัตรประชาชน') || 
                            data.message.includes('ไม่พบข้อมูลแพทย์')) {
                            errorMessage = 'ไม่พบข้อมูลเลขบัตรประชาชนในระบบ ไม่สามารถลงทะเบียนได้';
                        } else {
                            errorMessage = data.message;
                        }
                    }
                    
                    alert(errorMessage);
                }
            } catch (error) {
                // เปิดใช้งานปุ่มอีกครั้งในกรณีเกิดข้อผิดพลาด
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                
                console.error('เกิดข้อผิดพลาด:', error);
                alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง');
            }
        });
    }
});