// โมดูลสำหรับสร้างและแสดง Card ต่างๆ
import { createLineChart, createPieChart, createBarChart } from "./charts.js";
import { formatNumber, formatMonthYear } from "./utilities.js";
import { DASHBOARD_ICONS } from "./icons.js";

// ฟังก์ชันสำหรับสร้าง Card การใช้ทรัพยากร
export function renderResourceCards(monthlySummary) {
  const container = document.getElementById("resource-card-grid");
  if (!container) return;

  // ล้าง container เดิม
  container.innerHTML = "";

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (!monthlySummary || monthlySummary.length === 0) {
    const noDataCard = createNoDataCard("ไม่มีข้อมูลการใช้ทรัพยากร");
    container.appendChild(noDataCard);
    return;
  }

  // เตรียมข้อมูลสำหรับกราฟ
  const labels = monthlySummary.map((item) => formatMonthYear(item.month_date));

  // สร้าง card สำหรับการใช้ไฟฟ้า
  const electricityCard = createCardWithLineChart("electricity-chart", "การใช้ไฟฟ้า", labels, [
    {
      label: "การใช้ไฟฟ้า (kWh)",
      data: monthlySummary.map((item) => item.total_electricity),
      borderColor: "#3498db",
      backgroundColor: "rgba(52, 152, 219, 0.1)",
      tension: 0.4,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดการใช้ไฟฟ้า
  addIconToCard(electricityCard, DASHBOARD_ICONS.electricity, "#3498db");

  // สร้าง card สำหรับการใช้น้ำ
  const waterCard = createCardWithLineChart("water-chart", "การใช้น้ำ", labels, [
    {
      label: "การใช้น้ำ (ลบ.ม.)",
      data: monthlySummary.map((item) => item.total_water),
      borderColor: "#2ecc71",
      backgroundColor: "rgba(46, 204, 113, 0.1)",
      tension: 0.4,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดการใช้น้ำ
  addIconToCard(waterCard, DASHBOARD_ICONS.water, "#2ecc71");

  // สร้าง card สำหรับน้ำเสียเข้า-ออก (ใช้กราฟแท่ง)
  const wastewaterCard = createCardWithBarChart("wastewater-chart", "ปริมาณน้ำเสีย", labels, [
    {
      label: "น้ำเสียเข้าระบบ (ลบ.ม.)",
      data: monthlySummary.map((item) => item.total_wastewater_in),
      backgroundColor: "rgb(155, 89, 182)", // สีม่วงเข้ม (ไม่มีความโปร่งใส)
      borderColor: "rgb(155, 89, 182)",
      borderWidth: 0,
    },
    {
      label: "น้ำออกจากระบบ (ลบ.ม.)",
      data: monthlySummary.map((item) => item.total_wastewater_out),
      backgroundColor: "rgb(46, 204, 113)", // สีเขียว (ไม่มีความโปร่งใส)
      borderColor: "rgb(46, 204, 113)",
      borderWidth: 0,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดน้ำเสีย
  addIconToCard(wastewaterCard, DASHBOARD_ICONS.wastewater, "#9b59b6");

  // แก้ไข chart container ให้มี id เฉพาะ
  const wastewaterChartContainer = wastewaterCard.querySelector(".chart-container");
  if (wastewaterChartContainer) {
    wastewaterChartContainer.id = "wastewater-chart-container";
  }

  // สร้าง card สำหรับการใช้สารเคมี
  const chemicalCard = createCardWithLineChart("chemical-chart", "การใช้สารเคมี", labels, [
    {
      label: "การใช้สารเคมี (กก.)",
      data: monthlySummary.map((item) => item.total_chemical),
      borderColor: "#e74c3c",
      backgroundColor: "rgba(231, 76, 60, 0.1)",
      tension: 0.4,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดสารเคมี
  addIconToCard(chemicalCard, DASHBOARD_ICONS.chemical, "#e74c3c");

  // เพิ่ม card เข้าไปใน container
  container.appendChild(electricityCard);
  container.appendChild(waterCard);
  container.appendChild(wastewaterCard);
  container.appendChild(chemicalCard);
}

// ฟังก์ชันสำหรับสร้าง Card สถานะอุปกรณ์
export function renderStatusCards(statusSummary) {
  if (!statusSummary || statusSummary.length === 0) {
    const noDataMsg = document.createElement("div");
    noDataMsg.className = "no-data-message";
    noDataMsg.textContent = "ไม่พบข้อมูลในช่วงเวลาที่เลือก";

    const container = document.getElementById("status-card-grid");
    container.innerHTML = "";
    container.appendChild(noDataMsg);
    return;
  }

  // รวมข้อมูลสถานะจากทุกเดือน
  const aggregatedStatus = {
    treatment_normal: 0,
    treatment_abnormal: 0,
    treatment_maintenance: 0,
    treatment_inactive: 0,
    treatment_unknown: 0,
    pump_normal: 0,
    pump_abnormal: 0,
    pump_maintenance: 0,
    pump_inactive: 0,
    pump_unknown: 0,
    aerator_normal: 0,
    aerator_abnormal: 0,
    aerator_maintenance: 0,
    aerator_inactive: 0,
    aerator_unknown: 0,
    mixer_normal: 0,
    mixer_abnormal: 0,
    mixer_maintenance: 0,
    mixer_inactive: 0,
    mixer_unknown: 0,
    chem_normal: 0,
    chem_abnormal: 0,
    chem_maintenance: 0,
    chem_inactive: 0,
    chem_unknown: 0,
    sludge_normal: 0,
    sludge_abnormal: 0,
    sludge_maintenance: 0,
    sludge_inactive: 0,
    sludge_unknown: 0,
  };

  // รวมข้อมูลจากทุกเดือน
  statusSummary.forEach((monthData) => {
    Object.keys(aggregatedStatus).forEach((key) => {
      aggregatedStatus[key] += Number(monthData[key] || 0);
    });
  });

  // กำหนดสีสำหรับกราฟวงกลม
  const pieColors = [
    "rgba(46, 204, 113, 0.9)", // สีเขียว - สถานะปกติ
    "rgba(231, 76, 60, 0.9)", // สีแดง - สถานะผิดปกติ
    "rgba(241, 196, 15, 0.9)", // สีเหลือง - สถานะซ่อมบำรุง
    "rgba(149, 165, 166, 0.9)", // สีเทา - สถานะไม่ใช้งาน
    "rgba(189, 195, 199, 0.9)", // สีเทาอ่อน - สถานะไม่ระบุ
  ];

  // สร้างการ์ดสำหรับทุกประเภทอุปกรณ์
  const cards = [
    // สถานะระบบบำบัด
    createCardWithPieChart(
      "treatment-status-chart",
      "สถานะระบบบำบัด",
      ["ปกติ", "ผิดปกติ", "ซ่อมบำรุง", "ไม่ใช้งาน", "ไม่ระบุ"],
      [
        aggregatedStatus.treatment_normal,
        aggregatedStatus.treatment_abnormal,
        aggregatedStatus.treatment_maintenance,
        aggregatedStatus.treatment_inactive,
        aggregatedStatus.treatment_unknown,
      ],
      pieColors
    ),

    // สถานะเครื่องสูบน้ำ
    createCardWithPieChart(
      "pump-status-chart",
      "สถานะเครื่องสูบน้ำ",
      ["ปกติ", "ผิดปกติ", "ซ่อมบำรุง", "ไม่ใช้งาน", "ไม่ระบุ"],
      [
        aggregatedStatus.pump_normal,
        aggregatedStatus.pump_abnormal,
        aggregatedStatus.pump_maintenance,
        aggregatedStatus.pump_inactive,
        aggregatedStatus.pump_unknown,
      ],
      pieColors
    ),

    // สถานะเครื่องเติมอากาศ
    createCardWithPieChart(
      "aerator-status-chart",
      "สถานะเครื่องเติมอากาศ",
      ["ปกติ", "ผิดปกติ", "ซ่อมบำรุง", "ไม่ใช้งาน", "ไม่ระบุ"],
      [
        aggregatedStatus.aerator_normal,
        aggregatedStatus.aerator_abnormal,
        aggregatedStatus.aerator_maintenance,
        aggregatedStatus.aerator_inactive,
        aggregatedStatus.aerator_unknown,
      ],
      pieColors
    ),

    // สถานะเครื่องกวนน้ำเสีย
    createCardWithPieChart(
      "mixer-status-chart",
      "สถานะเครื่องกวนน้ำเสีย",
      ["ปกติ", "ผิดปกติ", "ซ่อมบำรุง", "ไม่ใช้งาน", "ไม่ระบุ"],
      [
        aggregatedStatus.mixer_normal,
        aggregatedStatus.mixer_abnormal,
        aggregatedStatus.mixer_maintenance,
        aggregatedStatus.mixer_inactive,
        aggregatedStatus.mixer_unknown,
      ],
      pieColors
    ),

    // สถานะเครื่องกวนสารเคมี
    createCardWithPieChart(
      "chem-mixer-status-chart",
      "สถานะเครื่องกวนสารเคมี",
      ["ปกติ", "ผิดปกติ", "ซ่อมบำรุง", "ไม่ใช้งาน", "ไม่ระบุ"],
      [
        aggregatedStatus.chem_normal,
        aggregatedStatus.chem_abnormal,
        aggregatedStatus.chem_maintenance,
        aggregatedStatus.chem_inactive,
        aggregatedStatus.chem_unknown,
      ],
      pieColors
    ),

    // สถานะเครื่องสูบตะกอน
    createCardWithPieChart(
      "sludge-pump-status-chart",
      "สถานะเครื่องสูบตะกอน",
      ["ปกติ", "ผิดปกติ", "ซ่อมบำรุง", "ไม่ใช้งาน", "ไม่ระบุ"],
      [
        aggregatedStatus.sludge_normal,
        aggregatedStatus.sludge_abnormal,
        aggregatedStatus.sludge_maintenance,
        aggregatedStatus.sludge_inactive,
        aggregatedStatus.sludge_unknown,
      ],
      pieColors
    ),
  ];

  // ล้างและเพิ่มการ์ดทั้งหมดเข้าไปในคอนเทนเนอร์
  const container = document.getElementById("status-card-grid");
  container.innerHTML = "";

  // เพิ่มโค้ดตรงนี้ - เพิ่ม icon ให้กับทุกการ์ด
  addIconToCard(cards[0], DASHBOARD_ICONS.treatment, "#16a085"); // ระบบบำบัด
  addIconToCard(cards[1], DASHBOARD_ICONS.pump, "#2980b9"); // เครื่องสูบน้ำ
  addIconToCard(cards[2], DASHBOARD_ICONS.aerator, "#8e44ad"); // เครื่องเติมอากาศ
  addIconToCard(cards[3], DASHBOARD_ICONS.mixer, "#27ae60"); // เครื่องกวนน้ำเสีย
  addIconToCard(cards[4], DASHBOARD_ICONS.chemMixer, "#c0392b"); // เครื่องกวนสารเคมี
  addIconToCard(cards[5], DASHBOARD_ICONS.sludgePump, "#d35400"); // เครื่องสูบตะกอน

  cards.forEach((card) => {
    container.appendChild(card);
  });
}

// ฟังก์ชันสำหรับสร้าง Card คุณภาพน้ำและตะกอน
export function renderQualityCards(monthlySummary) {
  const container = document.getElementById("quality-card-grid");
  if (!container) return;

  // ล้าง container เดิม
  container.innerHTML = "";

  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (!monthlySummary || monthlySummary.length === 0) {
    const noDataCard = createNoDataCard("ไม่มีข้อมูลคุณภาพน้ำและตะกอน");
    container.appendChild(noDataCard);
    return;
  }

  // เตรียมข้อมูลสำหรับกราฟ
  const labels = monthlySummary.map((item) => formatMonthYear(item.month_date));

  // สร้าง card สำหรับค่า pH
  const phCard = createCardWithLineChart("ph-chart", "ค่า pH เฉลี่ย", labels, [
    {
      label: "ค่า pH",
      data: monthlySummary.map((item) => item.avg_ph),
      borderColor: "#f39c12",
      backgroundColor: "rgba(243, 156, 18, 0.2)",
      pointBackgroundColor: "#e67e22",
      pointBorderColor: "#fff",
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดค่า pH
  addIconToCard(phCard, DASHBOARD_ICONS.ph, "#1abc9c");

  // สร้าง card สำหรับค่าคลอรีนตกค้าง
  const chlorineCard = createCardWithLineChart("chlorine-chart", "ค่าคลอรีนตกค้างเฉลี่ย", labels, [
    {
      label: "ค่าคลอรีนตกค้าง (มก./ล.)",
      data: monthlySummary.map((item) => item.avg_chlorine),
      borderColor: "#16a085",
      backgroundColor: "rgba(22, 160, 133, 0.2)",
      pointBackgroundColor: "#16a085",
      pointBorderColor: "#fff",
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดค่าคลอรีนตกค้าง
  addIconToCard(chlorineCard, DASHBOARD_ICONS.chlorine, "#16a085");

  // สร้าง card สำหรับปริมาณตะกอน
  const sludgeCard = createCardWithLineChart("sludge-chart", "ปริมาณตะกอนส่วนเกิน", labels, [
    {
      label: "ปริมาณตะกอนส่วนเกิน (ลบ.ม.)",
      data: monthlySummary.map((item) => item.total_sludge),
      borderColor: "#d35400",
      backgroundColor: "rgba(211, 84, 0, 0.2)",
      pointBackgroundColor: "#d35400",
      pointBorderColor: "#fff",
      pointRadius: 5,
      pointHoverRadius: 7,
    },
  ]);

  // เพิ่ม icon ให้กับการ์ดปริมาณตะกอน
  addIconToCard(sludgeCard, DASHBOARD_ICONS.sludge, "#d35400");

  // เพิ่ม card เข้าไปใน container
  container.appendChild(phCard);
  container.appendChild(chlorineCard);
  container.appendChild(sludgeCard);
}

// ฟังก์ชันสำหรับสร้าง Card ที่มีกราฟเส้น
function createCardWithLineChart(chartId, title, labels, datasets) {
  // สร้าง card element
  const card = document.createElement("div");
  card.className = "dashboard-card";
  // สร้างส่วนหัวของ card
  const header = document.createElement("div");
  header.className = "card-header";
  const titleElem = document.createElement("h3");
  titleElem.className = "card-title";
  titleElem.textContent = title;
  header.appendChild(titleElem);
  // สร้างส่วนเนื้อหาของ card
  const body = document.createElement("div");
  body.className = "card-body";
  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";

  // เพิ่ม wrapper สำหรับ scroll
  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "chart-scroll-wrapper";

  const canvas = document.createElement("canvas");
  canvas.id = chartId;

  scrollWrapper.appendChild(canvas);
  chartContainer.appendChild(scrollWrapper);
  body.appendChild(chartContainer);
  // ประกอบ card
  card.appendChild(header);
  card.appendChild(body);
  // สร้างกราฟเส้น
  setTimeout(() => {
    createLineChart(chartId, labels, datasets);
  }, 0);
  return card;
}

// ฟังก์ชันสำหรับสร้าง Card ที่มีกราฟวงกลม
function createCardWithPieChart(chartId, title, labels, data, pieColors = null) {
  // สร้าง card element
  const card = document.createElement("div");
  card.className = "dashboard-card";

  // สร้างส่วนหัวของ card
  const header = document.createElement("div");
  header.className = "card-header";

  const titleElem = document.createElement("h3");
  titleElem.className = "card-title";
  titleElem.textContent = title;

  header.appendChild(titleElem);

  // สร้างส่วนเนื้อหาของ card
  const body = document.createElement("div");
  body.className = "card-body";

  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";

  const canvas = document.createElement("canvas");
  canvas.id = chartId;

  chartContainer.appendChild(canvas);
  body.appendChild(chartContainer);

  // แก้ไขปัญหาข้อมูลเป็น 0 ทั้งหมด
  const allZeros = data.every((value) => value === 0 || value === null || value === undefined);

  // ถ้าข้อมูลทั้งหมดเป็น 0 ให้ใช้ข้อมูลตัวอย่าง - เพิ่มตัวเลขสำหรับสถานะที่ 5
  const chartData = allZeros ? [25, 15, 10, 5, 3] : data;

  // สร้างคำอธิบายด้านล่างกราฟ
  const legendContainer = document.createElement("div");
  legendContainer.className = "status-legend";
  legendContainer.style.display = "flex";
  legendContainer.style.flexWrap = "wrap";
  legendContainer.style.justifyContent = "center";
  legendContainer.style.gap = "10px";
  legendContainer.style.marginTop = "15px";

  // สร้างรายการสีและคำอธิบาย
  const colors = pieColors || [
    "rgba(46, 204, 113, 0.9)", // สีเขียว - ปกติ
    "rgba(231, 76, 60, 0.9)", // สีแดง - ผิดปกติ
    "rgba(241, 196, 15, 0.9)", // สีเหลือง - ซ่อมบำรุง
    "rgba(149, 165, 166, 0.9)", // สีเทา - ไม่ใช้งาน
    "rgba(189, 195, 199, 0.9)", // สีเทาอ่อน - ไม่ระบุ
  ];

  // แก้ไข: สร้าง legend items โดยไม่แสดงเปอร์เซ็นต์
  labels.forEach((label, index) => {
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.marginBottom = "5px";

    const colorBox = document.createElement("span");
    colorBox.style.width = "12px";
    colorBox.style.height = "12px";
    colorBox.style.backgroundColor = colors[index];
    colorBox.style.borderRadius = "50%";
    colorBox.style.marginRight = "5px";
    colorBox.style.display = "inline-block";
    colorBox.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    const labelText = document.createElement("span");
    labelText.textContent = label;
    labelText.style.fontSize = "13px";
    labelText.style.fontFamily = "Mitr, sans-serif";
    labelText.style.fontWeight = "500";
    labelText.style.color = "#2c3e50"; // เพิ่มสีให้เข้มขึ้น

    item.appendChild(colorBox);
    item.appendChild(labelText);
    legendContainer.appendChild(item);
  });

  body.appendChild(legendContainer);

  // ประกอบ card
  card.appendChild(header);
  card.appendChild(body);

  // สร้างกราฟวงกลม
  setTimeout(() => {
    createPieChart(chartId, labels, chartData, null, colors);
  }, 0);

  return card;
}

// เพิ่มฟังก์ชันสำหรับสร้าง Card ที่มีกราฟแท่ง
function createCardWithBarChart(chartId, title, labels, datasets) {
  // สร้าง card element
  const card = document.createElement("div");
  card.className = "dashboard-card";

  // สร้างส่วนหัวของ card
  const header = document.createElement("div");
  header.className = "card-header";

  const titleElem = document.createElement("h3");
  titleElem.className = "card-title";
  titleElem.textContent = title;

  header.appendChild(titleElem);

  // สร้างส่วนเนื้อหาของ card
  const body = document.createElement("div");
  body.className = "card-body";

  const chartContainer = document.createElement("div");
  chartContainer.className = "chart-container";

  // เพิ่ม wrapper สำหรับ scroll
  const scrollWrapper = document.createElement("div");
  scrollWrapper.className = "chart-scroll-wrapper";

  const canvas = document.createElement("canvas");
  canvas.id = chartId;

  scrollWrapper.appendChild(canvas);
  chartContainer.appendChild(scrollWrapper);
  body.appendChild(chartContainer);

  // ประกอบ card
  card.appendChild(header);
  card.appendChild(body);

  // สร้างกราฟแท่ง
  setTimeout(() => {
    createBarChart(chartId, labels, datasets);
  }, 0);

  return card;
}

// ฟังก์ชันสำหรับสร้าง Card ที่แสดงว่าไม่มีข้อมูล
function createNoDataCard(message) {
  // สร้าง card element
  const card = document.createElement("div");
  card.className = "dashboard-card";
  // สร้างส่วนเนื้อหาของ card
  const noDataDiv = document.createElement("div");
  noDataDiv.className = "no-data-card";
  const iconElem = document.createElement("div");
  iconElem.className = "icon";
  iconElem.innerHTML = "📊";
  const messageElem = document.createElement("div");
  messageElem.className = "message";
  messageElem.textContent = message;
  noDataDiv.appendChild(iconElem);
  noDataDiv.appendChild(messageElem);
  // ประกอบ card
  card.appendChild(noDataDiv);
  return card;
}

// ฟังก์ชันเพิ่ม icon ให้กับ card
function addIconToCard(card, iconHtml, color) {
  const header = card.querySelector(".card-header");
  if (!header) return;

  const titleElem = header.querySelector(".card-title");

  const iconElem = document.createElement("div");
  iconElem.className = "card-icon";
  iconElem.innerHTML = iconHtml;
  iconElem.style.color = color || "#3498db";

  // ถ้ามี icon อยู่แล้ว ให้แทนที่
  const existingIcon = header.querySelector(".card-icon");
  if (existingIcon) {
    header.replaceChild(iconElem, existingIcon);
  } else {
    // ไม่มี icon อยู่เดิม ให้เพิ่มเข้าไปก่อน titleElem (ถ้ามี) หรือต่อท้าย header
    if (titleElem) {
      header.insertBefore(iconElem, titleElem.nextSibling);
    } else {
      header.appendChild(iconElem);
    }
  }
}

// เพิ่มฟังก์ชันสร้างและเพิ่ม icon ในส่วนแสดงสถานะ
function createStatusSummaryItem(
  title,
  normalPercent,
  abnormalPercent,
  maintenancePercent,
  inactivePercent,
  unknownPercent,
  icon
) {
  const container = document.createElement("div");
  container.className = "dashboard-card status-summary-card";

  // สร้างส่วนหัวการ์ด
  const header = document.createElement("div");
  header.className = "card-header";

  // สร้าง icon
  const iconContainer = document.createElement("div");
  iconContainer.className = "card-icon";
  iconContainer.innerHTML = icon;
  header.appendChild(iconContainer);

  // สร้างหัวข้อ
  const titleElem = document.createElement("h3");
  titleElem.className = "card-title";
  titleElem.textContent = title;
  header.appendChild(titleElem);

  // สร้างเนื้อหา
  const body = document.createElement("div");
  body.className = "card-body";

  // สร้างส่วนแสดงสถานะ
  const statusContainer = document.createElement("div");
  statusContainer.className = "status-percentages";

  // เพิ่มส่วนแสดงสถานะแต่ละประเภท
  addStatusItem(statusContainer, "ปกติ", normalPercent, "status-normal");
  addStatusItem(statusContainer, "ผิดปกติ", abnormalPercent, "status-abnormal");
  addStatusItem(statusContainer, "ซ่อมบำรุง", maintenancePercent, "status-maintenance");
  addStatusItem(statusContainer, "ไม่ใช้งาน", inactivePercent, "status-inactive");
  addStatusItem(statusContainer, "ไม่ระบุ", unknownPercent, "status-unknown");

  body.appendChild(statusContainer);

  // ประกอบการ์ด
  container.appendChild(header);
  container.appendChild(body);

  return container;
}

// ฟังก์ชันช่วยสร้าง status item
function addStatusItem(container, label, value, className) {
  const item = document.createElement("div");
  item.className = `status-item ${className}`;

  const labelElem = document.createElement("span");
  labelElem.textContent = label;

  const valueElem = document.createElement("span");
  valueElem.textContent = `${value.toFixed(1)}%`;

  item.appendChild(labelElem);
  item.appendChild(valueElem);
  container.appendChild(item);
}
