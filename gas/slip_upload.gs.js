/**
 * ============================================================
 * สคริปต์ Google Apps Script สำหรับระบบ E-System School
 * รองรับทั้งการอัปโหลด "ใบเสร็จรับเงิน (PDF)" และ "สลิปโอนเงิน (Image/PDF)"
 * ============================================================
 * 
 * ⚠️ ให้นำโค้ดทั้งหมดนี้ไปวางทับในไฟล์ ก๊อปปี้ไปทั้งหมดเลยครับ
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No Data Provided");
    const data = JSON.parse(e.postData.contents);

    // ============================================
    // ส่วนใหม่: ตรวจสอบว่าเป็นคำสั่งอัปโหลดสลิปหรือไม่
    // ============================================
    if (data.action === 'uploadSlip') {
      return handleSlipUpload(data);
    }

    // ============================================
    // โค้ดเดิมสำหรับอัปโหลดใบเสร็จรับเงิน (ถ้าไม่ระบุ action)
    // ============================================
    const { receiptNo, studentName, academicYear, semester, month, pdfBase64, emailTo, folderId } = data;
    if (!folderId) throw new Error("Missing Folder ID");
    if (!pdfBase64) throw new Error("Missing pdfBase64");

    const rootFolder = DriveApp.getFolderById(folderId);
    
    // สร้างโครงสร้าง Year > Semester > Month (ใช้ชื่อฟังก์ชันเดิม)
    const yearFolder = getOrCreateFolder(academicYear || "ไม่ระบุปี", rootFolder);
    const semFolder = getOrCreateFolder("เทอม " + (semester || "?"), yearFolder);
    const monthFolder = getOrCreateFolder(month || "ไม่ระบุเดือน", semFolder);
    
    // บันทึกไฟล์ PDF ใบเสร็จ
    const fileName = 'Receipt_' + receiptNo + '_' + studentName + '.pdf';
    const blob = Utilities.newBlob(Utilities.base64Decode(pdfBase64), 'application/pdf', fileName);
    const file = monthFolder.createFile(blob);
    
    // ส่งอีเมล (ถ้ามี)
    if (emailTo && emailTo.includes('@')) {
      GmailApp.sendEmail(emailTo, 'สำรองใบเสร็จ - ' + studentName + ' (' + receiptNo + ')', 
        'ระบบสำรองใบเสร็จอัตโนมัติ\nเลขที่: ' + receiptNo + '\nลิงก์: ' + file.getUrl(), {
        attachments: [blob]
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      url: file.getUrl() 
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ============================================
 * จัดการ Upload สลิปโอนเงิน
 * ============================================
 */
function handleSlipUpload(data) {
  try {
    var rootFolderId = data.folderId;
    if (!rootFolderId) throw new Error('Missing Folder ID for slip');

    var academicYear = data.academicYear || 'Unknown';
    var semester = data.semester || 'Unknown';
    var month = data.month || 'Unknown';
    var fileName = data.fileName || 'slip.jpg';
    var mimeType = data.mimeType || 'image/jpeg';
    var slipBase64 = data.slipBase64;

    if (!slipBase64) throw new Error('Missing slipBase64');

    var rootFolder = DriveApp.getFolderById(rootFolderId);

    // *ผมแก้ไขตรงนี้: ถ้า id โฟลเดอร์เป็นของสลิปอยู่แล้ว ไม่ต้องสร้างโฟลเดอร์ซ้อน
    var slipRootFolder = data.isSpecificSlipFolder 
        ? rootFolder 
        : getOrCreateFolder('สลิปโอนเงิน', rootFolder);
        
    var yearFolder = getOrCreateFolder('ปีการศึกษา ' + academicYear, slipRootFolder);
    var semesterFolder = getOrCreateFolder('เทอม ' + semester, yearFolder);
    var monthFolder = getOrCreateFolder(month, semesterFolder);

    // สร้างไฟล์สลิป
    var decodedBytes = Utilities.base64Decode(slipBase64);
    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
    var file = monthFolder.createFile(blob);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileId: file.getId(),
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error', 
      message: 'Slip Upload Error: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ============================================
 * ฟังก์ชันหลัก (Shared Functions)
 * ============================================
 */
function getOrCreateFolder(name, parent) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function checkStatus() {
  // สคริปต์เทสของคุณอันเดิม
  const folderId = '1j79_Ms1_fkYSLvhnOXQ8YqskyO29QOm5'; 
  try {
    const folder = DriveApp.getFolderById(folderId);
    Logger.log("✅ สำเร็จ! พบโฟลเดอร์ชื่อ: " + folder.getName());
  } catch (e) {
    Logger.log("❌ พลาด! สาเหตุ: " + e.toString());
  }
}
