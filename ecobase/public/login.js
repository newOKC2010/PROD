document.addEventListener("DOMContentLoaded", function () {
  console.log("หน้าเข้าสู่ระบบถูกโหลดเมื่อ:", new Date().toLocaleString());

  const loginForm = document.getElementById("login-form");
  const passwordToggle = document.getElementById("password-toggle");
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eye-icon");

  // ตรวจสอบการเปลี่ยนเส้นทางจาก provider หรือไม่
  checkRedirectFromProvider();

  // ฟังก์ชัน toggle การแสดงรหัสผ่าน
  passwordToggle.addEventListener("click", function () {
    // สลับประเภทของ input ระหว่าง password กับ text
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // สลับไอคอนตา
    if (type === "password") {
      eyeIcon.className = "fa-solid fa-eye";
    } else {
      eyeIcon.className = "fa-solid fa-eye-slash";
    }
  });

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    console.log("พยายามเข้าสู่ระบบด้วยชื่อผู้ใช้:", username);

    try {
      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.redirected) {
        alert("เข้าสู่ระบบสำเร็จ!");
        window.location.href = response.url;
        return;
      }

      // จัดการกรณี error ตาม status code
      if (!response.redirected) {
        const data = await response.json();
        if (response.status === 401) {
          alert(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        } else if (response.status === 500) {
          alert(
            data.message ||
              "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง"
          );
        } else {
          alert(
            data.message ||
              "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง"
          );
        }
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ:", error);
      alert("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง");
    }
  });

  // ฟังก์ชันตรวจสอบการเข้าสู่ระบบจาก provider
  function checkRedirectFromProvider() {
    // ตรวจสอบ URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const loginSuccess = urlParams.get('login_success');
    
    // ตรวจสอบการเข้าสู่ระบบสำเร็จ
    if (loginSuccess === 'provider') {
        alert('เข้าสู่ระบบด้วย providerID สำเร็จ!');
        // ลบ parameters จาก URL
        history.replaceState(null, '', window.location.pathname);
        return;
    }
    
    // ถ้ามี error จาก provider
    if (error) {
        console.log('พบข้อผิดพลาดจาก Provider:', error);
        let message = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        
        // ตรวจสอบประเภทของ error
        if (error === 'user_not_found') {
            message = 'ไม่พบข้อมูลการลงทะเบียน กรุณาลงทะเบียนก่อน';
            alert(message);
            window.location.href = '/register';
            return;
        } else if (error === 'auth_failed') {
            message = 'การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง';
        }
        
        alert(message);
        
        // ลบ parameters จาก URL
        history.replaceState(null, '', window.location.pathname);
    }
  }
});
