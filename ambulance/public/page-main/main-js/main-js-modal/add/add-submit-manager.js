/**
 * Add Submit Manager - จัดการการส่งข้อมูลไป Backend
 */

import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';

export class AddSubmitManager {
    constructor() {
        // ไม่ cache token ใน constructor แล้ว เพื่อป้องกันปัญหา token หมดอายุ
    }

    /**
     * ดึง token ใหม่ทุกครั้งที่ใช้งาน
     */
    getCurrentToken() {
        const token = getStoredToken();
        if (!token) {
            console.error('❌ Token ไม่พบใน localStorage - AddSubmitManager');
            throw new Error('ไม่พบ token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
        }
        return token;
    }

    /**
     * ส่งข้อมูล Checklist ใหม่
     */
    async submitChecklist(formData) {
        try {
            // ดึง token ใหม่ทุกครั้ง
            const token = this.getCurrentToken();
            
            const response = await fetch(API_ENDPOINTS.MAIN_CHECK.CREATE, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // ไม่ใส่ Content-Type เพราะ browser จะตั้งให้อัตโนมัติสำหรับ FormData
                },
                body: formData
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                return {
                    success: true,
                    message: result.message || 'เพิ่มการตรวจสอบสำเร็จ',
                    data: result.data
                };
            } else {
                // ใช้ error message จาก server โดยตรง
                return {
                    success: false,
                    message: result.message || `เกิดข้อผิดพลาด (HTTP ${response.status})`,
                    shouldCloseModal: true // Error จาก backend ควรปิด modal
                };
            }
            
        } catch (error) {
            // จัดการ network errors และ parsing errors
            let errorMessage = 'เกิดข้อผิดพลาดในการส่งข้อมูล';
            
            if (error.message.includes('ไม่พบ token')) {
                errorMessage = error.message; // ใช้ error message จาก getCurrentToken()
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'เกิดข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์';
            } else {
                errorMessage = error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            }
            
            return {
                success: false,
                message: errorMessage,
                shouldCloseModal: true // ให้ปิด modal หลังแสดง error
            };
        }
    }

    /**
     * ส่งข้อมูลแบบ JSON (สำหรับข้อมูลที่ไม่มีไฟล์)
     */
    async submitChecklistJSON(data) {
        try {
            // ดึง token ใหม่ทุกครั้ง
            const token = this.getCurrentToken();
            
            const response = await fetch(API_ENDPOINTS.MAIN_CHECK.CREATE, {
                method: 'POST',
                headers: createAuthHeaders(token),
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                return {
                    success: true,
                    message: result.message || 'เพิ่มการตรวจสอบสำเร็จ',
                    data: result.data
                };
            } else {
                // ใช้ error message จาก server โดยตรง
                return {
                    success: false,
                    message: result.message || `เกิดข้อผิดพลาด (HTTP ${response.status})`,
                    shouldCloseModal: true // Error จาก backend ควรปิด modal
                };
            }
            
        } catch (error) {
            // จัดการ network errors และ parsing errors
            let errorMessage = 'เกิดข้อผิดพลาดในการส่งข้อมูล';
            
            if (error.message.includes('ไม่พบ token')) {
                errorMessage = error.message; // ใช้ error message จาก getCurrentToken()
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'เกิดข้อผิดพลาดในการประมวลผลข้อมูลจากเซิร์ฟเวอร์';
            } else {
                errorMessage = error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            }
            
            return {
                success: false,
                message: errorMessage,
                shouldCloseModal: true // Error จาก backend ควรปิด modal
            };
        }
    }

    /**
     * เตรียมข้อมูลสำหรับส่ง FormData
     */
    prepareFormData(vehicleId, checkedDate, items, photoFiles) {
        const formData = new FormData();
        
        // ข้อมูลหลัก
        formData.append('vehicle_id', vehicleId);
        formData.append('checked_date', checkedDate);
        
        // ข้อมูล items
        formData.append('items', JSON.stringify(items));
        
        // เพิ่มรูปภาพ
        if (photoFiles && photoFiles.size > 0) {
            photoFiles.forEach((files, checklistId) => {
                files.forEach((file) => {
                    formData.append(`photos_${checklistId}`, file);
                });
            });
        }
        
        return formData;
    }

    /**
     * เตรียมข้อมูลสำหรับส่ง JSON
     */
    prepareJSONData(vehicleId, checkedDate, items) {
        return {
            vehicle_id: vehicleId,
            checked_date: checkedDate,
            items: items
        };
    }

    /**
     * ตรวจสอบการเชื่อมต่อก่อนส่งข้อมูล
     */
    async checkConnection() {
        try {
            const response = await fetch(API_ENDPOINTS.AUTH.STATUS, {
                method: 'GET',
                headers: createAuthHeaders(this.getCurrentToken())
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * ส่งข้อมูลแบบ Retry (ลองใหม่ถ้าล้มเหลว)
     */
    async submitWithRetry(formData, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.submitChecklist(formData);
                
                if (result.success) {
                    return result;
                } else {
                    lastError = new Error(result.message);
                    
                    // ถ้าเป็นข้อผิดพลาดจาก validation ไม่ต้อง retry
                    if (result.message && result.message.includes('validation')) {
                        break;
                    }
                }
                
            } catch (error) {
                lastError = error;
                
                // รอสักครู่ก่อน retry (ยกเว้น attempt สุดท้าย)
                if (attempt < maxRetries) {
                    await this.delay(1000 * attempt); // รอ 1, 2, 3 วินาที
                }
            }
        }
        
        return {
            success: false,
            message: lastError ? lastError.message : 'ไม่สามารถส่งข้อมูลได้หลังจากลองหลายครั้ง'
        };
    }

    /**
     * รอสักครู่
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * ตรวจสอบขนาดข้อมูลก่อนส่ง
     */
    validateDataSize(formData) {
        let totalSize = 0;
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        for (let pair of formData.entries()) {
            if (pair[1] instanceof File) {
                totalSize += pair[1].size;
            } else {
                totalSize += new Blob([pair[1]]).size;
            }
        }
        
        if (totalSize > maxSize) {
            return {
                valid: false,
                message: `ข้อมูลมีขนาดใหญ่เกิน ${Math.round(maxSize / 1024 / 1024)}MB (ปัจจุบัน: ${Math.round(totalSize / 1024 / 1024)}MB)`
            };
        }
        
        return { valid: true };
    }

    /**
     * บีบอัดรูปภาพก่อนส่ง (ถ้าจำเป็น)
     */
    async compressImages(formData) {
        // Implementation สำหรับบีบอัดรูปภาพ
        // สามารถใช้ library เช่น browser-image-compression
        return formData;
    }

    /**
     * ส่งข้อมูลทีละส่วน (สำหรับข้อมูลขนาดใหญ่)
     */
    async submitInChunks(vehicleId, checkedDate, items, photoFiles) {
        try {
            // ส่งข้อมูลหลักก่อน
            const mainData = this.prepareJSONData(vehicleId, checkedDate, items);
            const mainResult = await this.submitChecklistJSON(mainData);
            
            if (!mainResult.success) {
                return mainResult;
            }
            
            const checklistId = mainResult.data?.id;
            if (!checklistId) {
                return {
                    success: false,
                    message: 'ไม่ได้รับ ID ของการตรวจสอบที่สร้าง'
                };
            }
            
            // ส่งรูปภาพทีละ checklist item
            if (photoFiles && photoFiles.size > 0) {
                for (let [itemChecklistId, files] of photoFiles.entries()) {
                    if (files.length > 0) {
                        const photoResult = await this.uploadPhotosForItem(checklistId, itemChecklistId, files);
                        if (!photoResult.success) {
                            console.warn(`Failed to upload photos for item ${itemChecklistId}:`, photoResult.message);
                        }
                    }
                }
            }
            
            return {
                success: true,
                message: 'เพิ่มการตรวจสอบสำเร็จ',
                data: mainResult.data
            };
            
        } catch (error) {
            console.error('Error submitting in chunks:', error);
            return {
                success: false,
                message: 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message
            };
        }
    }

    /**
     * อัปโหลดรูปภาพสำหรับ item เฉพาะ
     */
    async uploadPhotosForItem(checklistId, itemChecklistId, files) {
        try {
            const formData = new FormData();
            formData.append('checklist_id', checklistId);
            formData.append('item_checklist_id', itemChecklistId);
            
            files.forEach(file => {
                formData.append('photos', file);
            });
            
            const response = await fetch(`${API_ENDPOINTS.MAIN_CHECK.CREATE}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getCurrentToken()}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return {
                success: result.success,
                message: result.message
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'ไม่สามารถอัปโหลดรูปภาพได้: ' + error.message
            };
        }
    }

    /**
     * ดึงสถานะการส่งข้อมูล
     */
    async getSubmissionStatus(submissionId) {
        try {
            const response = await fetch(`${API_ENDPOINTS.MAIN_CHECK.VIEW}/${submissionId}/status`, {
                method: 'GET',
                headers: createAuthHeaders(this.getCurrentToken())
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
} 