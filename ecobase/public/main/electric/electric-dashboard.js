document.addEventListener('DOMContentLoaded', function() {
    console.log('หน้าระบบไฟฟ้าถูกโหลดเมื่อ:', new Date().toLocaleString());
    
    // สร้างฟังก์ชันจำลองการอัปเดตข้อมูลแบบเรียลไทม์
    function simulateRealTimeData() {
        // สุ่มค่าการใช้พลังงาน
        const dailyUsage = Math.floor(Math.random() * 50) + 100; // 100-150 kWh
        const monthlyUsage = Math.floor(Math.random() * 500) + 2000; // 2000-2500 kWh
        
        // สุ่มค่าเปอร์เซ็นต์ประสิทธิภาพ
        const efficiency = Math.floor(Math.random() * 30) + 70; // 70-100%
        
        // อัปเดตค่าในหน้าเว็บ
        document.querySelector('.dashboard-card:nth-child(2) p:nth-child(2) strong').textContent = `${dailyUsage} kWh`;
        document.querySelector('.dashboard-card:nth-child(2) p:nth-child(3) strong').textContent = `${monthlyUsage} kWh`;
        
        const meterValue = document.querySelector('.meter-value');
        meterValue.style.width = `${efficiency}%`;
        meterValue.textContent = `${efficiency}%`;
        
        // สุ่มสถานะระบบ
        if (Math.random() > 0.9) { // 10% โอกาสที่ระบบจะมีปัญหา
            document.querySelector('.status-active').textContent = 'มีปัญหา';
            document.querySelector('.status-active').className = 'status-inactive';
        } else {
            const statusElement = document.querySelector('.status-inactive, .status-active');
            statusElement.textContent = 'ทำงานปกติ';
            statusElement.className = 'status-active';
        }
        
        console.log('อัปเดตข้อมูลระบบไฟฟ้าเมื่อ:', new Date().toLocaleString());
    }
    
    // จำลองการอัปเดตข้อมูลทุก 5 วินาที
    setInterval(simulateRealTimeData, 5000);
    
    // เรียกฟังก์ชันครั้งแรกเมื่อโหลดหน้า
    simulateRealTimeData();
    
    // ตรวจสอบสถานะการล็อกอินเพื่อแสดง/ซ่อนปุ่มจัดการ
    checkAuthStatus();
});
