// โมดูลสำหรับติดต่อกับ API

// ฟังก์ชันสำหรับดึงข้อมูล Dashboard
export async function fetchDashboardData(startDate, endDate) {
    try {
        // สร้าง URL สำหรับเรียก API
        let url = '/api/dashboard-data/monthly-summary';

        // เพิ่มพารามิเตอร์ startDate และ endDate ถ้ามี
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }

        // เรียก API
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        // ตรวจสอบสถานะการตอบกลับ
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        // แปลงข้อมูลเป็น JSON
        const data = await response.json();

        return data;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเรียกข้อมูล Dashboard:', error);
        throw error;
    }
}

