// โมดูลสำหรับจัดการการแบ่งหน้า

// ฟังก์ชันสำหรับอัปเดตการแบ่งหน้า
export function updatePagination(currentPage, pageSize, totalPages, total, goToPage) {
  document.getElementById("showing-from").textContent = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  document.getElementById("showing-to").textContent = Math.min(currentPage * pageSize, total);
  document.getElementById("total-items").textContent = total;

  // อัปเดตปุ่มก่อนหน้าและถัดไป
  document.getElementById("prev-page-btn").disabled = currentPage === 1;
  document.getElementById("next-page-btn").disabled = currentPage === totalPages || totalPages === 0;

  // สร้างปุ่มหมายเลขหน้า
  const pageNumbers = document.getElementById("page-numbers");
  pageNumbers.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  // ปุ่มไปหน้าแรก (<<)
  const firstPageBtn = document.createElement("button");
  firstPageBtn.className = `page-number first-page-btn ${currentPage === 1 ? "disabled" : ""}`;
  firstPageBtn.innerHTML = "&laquo;";
  firstPageBtn.disabled = currentPage === 1;
  if (currentPage !== 1) {
    firstPageBtn.addEventListener("click", () => goToPage(1));
  }
  pageNumbers.appendChild(firstPageBtn);

  // กำหนดหน้าที่จะแสดง
  let startPage, endPage;
  const maxVisiblePages = 7; // จำนวนปุ่มหมายเลขหน้าที่แสดงสูงสุด (ไม่รวม << และ >>)

  if (totalPages <= maxVisiblePages) {
    // ถ้ามีหน้าไม่เกิน maxVisiblePages หน้า แสดงทั้งหมด
    startPage = 1;
    endPage = totalPages;
  } else {
    // คำนวณช่วงหน้าที่จะแสดง
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (currentPage <= halfVisible + 1) {
      // อยู่ใกล้หน้าแรก
      startPage = 1;
      endPage = maxVisiblePages - 2; // ลบ 2 เพื่อเว้นที่ให้ ... และหน้าสุดท้าย
    } else if (currentPage >= totalPages - halfVisible) {
      // อยู่ใกล้หน้าสุดท้าย
      startPage = totalPages - maxVisiblePages + 3; // บวก 3 เพื่อเว้นที่ให้หน้าแรกและ ...
      endPage = totalPages;
    } else {
      // อยู่ตรงกลาง
      startPage = currentPage - halfVisible + 1;
      endPage = currentPage + halfVisible - 1;
    }
  }

  // สร้างปุ่มหน้าแรก (ถ้าจำเป็น)
  if (startPage > 1) {
    const pageBtn = document.createElement("button");
    pageBtn.className = "page-number";
    pageBtn.textContent = "1";
    pageBtn.addEventListener("click", () => goToPage(1));
    pageNumbers.appendChild(pageBtn);

    // เพิ่ม ellipsis ถ้าไม่ได้เริ่มจากหน้า 2
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "...";
      pageNumbers.appendChild(ellipsis);
    }
  }

  // สร้างปุ่มหมายเลขหน้า
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => goToPage(i));
    pageNumbers.appendChild(pageBtn);
  }

  // เพิ่ม ellipsis และปุ่มหน้าสุดท้าย (ถ้าจำเป็น)
  if (endPage < totalPages) {
    // เพิ่ม ellipsis ถ้าไม่ได้จบที่หน้าก่อนหน้าสุดท้าย
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "...";
      pageNumbers.appendChild(ellipsis);
    }

    // เพิ่มปุ่มหน้าสุดท้าย
    const pageBtn = document.createElement("button");
    pageBtn.className = "page-number";
    pageBtn.textContent = totalPages;
    pageBtn.addEventListener("click", () => goToPage(totalPages));
    pageNumbers.appendChild(pageBtn);
  }

  // ปุ่มไปหน้าสุดท้าย (>>)
  const lastPageBtn = document.createElement("button");
  lastPageBtn.className = `page-number last-page-btn ${currentPage === totalPages ? "disabled" : ""}`;
  lastPageBtn.innerHTML = "&raquo;";
  lastPageBtn.disabled = currentPage === totalPages;
  if (currentPage !== totalPages) {
    lastPageBtn.addEventListener("click", () => goToPage(totalPages));
  }
  pageNumbers.appendChild(lastPageBtn);
}

// ฟังก์ชันสำหรับตั้งค่า event listeners สำหรับการแบ่งหน้า
export function setupPaginationListeners(goToPage, changePageSize) {
  // Event listener สำหรับการเปลี่ยนขนาดหน้า
  document.getElementById("page-size-selector").addEventListener("change", function () {
    changePageSize(parseInt(this.value));
  });

  // Event listeners สำหรับปุ่มก่อนหน้าและถัดไป
  document.getElementById("prev-page-btn").addEventListener("click", function () {
    if (!this.disabled) {
      const currentPage = parseInt(this.getAttribute("data-current-page") || 1);
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    }
  });

  document.getElementById("next-page-btn").addEventListener("click", function () {
    if (!this.disabled) {
      const currentPage = parseInt(this.getAttribute("data-current-page") || 1);
      const totalPages = parseInt(this.getAttribute("data-total-pages") || 1);
      if (currentPage < totalPages) {
        goToPage(currentPage + 1);
      }
    }
  });
}

// ฟังก์ชันสำหรับอัปเดตข้อมูลของปุ่มแบ่งหน้า
export function updatePaginationButtons(currentPage, totalPages) {
  const prevBtn = document.getElementById("prev-page-btn");
  const nextBtn = document.getElementById("next-page-btn");

  prevBtn.setAttribute("data-current-page", currentPage);
  nextBtn.setAttribute("data-current-page", currentPage);
  nextBtn.setAttribute("data-total-pages", totalPages);
}
