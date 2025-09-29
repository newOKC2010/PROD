// เก็บอ้างอิงกราฟทั้งหมด
const charts = {};

/**
 * สร้างกราฟเส้นสำหรับแสดงปริมาณขยะรายเดือน
 * @param {string} chartId - ID ของ canvas ที่จะใช้แสดงกราฟ
 * @param {Array} labels - รายการชื่อเดือน
 * @param {Array} data - ข้อมูลปริมาณขยะ
 * @param {number} wasteTypeId - รหัสประเภทขยะ (1-4)
 * @returns {Chart} อ็อบเจ็กต์กราฟ
 */
export function createMonthlyLineChart(chartId, labels, data, wasteTypeId) {
  // ถ้ามีกราฟอยู่แล้ว ให้ทำลายกราฟเดิมก่อน
  if (charts[chartId]) {
    charts[chartId].destroy();
  }

  // ดึงสีตามประเภทขยะ (ใช้ค่าจริงแทน CSS variables เพื่อให้แน่ใจว่าใช้สีถูกต้อง)
  let borderColor;

  switch (wasteTypeId) {
    case 1: // ขยะทั่วไป - เหลือง
      borderColor = "rgb(255, 193, 7)";
      break;
    case 2: // ขยะรีไซเคิล - ฟ้า
      borderColor = "rgb(33, 150, 243)";
      break;
    case 3: // ขยะอันตราย - แดง
      borderColor = "rgb(244, 67, 54)";
      break;
    case 4: // ขยะติดเชื้อ - เทา
      borderColor = "rgb(158, 158, 158)";
      break;
    default:
      borderColor = "rgb(158, 158, 158)";
  }

  // สร้าง context สำหรับ chart
  const ctx = document.getElementById(chartId).getContext("2d");

  // สร้างกราฟใหม่
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "ปริมาณขยะ (กก.)",
          data: data,
          backgroundColor: "rgba(0, 0, 0, 0)", // ตั้งค่าพื้นหลังให้โปร่งใส
          borderColor: borderColor,
          borderWidth: 3, // เพิ่มความหนาของเส้น
          pointBackgroundColor: borderColor,
          pointBorderColor: "#fff",
          pointBorderWidth: 1,
          pointRadius: 5, // เพิ่มขนาดจุด
          pointHoverRadius: 8, // เพิ่มขนาดจุดเมื่อชี้เมาส์
          tension: 0.3, // ทำให้เส้นโค้งเล็กน้อย
          fill: false, // ไม่ให้มีการเติมสีพื้นหลัง
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // ไม่แสดง legend
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          titleFont: {
            family: "Mitr",
            size: 13,
          },
          bodyFont: {
            family: "Mitr",
            size: 13,
          },
          padding: 10,
          caretSize: 6,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `ปริมาณ: ${context.parsed.y.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} กก.`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "Mitr",
              size: 11,
            },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              family: "Mitr",
              size: 11,
            },
            callback: function (value) {
              if (value >= 1000) {
                return (value / 1000).toLocaleString("th-TH") + "k";
              }
              return value.toLocaleString("th-TH");
            },
          },
        },
      },
      onClick: function(event, elements) {
        console.log("คลิกที่กราฟ", chartId);
      }
    },
  });

  // เก็บอ้างอิงกราฟ
  charts[chartId] = chart;

  // เพิ่ม style cursor: pointer เพื่อให้รู้ว่าสามารถคลิกได้
  document.getElementById(chartId).style.cursor = "pointer";

  return chart;
}

/**
 * อัพเดตข้อมูลในกราฟ
 * @param {string} chartId - ID ของ canvas ที่แสดงกราฟ
 * @param {Array} labels - รายการชื่อเดือนใหม่
 * @param {Array} data - ข้อมูลปริมาณขยะใหม่
 * @returns {boolean} สถานะการอัพเดต
 */
export function updateChart(chartId, labels, data) {
  // ตรวจสอบว่ามีกราฟอยู่หรือไม่
  if (!charts[chartId]) {
    return false;
  }

  // อัพเดตข้อมูล
  const chart = charts[chartId];
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;

  // อัพเดตกราฟ
  chart.update();

  return true;
}

/**
 * ทำลายกราฟทั้งหมด
 */
export function destroyAllCharts() {
  Object.keys(charts).forEach((chartId) => {
    if (charts[chartId]) {
      charts[chartId].destroy();
      delete charts[chartId];
    }
  });
}

/**
 * ปรับขนาดกราฟทั้งหมด
 */
export function resizeAllCharts() {
  Object.keys(charts).forEach((chartId) => {
    if (charts[chartId]) {
      charts[chartId].resize();
    }
  });
}


/**
 * ดึงไอคอนตามประเภทขยะ
 * @param {number} wasteTypeId - รหัสประเภทขยะ (1-4)
 * @returns {string} รหัสไอคอน Material Icons
 */
export function getWasteTypeIcon(wasteTypeId) {
  switch (wasteTypeId) {
    case 1:
      return "delete_outline"; // ขยะทั่วไป - ถังขยะทั่วไป
    case 2:
      return "recycling"; // ขยะรีไซเคิล - สัญลักษณ์รีไซเคิล
    case 3:
      return "warning_amber"; // ขยะอันตราย - สัญลักษณ์เตือน
    case 4:
      return "medical_services"; // ขยะติดเชื้อ - สัญลักษณ์ทางการแพทย์
    default:
      return "help_outline"; // ไม่ทราบประเภท
  }
}

/**
 * สร้างกราฟเส้นเปรียบเทียบขยะแต่ละประเภท
 * @param {string} chartId - ID ของ canvas ที่จะใช้แสดงกราฟ
 * @param {Array} labels - รายการชื่อเดือน
 * @param {Array} datasets - ชุดข้อมูลแต่ละประเภทขยะ
 * @returns {Chart} อ็อบเจ็กต์กราฟ
 */
export function createComparisonLineChart(chartId, labels, datasets) {
  // ถ้ามีกราฟอยู่แล้ว ให้ทำลายกราฟเดิมก่อน
  if (charts[chartId]) {
    charts[chartId].destroy();
  }

  // กำหนดสีของแต่ละประเภทขยะ
  const wasteTypeColors = {
    1: {
      backgroundColor: "rgba(255, 193, 7, 0.1)",
      borderColor: "rgb(255, 193, 7)",
      pointBackgroundColor: "rgb(255, 193, 7)",
    },
    2: {
      backgroundColor: "rgba(33, 150, 243, 0.1)",
      borderColor: "rgb(33, 150, 243)",
      pointBackgroundColor: "rgb(33, 150, 243)",
    },
    3: {
      backgroundColor: "rgba(244, 67, 54, 0.1)",
      borderColor: "rgb(244, 67, 54)",
      pointBackgroundColor: "rgb(244, 67, 54)",
    },
    4: {
      backgroundColor: "rgba(158, 158, 158, 0.1)",
      borderColor: "rgb(158, 158, 158)",
      pointBackgroundColor: "rgb(158, 158, 158)",
    },
  };

  // แปลงข้อมูลให้อยู่ในรูปแบบที่ Chart.js ต้องการ
  const chartDatasets = datasets.map((dataset) => {
    const typeId = dataset.id;
    const colorSet = wasteTypeColors[typeId] || wasteTypeColors[4]; // ใช้สีเทาถ้าไม่มีสีที่กำหนด

    return {
      label: dataset.name,
      data: dataset.data,
      backgroundColor: colorSet.backgroundColor,
      borderColor: colorSet.borderColor,
      borderWidth: 3,
      tension: 0.3, // ทำให้เส้นโค้งเล็กน้อย
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: colorSet.pointBackgroundColor,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      fill: false,
    };
  });

  // สร้าง context สำหรับ chart
  const ctx = document.getElementById(chartId).getContext("2d");

  // สร้างกราฟใหม่
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: chartDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: {
              family: "Mitr",
              size: 14,
            },
            usePointStyle: true,
            pointStyle: "circle",
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: {
            family: "Mitr",
            size: 15,
          },
          bodyFont: {
            family: "Mitr",
            size: 15,
          },
          padding: 12,
          callbacks: {
            label: function (context) {
              const value = context.parsed.y;
              return `${context.dataset.label}: ${value.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} กก.`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "Mitr",
              size: 13,
            },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            font: {
              family: "Mitr",
              size: 13,
            },
            callback: function (value) {
              if (value >= 1000) {
                return (value / 1000).toLocaleString("th-TH") + "k";
              }
              return value.toLocaleString("th-TH");
            },
          },
        },
      },
    },
  });

  // เก็บอ้างอิงกราฟ
  charts[chartId] = chart;

  return chart;
}
