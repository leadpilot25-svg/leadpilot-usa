# Google Sheets App Script for LeadPilot CRM

Copy and paste this code into your Google Sheets Script Editor (**Extensions > Apps Script**).

```javascript
/*
  LEADPILOT CRM - GOOGLE SHEETS CONNECTOR
  Version 2.0
*/

const SHEET_NAME = 'Leads';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  const headers = [
    'Timestamp', 'First Name', 'Last Name', 'Phone', 'WhatsApp', 
    'Email', 'Location', 'Requirement', 'Budget', 'Notes', 
    'Status', 'Follow-up', 'Priority', 'Source'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
       .setBackground('#f3f4f6')
       .setFontWeight('bold')
       .setFontFamily('Inter');
  
  sheet.setFrozenRows(1);
}

function doGet(e) {
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
      const key = camelize(header);
      let value = row[index];
      if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
      }
      lead[key] = value;
    });
    leads.push(lead);
  }
  
  return leads.reverse(); // Newest first for UI
}

function addLead(lead) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rowData = [
    new Date(),
    lead.firstName || '',
    lead.lastName || '',
    lead.phone || '',
    lead.whatsapp || '',
    lead.email || '',
    lead.location || '',
    lead.requirement || '',
    lead.budget || '',
    lead.notes || '',
    lead.status || 'New',
    lead.followUp || '',
    lead.priority || 'Medium',
    lead.source || 'Direct'
  ];
  sheet.appendRow(rowData);
}

function updateLead(rowIndex, leadData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Object.keys(leadData).forEach(key => {
    const colIndex = headers.findIndex(h => camelize(h) === key);
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

function camelize(str) {
  if (str === 'Timestamp') return 'timestamp';
  if (str === 'Follow-up') return 'followUp';
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}
```

## Deployment Instructions

1. Open your **Google Sheet**.
2. Go to **Extensions > Apps Script**.
3. Delete any existing code and paste the code above.
4. Click the **Save** icon (disk).
5. Run the `setup` function once (select it from the dropdown and click **Run**). You will need to grant permissions.
6. Click **Deploy > New Deployment**.
7. Select type: **Web App**.
8. Description: `LeadPilot API V2`.
9. Execute as: **Me**.
10. Who has access: **Anyone**.
11. Click **Deploy**.
12. **Copy the Web App URL**.
13. In AI Studio Build, go to **Settings > Environment Variables**.
14. Set `VITE_GAS_SCRIPT_URL` to the URL you copied.
15. Refresh your app!
