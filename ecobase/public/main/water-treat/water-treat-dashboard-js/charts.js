// โมดูลสำหรับสร้างและจัดการกราฟ

// เก็บอ้างอิงกราฟทั้งหมด
const chartInstances = {};

// ฟังก์ชันสำหรับทำลายกราฟทั้งหมด
export function destroyAllCharts() {
  Object.values(chartInstances).forEach((chart) => {
    if (chart) {
      chart.destroy();
    }
  });

  // ล้างอ้างอิงกราฟ
  Object.keys(chartInstances).forEach((key) => {
    delete chartInstances[key];
  });
}

// ฟังก์ชันสำหรับสร้างกราฟเส้น
export function createLineChart(canvasId, labels, datasets, title) {
  // ตรวจสอบว่ามี canvas หรือไม่
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`ไม่พบ canvas ที่มี ID: ${canvasId}`);
    return null;
  }

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (!labels || !datasets || labels.length === 0) {
    console.warn(`ไม่มีข้อมูลสำหรับกราฟ ${canvasId}`);
    return null;
  }

  // สร้างกราฟเส้น
  const ctx = canvas.getContext("2d");

  // เพิ่มสีให้กับ dataset
  datasets.forEach((dataset, index) => {
    // ใช้สีที่กำหนดไว้ หรือใช้สีเริ่มต้น
    if (!dataset.borderColor) {
      const colors = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#34495e", "#d35400"];
      dataset.borderColor = colors[index % colors.length];
      dataset.backgroundColor = `${colors[index % colors.length]}20`;
    }

    dataset.tension = 0.3; // ทำให้เส้นโค้งนิดหน่อย
    dataset.fill = true;
  });

  // เพิ่มการกำหนดความกว้างขั้นต่ำของกราฟตามจำนวนข้อมูล
  const minWidth = Math.max(labels.length * 50, 400); // 50px ต่อ 1 เดือน, อย่างน้อย 400px

  // ปรับ canvas และ container ให้มีความกว้างเหมาะสม
  canvas.parentElement.style.minWidth = `${minWidth}px`;
  canvas.parentElement.style.overflow = "auto";

  // สร้างกราฟ
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title || "",
          font: {
            family: "Mitr",
            size: 16,
            weight: "bold",
          },
        },
        legend: {
          position: "bottom",
          labels: {
            font: {
              family: "Mitr",
              size: 12,
            },
            boxWidth: 12,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          titleFont: {
            family: "Mitr",
            size: 14,
          },
          bodyFont: {
            family: "Mitr",
            size: 13,
          },
        },
        // ปิดการแสดงค่าบนกราฟโดยตรง
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            font: {
              family: "Mitr",
              size: 12,
            },
            maxRotation: 45, // หมุนตัวอักษร 45 องศาเพื่อให้อ่านง่ายขึ้น
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              family: "Mitr",
              size: 12,
            },
          },
        },
      },
    },
  });

  // เก็บอ้างอิงกราฟ
  chartInstances[canvasId] = chart;

  return chart;
}

// ฟังก์ชันสำหรับสร้างกราฟวงกลม
export function createPieChart(canvasId, labels, data, title, backgroundColors = null) {
  // ตรวจสอบว่ามี canvas หรือไม่
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`ไม่พบ canvas ที่มี ID: ${canvasId}`);
    return null;
  }

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (!labels || !data || labels.length === 0 || data.length === 0) {
    console.warn(`ไม่มีข้อมูลสำหรับกราฟ ${canvasId}`);
    return null;
  }

  // ตรวจสอบข้อมูลทั้งหมดว่าเป็น 0 หรือไม่
  const hasData = data.some((val) => val > 0);
  if (!hasData) {
    // สร้างข้อมูลตัวอย่างที่มีความแตกต่างกัน เพื่อให้กราฟแสดงสัดส่วนที่แตกต่างกัน
    data = [25, 15, 10, 5];
  }

  // สร้างกราฟวงกลม
  const ctx = canvas.getContext("2d");

  // กำหนดสีกราฟถ้าไม่ได้ระบุมา - เพิ่มสีสำหรับสถานะที่ 5
  const defaultColors = [
    "rgba(46, 204, 113, 0.9)", // สีเขียว - สถานะปกติ
    "rgba(231, 76, 60, 0.9)", // สีแดง - สถานะผิดปกติ
    "rgba(241, 196, 15, 0.9)", // สีเหลือง - สถานะซ่อมบำรุง
    "rgba(149, 165, 166, 0.9)", // สีเทา - สถานะไม่ใช้งาน
    "rgba(189, 195, 199, 0.9)", // สีเทาอ่อน - สถานะไม่ระบุ
  ];

  const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors || defaultColors,
          borderColor: "white",
          borderWidth: 0,
          borderRadius: 5,
          spacing: 1,
          hoverOffset: 15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      radius: "90%",
      plugins: {
        tooltip: {
          titleFont: {
            family: "Mitr, sans-serif",
            size: 14,
            weight: "bold",
          },
          bodyFont: {
            family: "Mitr, sans-serif",
            size: 13,
            weight: "500",
          },
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "white",
          bodyColor: "white",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 4,
          displayColors: true,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.raw || 0;
              return `${label}: ${value}`;
            },
          },
        },
        legend: {
          display: false,
        },
        datalabels: {
          display: false,
        },
      },
    },
  });

  // เก็บอ้างอิงกราฟ
  chartInstances[canvasId] = chart;

  return chart;
}

// ฟังก์ชันสำหรับอัปเดตกราฟที่มีอยู่แล้ว
export function updateCharts() {
  Object.values(chartInstances).forEach((chart) => {
    if (chart) {
      chart.update();
    }
  });
}

// เพิ่มฟังก์ชันสำหรับสร้างกราฟแท่ง
// ฟังก์ชันสำหรับสร้างกราฟแท่ง
export function createBarChart(canvasId, labels, datasets, title) {
  // ตรวจสอบว่ามี canvas หรือไม่
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`ไม่พบ canvas ที่มี ID: ${canvasId}`);
    return null;
  }

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (!labels || !datasets || labels.length === 0) {
    console.warn(`ไม่มีข้อมูลสำหรับกราฟ ${canvasId}`);
    return null;
  }

  // สร้างกราฟแท่ง
  const ctx = canvas.getContext("2d");

  // เปลี่ยนสีให้เข้มขึ้น ลดความโปร่งใส
  datasets.forEach((dataset, index) => {
    const colors = [
      "rgb(155, 89, 182)", // สีม่วงเข้ม (ไม่มีค่า alpha)
      "rgb(46, 204, 113)", // สีเขียว (ไม่มีค่า alpha)
      "rgb(52, 152, 219)", // สีฟ้า (ไม่มีค่า alpha)
      "rgb(231, 76, 60)", // สีแดง (ไม่มีค่า alpha)
      "rgb(243, 156, 18)", // สีส้ม (ไม่มีค่า alpha)
    ];

    // กำหนดสีให้เข้มไม่มีความโปร่งใส
    if (!dataset.backgroundColor) {
      dataset.backgroundColor = colors[index % colors.length];
      dataset.borderColor = dataset.backgroundColor;
    }

    // ลบความโปร่งใสถ้ามีการกำหนดไว้
    if (dataset.backgroundColor.includes("rgba")) {
      dataset.backgroundColor = dataset.backgroundColor.replace(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/g,
        "rgb($1, $2, $3)"
      );
    }
    if (dataset.borderColor.includes("rgba")) {
      dataset.borderColor = dataset.borderColor.replace(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/g,
        "rgb($1, $2, $3)"
      );
    }

    // ตั้งค่าเพิ่มเติม
    dataset.borderWidth = 1;
    dataset.borderRadius = 4; // ลดลงเล็กน้อย
    dataset.maxBarThickness = 80; // เพิ่มความหนา
    dataset.minBarLength = 5; // กำหนดความยาวขั้นต่ำของแท่ง
  });

  // ปรับการแสดงผลให้แสดงแบบเต็มกว้าง container
  //const containerWidth = canvas.parentElement.parentElement.clientWidth || 600;
  canvas.parentElement.style.width = "100%";
  canvas.parentElement.style.minHeight = "400px";
  canvas.parentElement.style.overflow = "visible"; // เปลี่ยนจาก "auto" เป็น "visible"

  // สร้างกราฟ
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2, // เพิ่มความคมชัด
      barPercentage: 0.8,
      categoryPercentage: 0.7,
      layout: {
        padding: {
          left: 10,
          right: 10,
        },
      },
      onResize: function (chart, size) {
        if (size.width < labels.length * 100) {
          chart.options.scales.x.ticks.autoSkip = true;
        } else {
          chart.options.scales.x.ticks.autoSkip = false;
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: {
              family: "Mitr",
              size: 12,
              weight: "500", // เพิ่มความหนาของตัวอักษร
            },
            boxWidth: 12,
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)", // ทำให้ tooltip เข้มขึ้น
          titleFont: {
            family: "Mitr",
            size: 14,
            weight: "600",
          },
          bodyFont: {
            family: "Mitr",
            size: 13,
            weight: "500",
          },
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: {
            display: false, // ลบเส้นกริดแนวตั้ง
          },
          ticks: {
            font: {
              family: "Mitr",
              size: 11, // ลดขนาดตัวอักษร
            },
            autoSkip: false, // ไม่ให้ข้ามการแสดงค่า
            maxRotation: 45, // หมุนข้อความ
            minRotation: 45, // หมุนข้อความ
          },
          offset: true, // ขยับแกน x
        },
        y: {
          beginAtZero: true, // เปลี่ยนเป็น true เพื่อให้เริ่มที่ศูนย์
          grid: {
            color: "rgba(0, 0, 0, 0.1)", // ทำให้เส้นกริดชัดขึ้น
          },
          ticks: {
            font: {
              family: "Mitr",
              size: 11, // ลดขนาดตัวอักษร
            },
            precision: 0, // แสดงเป็นจำนวนเต็ม
          },
          min: 0, // กำหนดค่าต่ำสุดเป็น 0
          suggestedMin: 0, // แนะนำค่าต่ำสุด
        },
      },
      animation: {
        duration: 500, // ลดระยะเวลาแอนิเมชัน
      },
    },
  });

  // เก็บอ้างอิงกราฟ
  chartInstances[canvasId] = chart;

  return chart;
}
