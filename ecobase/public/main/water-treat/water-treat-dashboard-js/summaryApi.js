// ฟังก์ชันสำหรับดึงข้อมูลสรุป
export async function fetchSummaryStats(startDate, endDate) {
    try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetch(`/api/dashboard-data/summary-stats?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสรุป:", error);
        throw error;
    }
} 