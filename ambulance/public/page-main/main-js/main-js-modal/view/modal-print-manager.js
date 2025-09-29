/**
 * Modal Print Manager - จัดการการพิมพ์ Modal สำหรับรายงานการตรวจสอบรถ
 */

import { checkTokenValid, redirectToLogin } from "/global-auth-status.js";
import { removeToken, getStoredToken } from "/global-api.js";

export class ModalPrintManager {
  constructor() {
    // ไม่ต้องมี constructor พิเศษ
  }

  /**
   * พิมพ์ Modal
   * @param {string} modalContentId - ID ของ modal content ที่จะพิมพ์
   */
  async printModal(modalContentId = 'modalContent') {
    // ตรวจสอบ token ก่อนพิมพ์
    const token = getStoredToken();
    
    const tokenValidation = await checkTokenValid(token);
    if (!tokenValidation.valid) {
      alert(tokenValidation.message || 'กรุณาเข้าสู่ระบบใหม่');
      removeToken();
      redirectToLogin();
      return;
    }
    
    const modalContent = document.getElementById(modalContentId);
    
    if (!modalContent) {
      console.error('Modal content not found:', modalContentId);
      alert('ไม่สามารถพิมพ์ได้ กรุณาลองใหม่');
      return;
    }
    
    try {
      // สร้าง HTML สำหรับพิมพ์โดยปรับปรุง icon สำหรับรายการที่ไม่ผ่าน
      const printContent = this.createPrintContent(modalContent.innerHTML);
      const printHTML = this.createPrintHTML(printContent);
      
      // สร้างหน้าต่างใหม่สำหรับพิมพ์
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        this.printInCurrentWindow(printHTML);
        return;
      }
      
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Print error:', error);
      alert('เกิดข้อผิดพลาดในการพิมพ์: ' + error.message);
    }
  }

  /**
   * พิมพ์ในหน้าต่างปัจจุบัน (fallback method)
   * @param {string} printHTML - HTML ที่จะพิมพ์
   */
  printInCurrentWindow(printHTML) {
    // สร้าง iframe ชั่วคราว
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    
    document.body.appendChild(printFrame);
    
    try {
      printFrame.contentDocument.write(printHTML);
      printFrame.contentDocument.close();
      
      // รอให้โหลดเสร็จแล้วพิมพ์
      printFrame.onload = () => {
        try {
          printFrame.contentWindow.print();
          // ลบ iframe หลังพิมพ์
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 1000);
        } catch (err) {
          console.error('Print iframe error:', err);
          document.body.removeChild(printFrame);
          alert('ไม่สามารถพิมพ์ได้ กรุณาลองใหม่');
        }
      };
      
    } catch (error) {
      console.error('Iframe creation error:', error);
      document.body.removeChild(printFrame);
      alert('ไม่สามารถพิมพ์ได้ กรุณาลองใหม่');
    }
  }

  /**
   * สร้าง HTML สำหรับพิมพ์
   * @param {string} printContent - เนื้อหาที่จะพิมพ์
   * @returns {string} HTML สำหรับพิมพ์
   */
  createPrintHTML(printContent) {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>รายงานการตรวจสอบรถ</title>
                <meta charset="UTF-8">
                    <link
      href="https://fonts.googleapis.com/css2?family=Kanit&family=Mitr:wght@300;500&family=Prompt:wght@600&display=swap"
      rel="stylesheet"
    />
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                <div class="container-fluid p-3">
                    <div class="print-header text-center mb-4">
                        <h2>รายงานการตรวจสอบรถพยาบาล</h2>
                        <p class="print-info">พิมพ์เมื่อ: ${this.getCurrentDateTime()}</p>
                    </div>
                    ${printContent}
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    }
                </script>
            </body>
            </html>
        `;
  }

  /**
   * สร้างเนื้อหาสำหรับพิมพ์โดยปรับปรุง icon
   * @param {string} originalContent - เนื้อหาต้นฉบับ
   * @returns {string} เนื้อหาที่ปรับปรุงแล้ว
   */
  createPrintContent(originalContent) {
    // แทนที่ icon สำหรับรายการที่ไม่ผ่าน (ลบ icon ออก)
    let printContent = originalContent.replace(
      /<i class="fas fa-times-circle text-white"><\/i>/g,
      '<span class="print-hide-icon"></span>'
    );

    // เก็บ icon สำหรับรายการที่ผ่าน
    printContent = printContent.replace(
      /<i class="fas fa-check-circle text-white"><\/i>/g,
      '<i class="fas fa-check-circle text-success"></i>'
    );

    return printContent;
  }

  /**
   * รับ CSS สำหรับการพิมพ์
   * @returns {string} CSS styles
   */
  getPrintStyles() {
    return `
            body {
                font-family: 'Mitr', sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
            }
            
            h1, h2, h3, h4, h5, h6 {
                font-family: 'Mitr', sans-serif;
                font-weight: 700;
            }
            
            .card {
                border: 2px solid #dee2e6 !important;
                margin-bottom: 0.5rem;
                break-inside: avoid;
            }
            
            .card-header {
                padding: 8px 12px;
                font-weight: 600;
            }
            
            .card-body {
                padding: 8px 12px;
                font-size: 13px;
            }
            
            .badge {
                font-size: 11px;
                padding: 3px 6px;
            }
            
            .text-center {
                text-align: center;
            }
            
            .mb-4 {
                margin-bottom: 1.5rem;
            }
            
            .print-header {
                border-bottom: 3px solid #333;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            
            .print-info {
                font-size: 12px;
                color: #666;
            }
            
            /* ซ่อน icon สำหรับรายการที่ไม่ผ่าน */
            .print-hide-icon {
                display: none !important;
            }
            
            /* รูปภาพใน checklist */
            .checklist-image-gallery {
                margin-top: 0.5rem;
                page-break-inside: avoid;
            }
            
            .checklist-image-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .checklist-image-item {
                border: 1px solid #dee2e6;
                border-radius: 4px;
                overflow: hidden;
                page-break-inside: avoid;
                min-height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: white;
            }
            
            .checklist-image-item img {
                width: 100%;
                height: 120px;
                object-fit: contain;
                object-position: center;
                display: block;
                background-color: #f8f9fa;
            }
            
            .checklist-image-gallery-title {
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: #495057;
            }
            
            @media print {
                .no-print { 
                    display: none !important; 
                }
                
                body { 
                    font-size: 12px; 
                }
                
                .card { 
                    border: 1px solid #333 !important; 
                    box-shadow: none !important;
                }
                
                .card-header {
                    background-color: #f8f9fa !important;
                    color: #333 !important;
                }
                
                .bg-danger {
                    background-color: #f8f9fa !important;
                    color: #333 !important;
                }
                
                .bg-success {
                    background-color: #e8f5e8 !important;
                    color: #333 !important;
                }
                
                .text-white {
                    color: #333 !important;
                }
                
                .border-danger {
                    border-color: #333 !important;
                }
                
                .border-success {
                    border-color: #333 !important;
                }
                
                /* รูปภาพสำหรับ print */
                .checklist-image-gallery {
                    margin-top: 0.5rem;
                    background-color: transparent !important;
                    border: none !important;
                    page-break-inside: avoid;
                }
                
                .checklist-image-grid {
                    display: grid !important;
                    grid-template-columns: repeat(2, 1fr) !important;
                    gap: 0.3rem !important;
                    margin-top: 0.3rem !important;
                }
                
                .checklist-image-item {
                    border: none !important;
                    border-radius: 4px !important;
                    overflow: hidden !important;
                    page-break-inside: avoid !important;
                    background: transparent !important;
                    min-height: 180px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .checklist-image-item img {
                    width: 100% !important;
                    height: 180px !important;
                    max-height: 180px !important;
                    object-fit: contain !important;
                    object-position: center !important;
                    display: block !important;
                    border: none !important;
                    background-color: transparent !important;
                }
                
                .checklist-image-gallery-title {
                    display: none !important;
                }
                
                .checklist-image-loading,
                .checklist-image-error {
                    display: none !important;
                }
            }
        `;
  }

  /**
   * รับวันที่และเวลาปัจจุบันในรูปแบบไทย
   * @returns {string} วันที่และเวลาปัจจุบัน
   */
  getCurrentDateTime() {
    try {
              return new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
      });
    } catch (error) {
              console.error('Error formatting current date time:', error);
      return new Date().toLocaleString();
    }
  }
}
