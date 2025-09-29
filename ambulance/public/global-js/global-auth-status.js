import { 
    API_ENDPOINTS, 
    COMMON_HEADERS, 
    createAuthHeaders,
    getStoredToken,
    removeToken
} from '/global-api.js';


export async function checkTokenValid(token) {
    if (!token) {
        return { valid: false, message: 'ไม่พบ token การเข้าสู่ระบบ' };
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.STATUS, {
            method: 'GET',
            headers: createAuthHeaders(token)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (result.success) {
                return { valid: true, message: null };
            } else {
                return { 
                    valid: false, 
                    message: result.message || 'Token ไม่ถูกต้อง'
                };
            }
        } else {
            const result = await response.json();
            return { 
                valid: false, 
                message: result.message || `การตรวจสอบสิทธิ์ล้มเหลว (${response.status})`
            };
        }
    } catch (error) {
        console.error('Token validation error:', error);
        return { 
            valid: false, 
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
        };
    }
}


export async function getUserData(token) {
    if (!token) return null;
    
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.STATUS, {
            method: 'GET',
            headers: createAuthHeaders(token)
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.success ? result.user : null;
        }
        return null;
    } catch (error) {
        console.error('Get user data error:', error);
        return null;
    }
}



export async function checkAdminAccess() {
    const token = getStoredToken();
    
    if (!token) {
        redirectToLogin();
        return false;
    }
    
    try {
        const userData = await getUserData(token);
        
        if (!userData) {
            removeToken();
            redirectToLogin();
            return false;
        }
        
        if (userData.role !== 'admin') {
            window.location.href = '/main';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Admin check error:', error);
        removeToken();
        redirectToLogin(); 
        return false;
    }
}


export function checkPermissionsAndSetVisibility(container) {

    setTimeout(() => {
        const currentUser = window.mainPageFunctions?.getCurrentUser?.();
        const inspectorColumn = container?.querySelector('.col-md-6:last-child');
        
        if (inspectorColumn) {
            if (currentUser && currentUser.role === 'admin') {
                inspectorColumn.style.display = 'block';
            } else {
                inspectorColumn.style.display = 'none';
                const inspectorSelect = container?.querySelector('#inspector-select');
                if (inspectorSelect) {
                    inspectorSelect.value = '';
                }
                if (window.currentFilters) {
                    window.currentFilters.inspector_name = null;
                }
            }
        }
    }, 100);
}


/**
 * Login function
 * @param {string} email - อีเมล
 * @param {string} password - รหัสผ่าน
 * @returns {Promise<object>} ผลลัพธ์การ login
 */
export async function loginUser(email, password) {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            headers: COMMON_HEADERS,
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        return {
            success: response.ok && result.success,
            data: result,
            status: response.status
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
            status: 500
        };
    }
}

/**
 * Register function
 * @param {object} userData - ข้อมูลผู้ใช้
 * @returns {Promise<object>} ผลลัพธ์การสมัครสมาชิก
 */
export async function registerUser(userData) {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            headers: COMMON_HEADERS,
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        return {
            success: response.ok && result.success,
            data: result,
            status: response.status
        };
    } catch (error) {
        console.error('Register error:', error);
        return {
            success: false,
            error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
            status: 500
        };
    }
}

/**
 * Logout function
 * @param {string} token - JWT token
 * @returns {Promise<object>} ผลลัพธ์การ logout
 */
export async function logoutUser(token) {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST',
            headers: createAuthHeaders(token)
        });
        
        const result = await response.json();
        return {
            success: response.ok && result.success,
            data: result,
            status: response.status
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
            status: 500
        };
    }
}

/**
 * Redirect ไปหน้า login
 */
export function redirectToLogin() {
    window.location.href = '/';
}

/**
 * Redirect ไปหน้า main
 */
export function redirectToMain() {
    window.location.href = '/main';
}

/**
 * Redirect ไปหน้า register
 */
export function redirectToRegister() {
    window.location.href = '/register';
}

/**
 * แสดง SweetAlert แทน alert ธรรมดา
 * @param {string} title - หัวข้อ
 * @param {string} text - ข้อความ
 * @param {string} icon - ไอคอน (success, error, warning, info)
 * @param {object} options - ตัวเลือกเพิ่มเติม
 */
export function showAlert(title, text, icon = 'info', options = {}) {
    const defaultOptions = {
        allowOutsideClick: true,
        allowEscapeKey: true,
        allowEnterKey: true
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#667eea',
        allowOutsideClick: finalOptions.allowOutsideClick,
        allowEscapeKey: finalOptions.allowEscapeKey,
        allowEnterKey: finalOptions.allowEnterKey
    });
}

/**
 * แสดง Toast notification
 * @param {string} message - ข้อความ
 * @param {string} icon - ไอคอน
 */
export function showToast(message, icon = 'success') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: icon,
        title: message
    });
}

/**
 * แสดง dialog ยืนยัน
 * @param {string} text - ข้อความยืนยัน
 * @param {object} customClass - CSS class สำหรับปุ่ม
 * @returns {Promise<boolean>} ผลลัพธ์การยืนยัน
 */
export async function showConfirm(text, customClass = {}) {
    const result = await Swal.fire({
        text: text,
        showCancelButton: true,
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก',
        customClass: customClass
    });

    return result.isConfirmed;
}

/**
 * แสดง loading dialog
 * @param {string} text - ข้อความ loading
 */
export function showLoading(text = 'กำลังโหลดข้อมูล...') {
    Swal.fire({
        text: text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * ซ่อน loading dialog
 */
export function hideLoading() {
    Swal.close();
}

