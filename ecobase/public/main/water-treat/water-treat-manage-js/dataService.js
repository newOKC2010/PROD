import { callAPI } from "./utilities.js";

let userRole = "";
let userId = "";

// ฟังก์ชันสำหรับตั้งค่าข้อมูลผู้ใช้
export function setUserInfo(role, id) {
  userRole = role;
  userId = id;
}

// ฟังก์ชันสำหรับโหลดข้อมูลจาก API
export async function loadEnvironmentalData(page, pageSize, startDate = null, endDate = null) {
  try {
    // สร้าง URL พร้อมพารามิเตอร์
    let url = `/api/environmental-data?page=${page}&pageSize=${pageSize}`;

    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const result = await callAPI(url);

    if (result && result.success) {
      return {
        data: result.data,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize),
      };
    } else {
      throw new Error(result?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
    throw error;
  }
}

// ฟังก์ชันสำหรับบันทึกการแก้ไข
export async function saveEdit(id, formData) {
  try {
    let method, url;

    if (id) {
      // ถ้ามี id แสดงว่าเป็นการแก้ไข
      method = "PUT";
      url = `/api/environmental-data/${id}`;
    } else {
      // ถ้าไม่มี id แสดงว่าเป็นการเพิ่มใหม่
      method = "POST";
      url = "/api/add-environmental-data";
    }

    const result = await callAPI(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (result && result.success) {
      return result.data;
    } else {
      throw new Error(result?.message || `เกิดข้อผิดพลาดในการ${id ? "แก้ไข" : "เพิ่ม"}ข้อมูล`);
    }
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการ${id ? "แก้ไข" : "เพิ่ม"}ข้อมูล:`, error);
    throw error;
  }
}

// ฟังก์ชันสำหรับลบข้อมูล
export async function deleteData(id) {
  try {
    const result = await callAPI(`/api/environmental-data/${id}`, {
      method: "DELETE",
    });

    if (result && result.success) {
      return true;
    } else {
      throw new Error(result?.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบข้อมูล:", error);
    throw error;
  }
}

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
export function getUserRole() {
  return userRole;
}
