const SHEET_NAME = 'Leads';

// The exact headers you provided
const HEADERS = [
  'Timestamp', 'First Name', 'Last Name', 'Phone', 'WhatsApp', 'Email', 
  'B/S', 'Prop Type', 'Budget', 'Source', 'Location', 'Remarks', 
  'Status', 'Follow-up', 'Call Done', 'Call Result', 'Prop Value', 
  'Commission', 'Exp Comm', 'Priority', 'Urgency', 'Quick Chat', 
  'Agent Email', 'Agent Name'
];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
       .setBackground('#f3f4f6')
       .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
}

function doGet(e) {
  // Safety check for manual runs in editor
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("Script is running. Please use the Web App URL in your CRM settings.")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  
  if (action === 'getLeads') {
    return createJsonResponse({
      success: true,
      leads: getLeads()
    });
  }
  
  return createJsonResponse({ success: false, message: 'Invalid action' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addLead') {
      addLead(data.lead);
      return createJsonResponse({ success: true });
    }
    
    if (action === 'updateLead') {
      updateLead(data.rowIndex, data.lead);
      return createJsonResponse({ success: true });
    }
    
    if (action === 'deleteLead') {
      deleteLead(data.rowIndex);
      return createJsonResponse({ success: true });
    }
    
    return createJsonResponse({ success: false, message: 'Invalid action' });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function getLeads() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const leads = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const lead = { rowIndex: i + 1 };
    headers.forEach((header, index) => {
      const key = mappingKey(header);
      let value = row[index];
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      }
      lead[key] = value;
    });
    leads.push(lead);
  }
  
  return leads.reverse(); 
}

function addLead(lead) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rowData = HEADERS.map(header => {
    if (header === 'Timestamp') return new Date();
    const key = mappingKey(header);
    return lead[key] || '';
  });
  sheet.appendRow(rowData);
}

function updateLead(rowIndex, leadData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Object.keys(leadData).forEach(key => {
    const colIndex = headers.findIndex(h => mappingKey(h) === key);
    if (colIndex !== -1) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(leadData[key]);
    }
  });
}

function deleteLead(rowIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.deleteRow(rowIndex);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Maps spreadsheet headers to stable Javascript keys
function mappingKey(header) {
  const map = {
    'Timestamp': 'timestamp',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Phone': 'phone',
    'WhatsApp': 'whatsapp',
    'Email': 'email',
    'B/S': 'bs',
    'Prop Type': 'propType',
    'Budget': 'budget',
    'Source': 'source',
    'Location': 'location',
    'Remarks': 'remarks',
    'Status': 'status',
    'Follow-up': 'followUp',
    'Call Done': 'callDone',
    'Call Result': 'callResult',
    'Prop Value': 'propValue',
    'Commission': 'commission',
    'Exp Comm': 'expComm',
    'Priority': 'priority',
    'Urgency': 'urgency',
    'Quick Chat': 'quickChat',
    'Agent Email': 'agentEmail',
    'Agent Name': 'agentName'
  };
  return map[header] || header.toLowerCase().replace(/\s+/g, '');
}
