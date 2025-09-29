/**
 * EventSourceManager - จัดการการเชื่อมต่อ Server-Sent Events (SSE)
 * ทำหน้าที่:
 * - เชื่อมต่อกับ SSE endpoint
 * - จัดการเหตุการณ์เมื่อได้รับข้อมูลใหม่
 * - จัดการการเชื่อมต่อใหม่อัตโนมัติเมื่อการเชื่อมต่อถูกตัด
 */
export class EventSourceManager {
  constructor() {
    this.eventSource = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryInterval = 5000; // 5 วินาที
    this.callbacks = {
      onUpdate: null,
      onError: null,
      onConnect: null,
      onDisconnect: null,
    };
  }

  /**
   * เชื่อมต่อกับ Server-Sent Events endpoint
   */
  connect() {
    console.log("กำลังเชื่อมต่อกับ SSE Server...");

    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource("/api/data-events");

      this.eventSource.onopen = () => {
        console.log("การเชื่อมต่อ SSE สำเร็จ");
        this.retryCount = 0;

        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการแปลงข้อมูล SSE:", error);

          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("การเชื่อมต่อ SSE ผิดพลาด:", error);
        this.eventSource.close();

        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect(error);
        }

        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(
            `กำลังลองเชื่อมต่อใหม่ในอีก ${this.retryInterval / 1000} วินาที... (ครั้งที่ ${this.retryCount}/${
              this.maxRetries
            })`
          );
          setTimeout(() => this.connect(), this.retryInterval);
        } else {
          console.error("เกินจำนวนครั้งในการลองเชื่อมต่อใหม่");
        }
      };
    } catch (error) {
      console.error("ไม่สามารถสร้างการเชื่อมต่อ SSE:", error);

      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  /**
   * จัดการเหตุการณ์ที่ได้รับจาก server
   */
  handleEvent(data) {
    console.log("ได้รับข้อมูล SSE:", data);

    // ตรวจสอบว่ากำลังแก้ไขข้อมูลหรือไม่
    const editModal = document.getElementById("edit-modal");
    const deleteModal = document.getElementById("delete-confirm-modal");
    const isModalOpen =
      (editModal && editModal.style.display === "block") || (deleteModal && deleteModal.style.display === "block");

    if (isModalOpen) {
      console.log("ไม่อัปเดตข้อมูลเนื่องจากมีหน้าต่างโมดัลเปิดอยู่");
      return;
    }

    switch (data.type) {
      case "create":
      case "update":
      case "delete":
        if (this.callbacks.onUpdate) {
          this.callbacks.onUpdate(data);
        } else {
          // ถ้าไม่มี callback ให้โหลดข้อมูลใหม่ทั้งหมด
          if (window.reloadDataTable) {
            console.log(`กำลังโหลดข้อมูลใหม่เนื่องจากมีการ ${data.type}`);
            window.reloadDataTable();
          }
        }
        break;

      case "connected":
        console.log("เชื่อมต่อ SSE สำเร็จ:", data.message);
        break;

      default:
        console.log("ได้รับข้อมูลไม่รู้จัก:", data);
        break;
    }
  }

  /**
   * กำหนด callback สำหรับเหตุการณ์ต่างๆ
   */
  on(event, callback) {
    if (typeof callback !== "function") {
      return;
    }

    switch (event) {
      case "update":
        this.callbacks.onUpdate = callback;
        break;
      case "error":
        this.callbacks.onError = callback;
        break;
      case "connect":
        this.callbacks.onConnect = callback;
        break;
      case "disconnect":
        this.callbacks.onDisconnect = callback;
        break;
    }
  }

  /**
   * ยกเลิกการเชื่อมต่อ
   */
  disconnect() {
    if (this.eventSource) {
      console.log("กำลังปิดการเชื่อมต่อ SSE");
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// สร้าง singleton instance
const eventSourceManager = new EventSourceManager();
export default eventSourceManager;
