/**
 * ดึงข้อมูลปริมาณขยะรายเดือน
 * @param {number} wasteTypeId - รหัสประเภทขยะ (1-4)
 * @param {string} startDate - วันที่เริ่มต้น (YYYY-MM-DD)
 * @param {string} endDate - วันที่สิ้นสุด (YYYY-MM-DD)
 * @returns {Promise<Object>} ข้อมูลปริมาณขยะรายเดือน
 */
export async function fetchMonthlyWasteData(wasteTypeId, startDate, endDate) {
  try {
    // สร้าง query parameters
    const params = new URLSearchParams();
    params.append("wasteTypeId", wasteTypeId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    // เรียกใช้ API จริง
    const response = await fetch(`/api/waste/dashboard/monthly-waste-data?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเรียก API:", error);
    throw error;
  }
}

/**
 * ดึงข้อมูลเปรียบเทียบปริมาณขยะแต่ละประเภท
 * @param {string} startDate - วันที่เริ่มต้น (YYYY-MM-DD)
 * @param {string} endDate - วันที่สิ้นสุด (YYYY-MM-DD)
 * @returns {Promise<Object>} ข้อมูลเปรียบเทียบปริมาณขยะแต่ละประเภท
 */
export async function fetchComparisonWasteData(startDate, endDate) {
  try {
    // สร้าง query parameters
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    // เรียกใช้ API
    const response = await fetch(`/api/waste/dashboard/comparison-waste-data?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`เกิดข้อผิดพลาด: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเรียกข้อมูลเปรียบเทียบ:", error);
    throw error;
  }
}

/**
 * ดึงข้อมูลปริมาณขยะรายวันตามช่วงวันที่
 * @param {string} startDate - วันที่เริ่มต้น (YYYY-MM-DD)
 * @param {string} endDate - วันที่สิ้นสุด (YYYY-MM-DD)
 * @param {number} wasteTypeId - รหัสประเภทขยะ (ไม่จำเป็น)
 * @returns {Promise<Object>} ข้อมูลปริมาณขยะรายวัน
 */
export async function fetchDailyWasteData(startDate, endDate, wasteTypeId = null) {
  try {
    // สร้าง URL สำหรับ API
    let url = `/api/waste/dashboard/daily-waste-data?startDate=${startDate}&endDate=${endDate}`;
    
    // เพิ่ม wasteTypeId ถ้ามีการระบุ
    if (wasteTypeId) {
      url += `&wasteTypeId=${wasteTypeId}`;
    }
    
    // ส่ง request ไปยัง API
    const response = await fetch(url);
    
    // ตรวจสอบว่า response เป็น OK หรือไม่
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // แปลง response เป็น JSON
    const data = await response.json();
    
    // ตรวจสอบว่า response มี success เป็น true หรือไม่
    if (!data.success) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลรายวัน');
    }
    
    // ส่งข้อมูลกลับ
    return data;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเรียกข้อมูลรายวัน:', error);
    throw error;
  }
}
