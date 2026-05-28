// DeployAI CRM — Google Apps Script Webhook
// 1. Tạo Google Sheet mới: sheets.google.com → Blank
// 2. Extensions → Apps Script → Dán code này → Save
// 3. Deploy → New Deployment → Web App
//    - Execute as: "Me"
//    - Who has access: "Anyone"
//    - Deploy → Copy URL → set CRM_WEBHOOK trên Render

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Leads');
  
  // Tạo sheet nếu chưa có
  if (!sheet) {
    sheet = ss.insertSheet('Leads');
    sheet.appendRow([
      'Ngày', 'Giờ', 'Tên KH', 'SĐT', 'Email', 
      'Nguồn', 'Nhu Cầu', 'Trạng Thái', 'Ghi Chú', 'Người Phụ Trách'
    ]);
    // Format header
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#2563EB').setFontColor('white');
    sheet.setFrozenRows(1);
    // Auto-resize columns
    sheet.autoResizeColumns(1, 10);
  }
  
  const data = JSON.parse(e.postData.contents);
  const now = new Date();
  const timeStr = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm');
  const dateStr = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  
  sheet.appendRow([
    dateStr,
    timeStr,
    data.name || 'Khách web',
    data.phone || '',
    data.email || '',
    data.source || 'Website Chat',
    data.message || '',
    'Mới',
    '',
    ''
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  // Web dashboard — xem leads gần đây
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Leads');
  if (!sheet) return ContentService.createTextOutput('Chưa có leads');
  
  const data = sheet.getDataRange().getValues();
  const recent = data.slice(-20); // 20 leads gần nhất
  
  return ContentService.createTextOutput(JSON.stringify({
    total: data.length - 1,
    recent: recent
  })).setMimeType(ContentService.MimeType.JSON);
}
