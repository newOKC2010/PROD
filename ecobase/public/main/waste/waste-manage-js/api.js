/**
 * API Service สำหรับจัดการข้อมูลขยะ
 * จัดการการเชื่อมต่อกับ API ในฝั่ง Backend
 */

// ข้อมูลบันทึกขยะ
export async function fetchWasteRecords(page = 1, pageSize = 10, filters = {}) {
  try {
    // สร้าง URL สำหรับ API พร้อมพารามิเตอร์
    let url = `/api/waste/records?page=${page}&pageSize=${pageSize}`;

    // เพิ่มตัวกรองถ้ามี
    if (filters.startDate) url += `&startDate=${filters.startDate}`;
    if (filters.endDate) url += `&endDate=${filters.endDate}`;
    if (filters.wasteTypeId) url += `&wasteTypeId=${filters.wasteTypeId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลขยะ:", error);
    throw error;
  }
}

export async function fetchWasteRecordById(id) {
  try {
    const response = await fetch(`/api/waste/records/${id}`);

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการดึงข้อมูลขยะ ID: ${id}:`, error);
    throw error;
  }
}

export async function addWasteRecord(data) {
  try {
    const response = await fetch("/api/waste/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเพิ่มข้อมูลขยะ:", error);
    throw error;
  }
}

export async function updateWasteRecord(id, data) {
  try {
    const response = await fetch(`/api/waste/records/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // ดึงข้อมูล response ไม่ว่า status จะเป็นอะไรก็ตาม
    const responseData = await response.json();

    // ถ้าเป็น 404 ให้ส่งข้อความจาก server กลับไปแทนที่จะโยน error
    if (response.status === 404) {
      return {
        success: false,
        message: responseData.message || "ไม่พบข้อมูลบันทึกขยะ",
        status: 404,
      };
    }

    // ถ้าไม่ใช่ 200-299 และไม่ใช่ 404 ให้โยน error ตามเดิม
    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    return responseData;
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการแก้ไขข้อมูลขยะ ID: ${id}:`, error);
    throw error;
  }
}

export async function deleteWasteRecord(id) {
  try {
    const response = await fetch(`/api/waste/records/${id}`, {
      method: "DELETE",
    });

    // ดึงข้อมูล response ไม่ว่า status จะเป็นอะไรก็ตาม
    const responseData = await response.json();

    // ถ้าเป็น 404 ให้ส่งข้อความจาก server กลับไปแทนที่จะโยน error
    if (response.status === 404) {
      return {
        success: false,
        message: responseData.message || "ไม่พบข้อมูลบันทึกขยะ",
        status: 404,
      };
    }

    // ถ้าไม่ใช่ 200-299 และไม่ใช่ 404 ให้โยน error ตามเดิม
    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    return responseData;
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการลบข้อมูลขยะ ID: ${id}:`, error);
    throw error;
  }
}

// ข้อมูลประเภทขยะ
export async function fetchWasteTypes() {
  try {
    const response = await fetch("/api/waste/types");

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลประเภทขยะ:", error);
    throw error;
  }
}
