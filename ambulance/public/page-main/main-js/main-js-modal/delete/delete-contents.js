/**
 * Delete Modal Content Builder - สร้าง HTML สำหรับ modal
 */

export class DeleteContentBuilder {
  /**
   * สร้าง HTML ของ modal
   */
  static createModalHTML() {
    return `
            <div id="deleteModal" class="delete-modal">
                <div class="delete-modal-content">
                    <div class="delete-modal-header bg-danger">
                        <i class="fas fa-exclamation-triangle text-white"></i>
                        <h5 class="text-white">ยืนยันการลบ</h5>
                    </div>
                    <div class="delete-modal-body">
                        <p>คุณแน่ใจหรือไม่ที่ต้องการลบรายการนี้?</p>
                        <div class="delete-modal-info">
                            <strong>รถ:</strong> <span id="deleteVehicleName">-</span><br>
                            <strong>วันที่:</strong> <span id="deleteDate">-</span>
                        </div>
                    </div>
                    <div class="delete-modal-footer">
                        <button type="button" class="btn-cancel" id="deleteCancelBtn">
                              ยกเลิก
                        </button>
                        <button type="button" class="btn-delete" id="deleteConfirmBtn">
                            <i class="fas fa-trash"></i> ลบ
                        </button>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * อัปเดตข้อมูลใน modal
   */
  static updateContent(item) {
    document.getElementById("deleteVehicleName").textContent =
      item.vehicle_name || "ไม่ระบุ";
    document.getElementById("deleteDate").textContent = this.formatDate(
      item.checked_date
    );
  }

  /**
   * จัดรูปแบบวันที่
   */
  static formatDate(dateString) {
    if (!dateString) return "ไม่ระบุ";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH");
  }
}
