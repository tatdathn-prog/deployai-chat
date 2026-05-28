// DeployAI CRM v2 — Smart session-based CRM
// Cập nhật code Apps Script: Extensions → Apps Script → thay thế toàn bộ → Deploy

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Ngày', 'Giờ', 'Tên KH', 'SĐT', 'Email', 'Nguồn', 'Hội Thoại', 'Trạng Thái', 'Session ID']);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#2563EB').setFontColor('white');
    sheet.setFrozenRows(1);
  }
  
  var data = JSON.parse(e.postData.contents);
  var now = new Date();
  var timeStr = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'HH:mm');
  var dateStr = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy');
  var sid = data.sessionId || '';
  
  // Tìm row hiện có theo Session ID (cột 9)
  var existingRow = 0;
  if (sid) {
    var allData = sheet.getDataRange().getValues();
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][8] === sid) { existingRow = i + 1; break; }
    }
  }
  
  if (existingRow > 0) {
    // UPDATE existing row: merge conversation + update phone/name if new
    var oldConv = sheet.getRange(existingRow, 7).getValue() || '';
    var newConv = data.message || '';
    var merged = oldConv ? oldConv + ' | ' + newConv : newConv;
    merged = merged.slice(0, 5000); // Giới hạn 5000 ký tự
    
    sheet.getRange(existingRow, 2).setValue(timeStr); // Update time
    if (data.name && data.name !== 'Khách web') sheet.getRange(existingRow, 3).setValue(data.name);
    if (data.phone) sheet.getRange(existingRow, 4).setValue(data.phone);
    if (data.email) sheet.getRange(existingRow, 5).setValue(data.email);
    sheet.getRange(existingRow, 7).setValue(merged); // Full conversation
    sheet.getRange(existingRow, 8).setValue(data.phone ? 'Có SĐT' : 'Đang chat');
  } else {
    // INSERT new row
    sheet.appendRow([
      dateStr, timeStr,
      data.name || 'Khách web',
      data.phone || '',
      data.email || '',
      data.source || 'Website Chat',
      data.message || '',
      data.phone ? 'Có SĐT' : 'Mới',
      sid
    ]);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return ContentService.createTextOutput('CRM v2 OK'); }
