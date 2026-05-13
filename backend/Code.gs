/**
 * LeadPilot CRM Backend - Simplified
 * 
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. Rename the first sheet to "Leads".
 * 3. Add these headers in row 1:
 *    Timestamp | First Name | Last Name | Phone | Email | Location | Remarks | Status | Follow-up | Priority | Source | Prop Type
 * 4. Open Extensions > Apps Script.
 * 5. Paste this code.
 * 6. Deploy > New Deployment > Web App.
 * 7. Set "Execute as: Me" and "Who has access: Anyone".
 * 8. Copy the Web App URL and set it as VITE_GAS_SCRIPT_URL in your environment.
 */

const SHEET_NAME = 'Leads';

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getLeads') return getLeads();
  if (action === 'getDashboard') return getDashboard();
  
  return jsonResponse({ success: false, message: 'Invalid action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addLead') return addLead(data.lead);
    if (action === 'updateLead') return updateLead(data.rowIndex, data.lead);
    if (action === 'deleteLead') return deleteLead(data.rowIndex);
    
    return jsonResponse({ success: false, message: 'Invalid action' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function getLeads() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return jsonResponse({ success: true, leads: [] });
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const leads = rows.map((row, index) => {
    const lead = { rowIndex: index + 2 };
    headers.forEach((header, i) => {
      const key = toCamelCase(header);
      lead[key] = row[i];
    });
    return lead;
  });
  
  return jsonResponse({ success: true, leads: leads.reverse() });
}

function getDashboard() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() <= 1) return jsonResponse({ success: true, stats: { total: 0, today: 0, upcoming: 0, overdue: 0, hot: 0, byStatus: {} } });
  
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const stats = {
    total: rows.length,
    today: 0,
    upcoming: 0,
    overdue: 0,
    hot: 0,
    byStatus: {}
  };
  
  const headers = data[0];
  const followupIdx = headers.indexOf('Follow-up');
  const statusIdx = headers.indexOf('Status');
  const priorityIdx = headers.indexOf('Priority');
  
  rows.forEach(row => {
    const followupStr = row[followupIdx];
    const status = row[statusIdx];
    const priority = row[priorityIdx];
    
    if (priority === 'Hot') stats.hot++;
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    if (followupStr && status !== 'Closed') {
      const fDate = new Date(followupStr);
      fDate.setHours(0,0,0,0);
      
      if (fDate.getTime() === now.getTime()) {
        stats.today++;
      } else if (fDate.getTime() < now.getTime()) {
        stats.overdue++;
      } else {
        stats.upcoming++;
      }
    }
  });
  
  return jsonResponse({ success: true, stats });
}

function addLead(leadData) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'First Name', 'Last Name', 'Phone', 'WhatsApp', 'Email', 'Location', 'Requirement', 'Budget', 'Notes', 'Status', 'Follow-up', 'Priority', 'Source']);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const phoneIdx = headers.indexOf('Phone');
  
  // Check duplicate
  if (phoneIdx !== -1 && leadData.phone) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingPhones = sheet.getRange(2, phoneIdx + 1, lastRow - 1, 1).getValues().flat().map(String);
      if (existingPhones.includes(String(leadData.phone))) {
        return jsonResponse({ success: false, error: 'A lead with this phone number already exists.' });
      }
    }
  }
  
  const newRow = headers.map(header => {
    if (header === 'Timestamp') return new Date();
    const key = toCamelCase(header);
    return leadData[key] || '';
  });
  
  sheet.appendRow(newRow);
  return jsonResponse({ success: true });
}

function updateLead(rowIndex, leadData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  headers.forEach((header, i) => {
    const key = toCamelCase(header);
    if (leadData.hasOwnProperty(key)) {
      sheet.getRange(rowIndex, i + 1).setValue(leadData[key]);
    }
  });
  
  return jsonResponse({ success: true });
}

function deleteLead(rowIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.deleteRow(rowIndex);
  return jsonResponse({ success: true });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function toCamelCase(str) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
            .replace(/^[A-Z]/, c => c.toLowerCase());
}
