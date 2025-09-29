let userRole = "";
let userId = "";

// ฟังก์ชันสำหรับตั้งค่าข้อมูลผู้ใช้
export function setUserInfo(role, id) {
  userRole = role;
  userId = id;
}

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้
export function getUserRole() {
  return userRole;
}
