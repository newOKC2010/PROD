/**
 * Add Data Manager - จัดการการโหลดข้อมูลสำหรับ Modal Add
 */

import { API_ENDPOINTS, createAuthHeaders, getStoredToken } from '/global-api.js';

export class AddDataManager {
    constructor() {
        this.token = getStoredToken();
    }

    /**
     * โหลดข้อมูลรถยนต์
     */
    async loadVehicles() {
        try {
            const response = await fetch(API_ENDPOINTS.MANAGE_CAR.VIEW, {
                method: 'GET',
                headers: createAuthHeaders(this.token)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    data: result.data || []
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'ไม่สามารถโหลดข้อมูลรถได้'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลรถ: ' + error.message
            };
        }
    }

    /**
     * โหลดข้อมูล Checklist Templates
     */
    async loadChecklistTemplates() {
        try {
            const response = await fetch(API_ENDPOINTS.MANAGE_CHECKLIST.VIEW, {
                method: 'GET',
                headers: createAuthHeaders(this.token)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    data: result.data || []
                };
            } else {
                return {
                    success: false,
                    message: result.message || 'ไม่สามารถโหลดข้อมูล checklist ได้'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล checklist: ' + error.message
            };
        }
    }
    /**
     * ดึงข้อมูลรถตาม ID
     */
    getVehicleById(vehicleId, vehiclesData) {
        return vehiclesData.find(vehicle => vehicle.id.toString() === vehicleId.toString());
    }

    /**
     * ดึงข้อมูล checklist template ตาม ID
     */
    getChecklistById(checklistId, checklistsData) {
        return checklistsData.find(checklist => checklist.id.toString() === checklistId.toString());
    }

    /**
     * จัดเรียงข้อมูลรถตามชื่อ
     */
    sortVehiclesByName(vehicles) {
        return vehicles.sort((a, b) => {
            const nameA = (a.brand + ' ' + a.license_plate).toLowerCase();
            const nameB = (b.brand + ' ' + b.license_plate).toLowerCase();
            return nameA.localeCompare(nameB);
        });
    }

    /**
     * จัดเรียงข้อมูล checklist ตามลำดับ
     */
    sortChecklistsByOrder(checklists) {
        return checklists.sort((a, b) => {
            // ถ้ามี order field ให้ใช้ order, ถ้าไม่มีให้ใช้ id
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
        });
    }

    /**
     * กรองรถที่ใช้งานได้ (active)
     */
    filterActiveVehicles(vehicles) {
        return vehicles.filter(vehicle => 
            vehicle.status === 'active' || 
            vehicle.status === 'available' || 
            !vehicle.status // ถ้าไม่มี status field
        );
    }

    /**
     * กรอง checklist ที่ใช้งานได้ (active)
     */
    filterActiveChecklists(checklists) {
        return checklists.filter(checklist => 
            checklist.status === 'active' || 
            checklist.is_active === true || 
            !checklist.status // ถ้าไม่มี status field
        );
    }

    /**
     * สร้างข้อความแสดงชื่อรถ
     */
    formatVehicleName(vehicle) {
        const parts = [];
        
        if (vehicle.brand) parts.push(vehicle.brand);
        if (vehicle.license_plate) parts.push(`(${vehicle.license_plate})`);
        
        return parts.join(' ') || `รถ ID: ${vehicle.id}`;
    }

    /**
     * ตรวจสอบความถูกต้องของข้อมูลรถ
     */
    validateVehicleData(vehicles) {
        const validVehicles = [];
        const invalidVehicles = [];
        
        vehicles.forEach(vehicle => {
            if (vehicle.id && (vehicle.brand || vehicle.license_plate)) {
                validVehicles.push(vehicle);
            } else {
                invalidVehicles.push(vehicle);
            }
        });
        
        if (invalidVehicles.length > 0) {
            console.warn('Found invalid vehicle data:', invalidVehicles);
        }
        
        return validVehicles;
    }

    /**
     * ตรวจสอบความถูกต้องของข้อมูล checklist
     */
    validateChecklistData(checklists) {
        const validChecklists = [];
        const invalidChecklists = [];
        
        checklists.forEach(checklist => {
            if (checklist.id && checklist.name) {
                validChecklists.push(checklist);
            } else {
                invalidChecklists.push(checklist);
            }
        });
        
        if (invalidChecklists.length > 0) {
            console.warn('Found invalid checklist data:', invalidChecklists);
        }
        
        return validChecklists;
    }
} 