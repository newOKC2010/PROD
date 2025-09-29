document.addEventListener("DOMContentLoaded", function () {
  // สร้าง sidebar อัตโนมัติ
  createSidebar();

  // ตรวจสอบการเข้าสู่ระบบสำเร็จจาก provider
  checkProviderLoginSuccess();

  // ตรวจสอบสถานะการเข้าสู่ระบบ
  checkAuthStatus();

  // เรียกใช้งานปฏิทินไทยสำหรับ input type="date" ทั้งหมด
  initThaiDatePicker();

  // บันทึกเวลาที่โหลดหน้า
  console.log("หน้าถูกโหลดเมื่อ:", new Date().toLocaleString());

  // หลังจากโหลดเอกสาร
  setupActiveMenu();
});

/**
 * สร้าง Sidebar อัตโนมัติสำหรับทุกหน้า
 */
function createSidebar() {
  // ตรวจสอบว่ามี sidebar อยู่แล้วหรือไม่
  if (document.querySelector(".sidebar")) {
    return;
  }

  // ตรวจสอบว่ามี container อยู่แล้วหรือไม่
  let container = document.querySelector(".container");
  if (!container) {
    container = document.createElement("div");
    container.className = "container";
    document.body.appendChild(container);
  }

  // สร้าง sidebar
  const sidebar = document.createElement("div");
  sidebar.className = "sidebar";

  sidebar.innerHTML = `
        <div class="logo">
            <h2>ระบบเก็บข้อมูล <br> สิ่งแวดล้อม โรงพยาบาลบางเลน</h2>
        </div>
        <nav>
            <ul>
                <li><a href="/water-dashboard" class="nav-link"><i class="fas fa-water"></i>&nbspระบบบำบัดน้ำเสีย</a></li>
                <li><a href="/waste-dashboard" class="nav-link"><i class="fas fa-trash"></i>&nbspระบบจัดการขยะ</a></li>
            </ul>
        </nav>
        <div class="user-info" id="user-greeting" style="display: none;">
            <p>สวัสดีคุณ <span id="user-fullname">-</span> (<span id="user-role-badge">-</span>)</p>
        </div>
        <div id="auth-button-container">
            <a href="/login" class="login-button" id="login-button">เข้าสู่ระบบ</a>
            <a href="/logout" class="logout-button" id="logout-button" style="display: none">ออกจากระบบ</a>
        </div>
    `;

  const currentPath = window.location.pathname;
  const navLinks = sidebar.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  // เพิ่ม sidebar เข้าไปใน container ก่อนส่วนอื่นๆ
  if (container.firstChild) {
    container.insertBefore(sidebar, container.firstChild);
  } else {
    container.appendChild(sidebar);
  }

  // ตรวจสอบว่ามี main-content หรือไม่
  let mainContent = container.querySelector(".main-content");
  if (!mainContent) {
    // สร้าง main-content และย้ายเนื้อหาทั้งหมดที่ไม่ใช่ sidebar ไปที่นั่น
    mainContent = document.createElement("div");
    mainContent.className = "main-content";

    // ย้ายทุกอย่างที่ไม่ใช่ sidebar ไปยัง main-content
    const childrenToMove = Array.from(container.children).filter((child) => child !== sidebar);
    childrenToMove.forEach((child) => mainContent.appendChild(child));

    container.appendChild(mainContent);
  }

  // สร้างปุ่มจัดการที่มุมขวาบนของหน้า
  // ไม่แสดงปุ่มจัดการเมื่ออยู่ในหน้า manage แล้ว
  if (!currentPath.includes("-manage")) {
    // สร้างปุ่มจัดการข้อมูลที่จะแสดงข้างหัวข้อ
    const adminButton = document.createElement("div");
    adminButton.className = "admin-actions admin-only";
    adminButton.id = "admin-actions-inline";
    adminButton.style.display = "none";
    adminButton.style.marginLeft = "15px";
    adminButton.style.verticalAlign = "middle";

    const manageButton = document.createElement("div");
    manageButton.className = "button";
    manageButton.id = "manage-button";
    manageButton.style.padding = "8px 15px";
    manageButton.style.backgroundColor = "#3498db";
    manageButton.style.color = "white";
    manageButton.style.borderRadius = "5px";
    manageButton.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    manageButton.style.cursor = "pointer";
    manageButton.style.transition = "all 0.3s";
    manageButton.style.whiteSpace = "nowrap"; // ป้องกันข้อความขึ้นบรรทัดใหม่
    manageButton.style.display = "inline-block";
    manageButton.style.fontWeight = "bold";


    let manageUrl = "";
    if (currentPath.includes("water")) {
      manageButton.innerHTML = '<i class="fas fa-water"></i>&nbsp;&nbsp;จัดการข้อมูลระบบบำบัดน้ำ';
      manageUrl = "/water-manage";
    } else if (currentPath.includes("waste")) {
      manageButton.innerHTML = '<i class="fas fa-trash"></i>&nbsp;&nbsp;จัดการข้อมูลระบบจัดการขยะ';
      manageUrl = "/waste-manage";
    } else {
      manageButton.innerHTML = '<i class="fas fa-cogs"></i>&nbsp;&nbsp;จัดการข้อมูล';
      manageUrl = "/water-manage"; // default
    }

    // เพิ่ม event handler
    manageButton.onclick = async function () {
      const authData = await checkAuthStatus();
      if (!authData || !authData.isAuthenticated) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง token หมดอายุ");
        window.location.href = "/login";
        return;
      }
      window.location.href = manageUrl;
    };

    // ประกอบปุ่มเข้าด้วยกัน
    adminButton.appendChild(manageButton);

    // หาหัวข้อของหน้าเพื่อแทรกปุ่ม
    const dashboardTitle = document.querySelector(".dashboard-title");
    if (dashboardTitle) {
      dashboardTitle.style.display = "inline-block"; // ปรับให้อยู่บรรทัดเดียวกับปุ่ม
      dashboardTitle.parentNode.insertBefore(adminButton, dashboardTitle.nextSibling);

      // เพิ่ม style สำหรับจัดการแสดงผล
      const style = document.createElement("style");
      style.textContent = `
                .dashboard-header {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    width: 100%;
                }
                .dashboard-title {
                    margin-right: 0;
                    margin-bottom: 0;
                    flex: 0 0 auto;
                }
                #admin-actions-inline {
                    flex: 0 0 auto;
                    margin-left: auto !important;
                }
                #manage-button:hover {
                    background-color: #2980b9;
                    transform: translateY(-2px);
                }
                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        justify-content: flex-start;
                    }
                    #admin-actions-inline {
                        margin-left: 0 !important;
                        margin-top: 10px;
                        align-self: flex-end;
                    }
                }
            `;
      document.head.appendChild(style);
    }
  }
}

// ฟังก์ชั่นจัดการเมนูที่เลือก
function setupActiveMenu() {
  // ดึงพาธปัจจุบัน
  const currentPath = window.location.pathname;

  // ดึงเมนูทั้งหมด
  const menuLinks = document.querySelectorAll(".nav-link");

  // ลบคลาส active จากทุกเมนู
  menuLinks.forEach((link) => {
    link.classList.remove("active");
  });

  // กำหนดคลาส active ให้กับเมนูที่ตรงกับพาธปัจจุบัน
  menuLinks.forEach((link) => {
    // ตรวจสอบว่า href ของลิงก์นี้ตรงกับพาธปัจจุบันหรือไม่
    if (
      link.getAttribute("href") === currentPath ||
      (currentPath.includes(link.getAttribute("href")) && link.getAttribute("href") !== "/")
    ) {
      link.classList.add("active");
    }
  });

  // เพิ่ม event listener สำหรับการคลิกที่เมนู
  menuLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // ลบคลาส active จากทุกเมนู
      menuLinks.forEach((l) => l.classList.remove("active"));

      // เพิ่มคลาส active ให้กับเมนูที่ถูกคลิก
      this.classList.add("active");
    });
  });
}

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ
async function checkAuthStatus() {
  try {
    const response = await fetch("/api/auth/status", {
      method: "GET",
      credentials: "include", // ส่ง cookie ไปด้วย
    });

    // ตรวจสอบว่า response มี status 200 OK
    if (!response.ok) {
      console.error("เกิดข้อผิดพลาดในการเรียก API:", response.status);
      return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API ไม่ได้ส่งข้อมูลกลับมาในรูปแบบ JSON");
      return;
    }

    const data = await response.json();

    const loginButton = document.querySelector(".login-button");

    if (data.isAuthenticated && data.user) {
      // ถ้าเข้าสู่ระบบแล้ว เปลี่ยนปุ่มเข้าสู่ระบบเป็นชื่อผู้ใช้และปุ่มออกจากระบบ
      loginButton.textContent = `${data.user.username} (ออกจากระบบ)`;
      loginButton.href = "/api/auth/logout";

      // แสดงชื่อและสถานะของผู้ใช้
      const userGreeting = document.getElementById("user-greeting");
      const userFullname = document.getElementById("user-fullname");
      const userRoleBadge = document.getElementById("user-role-badge");

      if (userGreeting && userFullname && userRoleBadge) {
        userGreeting.style.display = "block";
        userFullname.textContent = data.user.full_name;

        // แสดงสถานะ (role) พร้อมรูปแบบที่แตกต่างกัน
        userRoleBadge.textContent = data.user.role === "admin" ? "admin" : "user";
        userRoleBadge.className = data.user.role === "admin" ? "role-badge admin-role" : "role-badge user-role";
      }

      // แสดงการ์ดการจัดการที่มี class "admin-only"
      document.querySelectorAll(".admin-only").forEach((element) => {
        element.style.display = "block";
      });

      // ซ่อนลิงก์ไปยังหน้า login และ register ถ้ามี
      const currentPath = window.location.pathname;
      if (currentPath.includes("/login") || currentPath.includes("/register")) {
        // ถ้าอยู่ที่หน้า login หรือ register ให้ redirect ไปที่หน้าหลัก
        window.location.href = "/water-dashboard";
      }

      return data;
    } else {
      // ถ้ายังไม่ได้เข้าสู่ระบบ ให้แสดงปุ่มเข้าสู่ระบบตามปกติ
      loginButton.textContent = "เข้าสู่ระบบ";
      loginButton.href = "/login";

      // ซ่อนการ์ดการจัดการที่มี class "admin-only"
      document.querySelectorAll(".admin-only").forEach((element) => {
        element.style.display = "none";
      });
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการตรวจสอบสถานะการเข้าสู่ระบบ:", error);
  }
}
//
//
//
//
//
//
//
//
//
//
//
// ฟังก์ชันสำหรับปฏิทินภาษาไทย
function initThaiDatePicker() {
  // ชื่อเดือนภาษาไทย
  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  // ชื่อวันภาษาไทย
  const thaiWeekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  // แปลงวันที่เป็น string ในรูปแบบ วันที่ เดือน พ.ศ.
  function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    return `${day} ${thaiMonths[month]} ${year}`;
  }

  // แปลงวันที่ string ในรูปแบบ dd/mm/yyyy เป็น Date object
  function parseDate(dateString) {
    if (!dateString) return new Date();

    if (dateString.includes(" ")) {
      // รูปแบบ "วันที่ เดือน ปี"
      const parts = dateString.split(" ");
      const day = parseInt(parts[0], 10);
      const monthIndex = thaiMonths.indexOf(parts[1]);
      const year = parseInt(parts[2], 10) - 543; // แปลงจากปี พ.ศ. เป็น ค.ศ.
      return new Date(year, monthIndex, day);
    } else {
      // รูปแบบ dd/mm/yyyy
      const parts = dateString.split("/");
      if (parts.length !== 3) return new Date();

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10) - 543; // แปลงจากปี พ.ศ. เป็น ค.ศ.

      return new Date(year, month, day);
    }
  }

  // ดึง element input ที่เป็นประเภท date ทั้งหมด
  const dateInputs = document.querySelectorAll('input[type="date"]');

  // แปลง input ทั้งหมดเป็นปฏิทินไทย
  dateInputs.forEach((input) => {
    // ซ่อน input เดิม
    input.style.display = "none";

    // สร้าง container สำหรับปฏิทินไทย
    const container = document.createElement("div");
    container.className = "thai-datepicker-container";
    input.parentNode.insertBefore(container, input);

    // สร้าง wrapper สำหรับ input
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "thai-date-input-wrapper";
    container.appendChild(inputWrapper);

    // สร้าง element สำหรับแสดงวันที่
    const dateDisplay = document.createElement("div");
    dateDisplay.className = "thai-date-display";
    dateDisplay.textContent = input.value ? formatDate(parseDate(input.value)) : "เลือกวันที่";
    inputWrapper.appendChild(dateDisplay);

    // สร้าง icon calendar
    const calendarIcon = document.createElement("i");
    calendarIcon.className = "fas fa-calendar-alt calendar-icon";
    inputWrapper.appendChild(calendarIcon);

    // สร้าง popup สำหรับปฏิทิน
    const calendarPopup = document.createElement("div");
    calendarPopup.className = "calendar-popup";
    calendarPopup.style.display = "none";
    container.appendChild(calendarPopup);

    // สร้าง container สำหรับปฏิทิน
    const calendarContainer = document.createElement("div");
    calendarContainer.className = "thai-calendar-container";
    calendarPopup.appendChild(calendarContainer);

    // ตัวแปรสำหรับเก็บวันที่ปัจจุบันที่แสดงในปฏิทิน
    let currentDate = input.value ? parseDate(input.value) : new Date();
    let selectedDate = input.value ? parseDate(input.value) : null;

    // ตัวแปรเก็บสถานะการแสดงตัวเลือกเดือนและปี
    let isShowingMonthSelector = false;
    let isShowingYearSelector = false;

    // ฟังก์ชันสำหรับสร้างตัวเลือกเดือน
    function renderMonthSelector() {
      calendarContainer.innerHTML = "";
      isShowingMonthSelector = true;
      isShowingYearSelector = false;

      // สร้าง header
      const selectorHeader = document.createElement("div");
      selectorHeader.className = "calendar-header";
      calendarContainer.appendChild(selectorHeader);

      // ปุ่มย้อนกลับ
      const backBtn = document.createElement("button");
      backBtn.className = "calendar-nav-btn";
      backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
      backBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        isShowingMonthSelector = false;
        renderCalendar();
      });
      selectorHeader.appendChild(backBtn);

      // แสดงปี
      const yearDisplay = document.createElement("div");
      yearDisplay.className = "month-year-display clickable";
      yearDisplay.textContent = `${currentDate.getFullYear() + 543}`;
      yearDisplay.addEventListener("click", (e) => {
        e.stopPropagation();
        renderYearSelector();
      });
      selectorHeader.appendChild(yearDisplay);

      // ช่องว่างด้านขวา
      const spacer = document.createElement("div");
      spacer.style.width = "30px";
      selectorHeader.appendChild(spacer);

      // สร้างกริดเดือน
      const monthsGrid = document.createElement("div");
      monthsGrid.className = "months-grid";
      calendarContainer.appendChild(monthsGrid);

      // วันที่ปัจจุบัน
      const today = new Date();

      // เพิ่มเดือนทั้งหมด
      thaiMonths.forEach((month, index) => {
        const monthCell = document.createElement("div");
        monthCell.className = "month-cell";
        monthCell.textContent = month;

        // ไฮไลท์เดือนที่เลือก
        if (index === currentDate.getMonth()) {
          monthCell.classList.add("selected");
        }

        // ไฮไลท์เดือนปัจจุบัน
        if (currentDate.getFullYear() === today.getFullYear() && index === today.getMonth()) {
          monthCell.classList.add("today");
        }

        monthCell.addEventListener("click", (e) => {
          e.stopPropagation();
          currentDate.setMonth(index);
          isShowingMonthSelector = false;
          renderCalendar();
        });

        monthsGrid.appendChild(monthCell);
      });
    }

    // ฟังก์ชันสำหรับสร้างตัวเลือกปี
    function renderYearSelector() {
      calendarContainer.innerHTML = "";
      isShowingYearSelector = true;
      isShowingMonthSelector = false;

      // สร้าง header
      const selectorHeader = document.createElement("div");
      selectorHeader.className = "calendar-header";
      calendarContainer.appendChild(selectorHeader);

      // ปุ่มย้อนกลับ
      const backBtn = document.createElement("button");
      backBtn.className = "calendar-nav-btn";
      backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
      backBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        renderMonthSelector();
      });
      selectorHeader.appendChild(backBtn);

      // ปุ่มย้อนกลับปี
      const prevYearsBtn = document.createElement("button");
      prevYearsBtn.className = "calendar-nav-btn prev-years-btn";
      prevYearsBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
      prevYearsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentDate.setFullYear(currentDate.getFullYear() - 25);
        renderYearSelector();
      });

      // สร้าง wrapper สำหรับปี
      const yearHeaderWrapper = document.createElement("div");
      yearHeaderWrapper.className = "year-header-wrapper";
      selectorHeader.appendChild(yearHeaderWrapper);

      // เพิ่มปุ่มย้อนกลับปีด้านซ้าย
      yearHeaderWrapper.appendChild(prevYearsBtn);

      // ปี
      const currentThaiYear = currentDate.getFullYear() + 543;
      const startYear = currentThaiYear - 12;
      const endYear = startYear + 24;
      const headerText = document.createElement("div");
      headerText.className = "month-year-display";
      headerText.textContent = `${startYear} - ${endYear}`;
      yearHeaderWrapper.appendChild(headerText);

      // ปุ่มไปข้างหน้าปี
      const nextYearsBtn = document.createElement("button");
      nextYearsBtn.className = "calendar-nav-btn next-years-btn";
      nextYearsBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
      nextYearsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentDate.setFullYear(currentDate.getFullYear() + 25);
        renderYearSelector();
      });

      // เพิ่มปุ่มไปข้างหน้าปีด้านขวา
      yearHeaderWrapper.appendChild(nextYearsBtn);

      // สร้างกริดปี
      const yearsGrid = document.createElement("div");
      yearsGrid.className = "years-grid";
      calendarContainer.appendChild(yearsGrid);

      // เพิ่มปีทั้งหมด (25 ปี)
      for (let i = -12; i <= 12; i++) {
        const year = currentDate.getFullYear() + i;
        const thaiYear = year + 543;

        const yearCell = document.createElement("div");
        yearCell.className = "year-cell";
        yearCell.textContent = thaiYear;

        // ไฮไลท์ปีปัจจุบัน
        if (i === 0) {
          yearCell.classList.add("selected");
        }

        // เพิ่มไฮไลท์ปีปัจจุบันตามระบบ
        const today = new Date();
        if (year === today.getFullYear()) {
          yearCell.classList.add("today");
        }

        yearCell.addEventListener("click", (e) => {
          e.stopPropagation();
          currentDate.setFullYear(year);
          isShowingYearSelector = false;
          renderMonthSelector();
        });

        yearsGrid.appendChild(yearCell);
      }
    }

    // ฟังก์ชันสำหรับสร้างปฏิทิน
    function renderCalendar() {
      if (isShowingMonthSelector) {
        renderMonthSelector();
        return;
      }

      if (isShowingYearSelector) {
        renderYearSelector();
        return;
      }

      // ล้าง container
      calendarContainer.innerHTML = "";

      // สร้าง header
      const calendarHeader = document.createElement("div");
      calendarHeader.className = "calendar-header";
      calendarContainer.appendChild(calendarHeader);

      // ปุ่มย้อนกลับเดือน
      const prevMonthBtn = document.createElement("button");
      prevMonthBtn.className = "calendar-nav-btn";
      prevMonthBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
      prevMonthBtn.addEventListener("click", (e) => {
        // ป้องกันการเกิด event bubbling ไปถึง document
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
      });
      calendarHeader.appendChild(prevMonthBtn);

      // แสดงเดือนและปี (สามารถคลิกได้)
      const monthYearDisplay = document.createElement("div");
      monthYearDisplay.className = "month-year-display clickable";

      // แยกเดือนและปีเป็นคนละส่วนเพื่อให้คลิกแยกได้
      const monthDisplay = document.createElement("span");
      monthDisplay.className = "month-display";
      monthDisplay.textContent = thaiMonths[currentDate.getMonth()];
      monthDisplay.addEventListener("click", (e) => {
        e.stopPropagation();
        renderMonthSelector();
      });

      const yearDisplay = document.createElement("span");
      yearDisplay.className = "year-display";
      yearDisplay.textContent = ` ${currentDate.getFullYear() + 543}`;
      yearDisplay.addEventListener("click", (e) => {
        e.stopPropagation();
        renderYearSelector();
      });

      monthYearDisplay.appendChild(monthDisplay);
      monthYearDisplay.appendChild(yearDisplay);
      calendarHeader.appendChild(monthYearDisplay);

      // ปุ่มไปเดือนถัดไป
      const nextMonthBtn = document.createElement("button");
      nextMonthBtn.className = "calendar-nav-btn";
      nextMonthBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
      nextMonthBtn.addEventListener("click", (e) => {
        // ป้องกันการเกิด event bubbling ไปถึง document
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
      });
      calendarHeader.appendChild(nextMonthBtn);

      // สร้างตัวแสดงปฏิทิน
      const calendarBody = document.createElement("div");
      calendarBody.className = "calendar-body";
      calendarContainer.appendChild(calendarBody);

      // สร้างแถวสำหรับแสดงวัน
      const weekdaysRow = document.createElement("div");
      weekdaysRow.className = "weekdays-row";
      calendarBody.appendChild(weekdaysRow);

      // เพิ่มชื่อวันในสัปดาห์
      thaiWeekdays.forEach((weekday) => {
        const weekdayCell = document.createElement("div");
        weekdayCell.className = "weekday-cell";
        weekdayCell.textContent = weekday;
        weekdaysRow.appendChild(weekdayCell);
      });

      // สร้างตารางวันที่
      const daysGrid = document.createElement("div");
      daysGrid.className = "days-grid";
      calendarBody.appendChild(daysGrid);

      // หาวันแรกของเดือน
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstWeekDay = firstDayOfMonth.getDay();

      // หาจำนวนวันในเดือน
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

      // สร้างช่องว่างก่อนวันแรกของเดือน
      for (let i = 0; i < firstWeekDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "day-cell empty";
        daysGrid.appendChild(emptyCell);
      }

      // วันที่ปัจจุบัน
      const today = new Date();

      // สร้างวันที่ในเดือน
      for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "day-cell";
        dayCell.textContent = day;

        // เพิ่ม class สำหรับวันนี้
        if (
          currentDate.getFullYear() === today.getFullYear() &&
          currentDate.getMonth() === today.getMonth() &&
          day === today.getDate()
        ) {
          dayCell.classList.add("today");
        }

        // เพิ่ม class สำหรับวันที่เลือก
        if (
          selectedDate &&
          currentDate.getFullYear() === selectedDate.getFullYear() &&
          currentDate.getMonth() === selectedDate.getMonth() &&
          day === selectedDate.getDate()
        ) {
          dayCell.classList.add("selected");
        }

        // เพิ่ม event listener สำหรับการเลือกวันที่
        dayCell.addEventListener("click", (e) => {
          // ป้องกันการเกิด event bubbling ไปถึง document
          e.stopPropagation();
          selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

          // บันทึกค่าในรูปแบบที่ input ต้องการ (yyyy-mm-dd)
          const isoDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${selectedDate.getDate().toString().padStart(2, "0")}`;
          input.value = isoDate;

          // แสดงผลในรูปแบบไทย (วันที่ เดือน พ.ศ.)
          dateDisplay.textContent = formatDate(selectedDate);

          // ซ่อนปฏิทิน
          calendarPopup.style.display = "none";

          // ทริกเกอร์ event change สำหรับ input
          const event = new Event("change", { bubbles: true });
          input.dispatchEvent(event);
        });

        daysGrid.appendChild(dayCell);
      }
    }

    // ตัวแปรเพื่อเก็บ reference ไปยัง event listener
    let documentClickListener = null;

    // เปิด/ปิดปฏิทินเมื่อคลิกที่ input หรือ icon
    function toggleCalendar(e) {
      // ป้องกันการเกิด event bubbling
      if (e) {
        e.stopPropagation();
      }

      if (calendarPopup.style.display === "none") {
        calendarPopup.style.display = "block";
        isShowingMonthSelector = false;
        isShowingYearSelector = false;
        renderCalendar();

        // ลบ event listener เก่าถ้ามี
        if (documentClickListener) {
          document.removeEventListener("click", documentClickListener);
        }

        // ปิดปฏิทินเมื่อคลิกข้างนอก
        documentClickListener = function (event) {
          // ตรวจสอบว่าคลิกนอก container หรือไม่
          if (!container.contains(event.target)) {
            calendarPopup.style.display = "none";
            document.removeEventListener("click", documentClickListener);
            documentClickListener = null;
          }
        };

        // ใช้ timeout เพื่อหลีกเลี่ยงการปิดทันที
        setTimeout(() => {
          document.addEventListener("click", documentClickListener);
        }, 10);
      } else {
        calendarPopup.style.display = "none";
        // ลบ event listener เมื่อปิดปฏิทิน
        if (documentClickListener) {
          document.removeEventListener("click", documentClickListener);
          documentClickListener = null;
        }
      }
    }

    // ป้องกันไม่ให้การคลิกภายในปฏิทินทำให้ปฏิทินปิด
    calendarPopup.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    dateDisplay.addEventListener("click", toggleCalendar);
    calendarIcon.addEventListener("click", toggleCalendar);
  });
}

// ฟังก์ชันตรวจสอบการเข้าสู่ระบบสำเร็จจาก provider
function checkProviderLoginSuccess() {
  // ตรวจสอบ URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const loginSuccess = urlParams.get("login_success");

  // ตรวจสอบการเข้าสู่ระบบสำเร็จ
  if (loginSuccess === "provider") {
    alert("เข้าสู่ระบบด้วย providerID สำเร็จ!");
    // ลบ parameters จาก URL
    history.replaceState(null, "", window.location.pathname);
  }
}

// เพิ่มฟังก์ชันล้าง cookie auth_token สำหรับใช้งานทั่วไปในแอปพลิเคชัน
