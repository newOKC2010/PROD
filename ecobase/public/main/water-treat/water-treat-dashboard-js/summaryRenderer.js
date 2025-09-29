// ฟังก์ชันสำหรับแสดงผล Card สรุปข้อมูล
import { DASHBOARD_ICONS } from './icons.js';
import { fetchSummaryStats } from './summaryApi.js';
import { formatNumber } from './utilities.js';

// ฟังก์ชันสำหรับแสดงผล Card สรุปค่าเฉลี่ย
export function renderSummaryCards(summaryData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!summaryData || summaryData.noData) {
        const noDataMsg = document.createElement('div');
        noDataMsg.className = 'no-data-message';
        noDataMsg.textContent = 'ไม่พบข้อมูลในช่วงเวลาที่เลือก';
        container.appendChild(noDataMsg);
        return;
    }

    const { averages, status_percentages } = summaryData.summaryStats;

    // สร้าง Card สรุปค่าเฉลี่ย
    const averageCards = [
        {
            title: 'การใช้ไฟฟ้าเฉลี่ย',
            value: formatNumber(averages.electricity),
            unit: 'kWh',
            icon: DASHBOARD_ICONS.electricity,
            color: '#3498db'
        },
        {
            title: 'การใช้น้ำเฉลี่ย',
            value: formatNumber(averages.water),
            unit: 'ลบ.ม.',
            icon: DASHBOARD_ICONS.water,
            color: '#2ecc71'
        },
        {
            title: 'น้ำเสียเข้าระบบเฉลี่ย',
            value: formatNumber(averages.wastewater_in),
            unit: 'ลบ.ม.',
            icon: DASHBOARD_ICONS.wastewater,
            color: '#9b59b6'
        },
        {
            title: 'น้ำออกจากระบบเฉลี่ย',
            value: formatNumber(averages.wastewater_out),
            unit: 'ลบ.ม.',
            icon: DASHBOARD_ICONS.wastewater,
            color: '#27ae60'
        },
        {
            title: 'การใช้สารเคมีเฉลี่ย',
            value: formatNumber(averages.chemical),
            unit: 'กก.',
            icon: DASHBOARD_ICONS.chemical,
            color: '#e74c3c'
        },
        {
            title: 'ปริมาณตะกอนเฉลี่ย',
            value: formatNumber(averages.sludge),
            unit: 'กก.',
            icon: DASHBOARD_ICONS.sludge,
            color: '#f39c12'
        },
        {
            title: 'ค่า pH เฉลี่ย',
            value: averages.ph.toFixed(2),
            unit: '',
            icon: DASHBOARD_ICONS.ph,
            color: '#1abc9c'
        },
        {
            title: 'คลอรีนตกค้างเฉลี่ย',
            value: averages.chlorine.toFixed(2),
            unit: 'mg/L',
            icon: DASHBOARD_ICONS.chlorine,
            color: '#3498db'
        }
    ];

    // สร้างการ์ดแสดงค่าเฉลี่ย
    averageCards.forEach(card => {
        const cardElement = createSummaryCard(card.title, card.value, card.unit, card.icon, card.color);
        container.appendChild(cardElement);
    });

    // สร้าง Card สรุปเปอร์เซ็นต์สถานะ - ใช้ icon จากไฟล์ icons.js
    const statusCards = [
        {
            title: 'สถานะระบบบำบัด',
            status: status_percentages.treatment,
            icon: DASHBOARD_ICONS.treatment,
            color: '#3498db'
        },
        {
            title: 'สถานะเครื่องสูบน้ำ',
            status: status_percentages.pump,
            icon: DASHBOARD_ICONS.pump,
            color: '#2ecc71'
        },
        {
            title: 'สถานะเครื่องเติมอากาศ',
            status: status_percentages.aerator,
            icon: DASHBOARD_ICONS.aerator,
            color: '#9b59b6'
        },
        {
            title: 'สถานะเครื่องกวนน้ำเสีย',
            status: status_percentages.mixer,
            icon: DASHBOARD_ICONS.mixer,
            color: '#27ae60'
        },
        {
            title: 'สถานะเครื่องกวนสารเคมี',
            status: status_percentages.chem,
            icon: DASHBOARD_ICONS.chemMixer,
            color: '#e74c3c'
        },
        {
            title: 'สถานะเครื่องสูบตะกอน',
            status: status_percentages.sludge,
            icon: DASHBOARD_ICONS.sludgePump,
            color: '#f39c12'
        }
    ];

    // สร้างการ์ดแสดงเปอร์เซ็นต์สถานะทั้งหมด
    statusCards.forEach(card => {
        const cardElement = createStatusPercentCard(card.title, card.status, card.icon, card.color);
        container.appendChild(cardElement);
    });
}

// ฟังก์ชันสร้าง Card แสดงค่าเฉลี่ย
function createSummaryCard(title, value, unit, iconHtml, color) {
    const card = document.createElement('div');
    card.className = 'dashboard-card summary-card';

    // สร้างส่วนหัวของ card - วาง icon ก่อนชื่อ
    const header = document.createElement('div');
    header.className = 'card-header';

    const iconElem = document.createElement('div');
    iconElem.className = 'card-icon';
    iconElem.innerHTML = iconHtml;
    iconElem.style.color = color;

    const titleElem = document.createElement('h3');
    titleElem.className = 'card-title';
    titleElem.textContent = title;

    // เพิ่ม icon ก่อน แล้วค่อยเพิ่มชื่อ (วางแนวตั้ง)
    header.appendChild(iconElem);
    header.appendChild(titleElem);

    // สร้างส่วนเนื้อหาของ card
    const body = document.createElement('div');
    body.className = 'card-body';

    const valueElem = document.createElement('div');
    valueElem.className = 'summary-value';
    valueElem.textContent = value;
    valueElem.style.color = color;

    const unitElem = document.createElement('div');
    unitElem.className = 'summary-unit';
    unitElem.textContent = unit;

    body.appendChild(valueElem);
    body.appendChild(unitElem);

    // ประกอบ card
    card.appendChild(header);
    card.appendChild(body);

    return card;
}

// ฟังก์ชันสร้าง Card แสดงเปอร์เซ็นต์สถานะ
function createStatusPercentCard(title, statusObj, iconHtml, color) {
    const card = document.createElement('div');
    card.className = 'dashboard-card summary-card';

    // สร้างส่วนหัวของ card - วาง icon ก่อนชื่อ แนวตั้ง
    const header = document.createElement('div');
    header.className = 'card-header';

    const iconElem = document.createElement('div');
    iconElem.className = 'card-icon';
    iconElem.innerHTML = iconHtml;
    iconElem.style.color = color;

    const titleElem = document.createElement('h3');
    titleElem.className = 'card-title';
    titleElem.textContent = title;

    header.appendChild(iconElem);
    header.appendChild(titleElem);

    // สร้างส่วนเนื้อหาของ card
    const body = document.createElement('div');
    body.className = 'card-body';

    // สร้างส่วนแสดงเปอร์เซ็นต์ทั้งหมด
    const statusContainer = document.createElement('div');
    statusContainer.className = 'status-percentages';

    // เพิ่มแต่ละสถานะ
    const statusTypes = [
        { key: 'normal', label: 'ปกติ', class: 'status-normal' },
        { key: 'abnormal', label: 'ผิดปกติ', class: 'status-abnormal' },
        { key: 'maintenance', label: 'ซ่อมบำรุง', class: 'status-maintenance' },
        { key: 'inactive', label: 'ไม่ใช้งาน', class: 'status-inactive' },
        { key: 'unknown', label: 'ไม่ระบุ', class: 'status-unknown' }
    ];

    statusTypes.forEach(status => {
        const statusItem = document.createElement('div');
        statusItem.className = `status-item ${status.class}`;

        const statusLabel = document.createElement('span');
        statusLabel.textContent = status.label;

        const statusValue = document.createElement('span');
        statusValue.textContent = `${statusObj[status.key].toFixed(1)}%`;

        statusItem.appendChild(statusLabel);
        statusItem.appendChild(statusValue);
        statusContainer.appendChild(statusItem);
    });

    body.appendChild(statusContainer);

    // ประกอบ card
    card.appendChild(header);
    card.appendChild(body);

    return card;
}

// ฟังก์ชันโหลดข้อมูลสรุปและแสดงผลบน Dashboard
export async function loadSummaryData(startDate, endDate, containerId) {
    try {
        const summaryData = await fetchSummaryStats(startDate, endDate);
        renderSummaryCards(summaryData, containerId);
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสรุป:", error);
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="error-message">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
        }
    }
} 