
/**
 * ProStock Enterprise - Google Apps Script Backend API
 * Performance Optimized Version
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const SHEETS = {
  USERS: 'Users',
  INVENTORY: 'Inventory',
  SUPPLIERS: 'Suppliers',
  TRANSACTIONS_IN: 'Transactions_In',
  TRANSACTIONS_OUT: 'Transactions_Out',
  TRANSACTIONS_OPNAME: 'Transactions_Opname',
  LOGS: 'Logs'
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload || {};
    let response;

    switch (action) {
      case 'LOGIN': response = handleLogin(payload.username, payload.password); break;
      case 'GET_INVENTORY': response = getTableData(SHEETS.INVENTORY); break;
      case 'UPDATE_ITEM': response = upsertRow(SHEETS.INVENTORY, 'id', payload.item, payload.actor, 'ITEM'); break;
      case 'DELETE_ITEM': response = deleteRow(SHEETS.INVENTORY, 'id', payload.id, payload.actor, 'ITEM'); break;
      case 'GET_SUPPLIERS': response = getTableData(SHEETS.SUPPLIERS); break;
      case 'GET_USERS': response = getTableData(SHEETS.USERS); break;
      case 'SAVE_STOCK_IN': response = handleStockIn(payload); break;
      case 'SAVE_STOCK_OUT': response = handleStockOut(payload); break;
      case 'GET_DASHBOARD_STATS': response = getDashboardStats(); break;
      case 'GET_TRANSACTIONS': response = getAllTransactions(); break;
      case 'SEARCH_ITEMS': response = searchItems(payload.query); break;
      case 'GET_LOGS': response = getTableData(SHEETS.LOGS); break;
      default: throw new Error("Action " + action + " not implemented.");
    }
    return createJsonResponse({ success: true, data: response });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getTableData(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  // Bersihkan header dari spasi yang tidak diinginkan
  const headers = data[0].map(h => String(h).trim());
  
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { 
      if (h) obj[h] = row[i]; 
    });
    // Fallback untuk status jika kosong
    if (sheetName === SHEETS.INVENTORY && (!obj.status || obj.status === '')) {
      obj.status = 'ACTIVE';
    }
    return obj;
  });
}

function getAllTransactions() {
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN).map(t => ({ ...t, type: 'IN' }));
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT).map(t => ({ ...t, type: 'OUT' }));
  return [...txIn, ...txOut].sort((a, b) => new Date(b.Timestamp || 0) - new Date(a.Timestamp || 0));
}

function searchItems(query) {
  const items = getTableData(SHEETS.INVENTORY);
  const q = String(query || '').toLowerCase();
  return items.filter(item => {
    const name = String(item.name || '').toLowerCase();
    const id = String(item.id || '').toLowerCase();
    const status = String(item.status || 'ACTIVE').toUpperCase();
    
    return status === 'ACTIVE' && (name.includes(q) || id.includes(q));
  });
}

function handleLogin(username, password) {
  const users = getTableData(SHEETS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Kredensial salah.");
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

function upsertRow(sheetName, idKey, data, actor, label) {
  const sheet = SS.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const idIdx = headers.indexOf(idKey);
  
  if (idIdx === -1) throw new Error("ID Key '" + idKey + "' tidak ditemukan di sheet.");

  let rowIndex = -1;
  if (data[idKey]) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idIdx]) === String(data[idKey])) { rowIndex = i + 1; break; }
    }
  } else {
    data[idKey] = Utilities.getUuid().split('-')[0].toUpperCase();
  }

  const rowData = headers.map(h => data[h] !== undefined ? data[h] : '');
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  else sheet.appendRow(rowData);
  
  logActivity(actor, "UPDATE_" + label, "ID: " + data[idKey]);
  return data;
}

function getDashboardStats() {
  const inv = getTableData(SHEETS.INVENTORY);
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN);
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT);
  const today = new Date().toISOString().split('T')[0];
  
  const activeItems = inv.filter(i => String(i.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
  const lowStockList = activeItems.filter(i => Number(i.stock || 0) <= Number(i.minStock || 0));
  
  const outCounts = {};
  txOut.forEach(t => {
    const name = t.Nama || t.itemName || 'Unknown';
    outCounts[name] = (outCounts[name] || 0) + Number(t.QtyDefault || t.convertedQuantity || 0); 
  });

  const topItemsOut = Object.entries(outCounts)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return {
    totalItems: activeItems.length,
    totalStock: activeItems.reduce((a, b) => a + Number(b.stock || 0), 0),
    lowStockItems: lowStockList.length,
    transactionsInToday: txIn.filter(t => {
      const d = t.Tgl || t.date;
      const dateStr = d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0];
      return dateStr === today;
    }).length,
    transactionsOutToday: txOut.filter(t => {
      const d = t.Tgl || t.date;
      const dateStr = d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0];
      return dateStr === today;
    }).length,
    topItemsOut,
    lowStockList
  };
}

function logActivity(user, action, details) {
  try {
    const sheet = SS.getSheetByName(SHEETS.LOGS);
    if (sheet) sheet.appendRow([new Date(), user, action, String(details)]);
  } catch(e) {}
}
