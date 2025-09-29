export const API_BASE_URL = 'https://ambulance-backend.banglen.online' ;


export const API_ENDPOINTS = {

    AUTH: {
        LOGIN: `${API_BASE_URL}/auth/login`,
        REGISTER: `${API_BASE_URL}/auth/register`,  
        LOGOUT: `${API_BASE_URL}/auth/logout`,
        STATUS: `${API_BASE_URL}/auth/status`,
        PROVIDER_LOGIN: `${API_BASE_URL}/auth/login-provider`,
        PROVIDER_CALLBACK: `${API_BASE_URL}/auth/callback-provider`
    },
    

    MAIN_CHECK: {
        VIEW: `${API_BASE_URL}/main-check/checklist`,
        CREATE: `${API_BASE_URL}/main-check/checklist/add`,
        UPDATE: `${API_BASE_URL}/main-check/checklist/update`,
        DELETE: `${API_BASE_URL}/main-check/checklist/delete`,
        IMG: `${API_BASE_URL}/main-check/img`
    },
    

    MANAGE_CAR: {
        VIEW: `${API_BASE_URL}/manage-car/vehicles`,
        CREATE: `${API_BASE_URL}/manage-car/vehicles/add`,
        UPDATE: `${API_BASE_URL}/manage-car/vehicles/update`,
        DELETE: `${API_BASE_URL}/manage-car/vehicles/delete`
    },
    

    MANAGE_USER: {
        VIEW: `${API_BASE_URL}/manage-user/users`,
        UPDATE: `${API_BASE_URL}/manage-user/users/update`,
        DELETE: `${API_BASE_URL}/manage-user/users/delete`
    },
    

    MANAGE_CHECKLIST: {
        VIEW: `${API_BASE_URL}/manage-checklist/templates`,
        CREATE: `${API_BASE_URL}/manage-checklist/templates/add`, 
        UPDATE: `${API_BASE_URL}/manage-checklist/templates/update`,
        DELETE: `${API_BASE_URL}/manage-checklist/templates/delete`
    }
};


export const COMMON_HEADERS = {
    'Content-Type': 'application/json'
};


export function createAuthHeaders(token) {
    return {
        ...COMMON_HEADERS,
        'Authorization': `Bearer ${token}`
    };
}


export function getStoredToken() {
    return localStorage.getItem('token');
}


export function storeToken(token) {
    localStorage.setItem('token', token);
}


export function removeToken() {
    localStorage.removeItem('token');
}
