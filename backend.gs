
/**
 * ProStock Enterprise - Google Apps Script Backend API
 * Full Version with CRUD & Stock Logic
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
      case 'UPDATE_SUPPLIER': response = upsertRow(SHEETS.SUPPLIERS, 'id', payload.supplier, 'Admin', 'SUPPLIER'); break;
      case 'DELETE_SUPPLIER': response = deleteRow(SHEETS.SUPPLIERS, 'id', payload.id, 'Admin', 'SUPPLIER'); break;
      case 'GET_USERS': response = getTableData(SHEETS.USERS); break;
      case 'UPDATE_USER': response = upsertRow(SHEETS.USERS, 'id', payload.user, payload.actor, 'USER'); break;
      case 'DELETE_USER': response = deleteRow(SHEETS.USERS, 'id', payload.id, payload.actor, 'USER'); break;
      case 'SAVE_STOCK_IN': response = handleStockIn(payload); break;
      case 'SAVE_STOCK_OUT': response = handleStockOut(payload); break;
      case 'SAVE_OPNAME': response = handleStockOpname(payload); break;
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
  
  const headers = data[0].map(h => String(h).trim());
  
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { 
      if (h) obj[h] = row[i]; 
    });
    return obj;
  });
}

function upsertRow(sheetName, idKey, data, actor, label) {
  const sheet = SS.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const idIdx = headers.indexOf(idKey);
  
  if (idIdx === -1) throw new Error("ID Key '" + idKey + "' tidak ditemukan di sheet " + sheetName);

  let rowIndex = -1;
  if (data[idKey]) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idIdx]) === String(data[idKey])) { rowIndex = i + 1; break; }
    }
  } else {
    data[idKey] = Utilities.getUuid().split('-')[0].toUpperCase();
  }

  const rowData = headers.map(h => data[h] !== undefined ? data[h] : '');
  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  logActivity(actor || 'System', "UPSERT_" + label, "ID: " + data[idKey]);
  return data;
}

function deleteRow(sheetName, idKey, idValue, actor, label) {
  const sheet = SS.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const idIdx = headers.indexOf(idKey);
  
  if (idIdx === -1) throw new Error("ID Key '" + idKey + "' tidak ditemukan.");

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      logActivity(actor || 'System', "DELETE_" + label, "ID: " + idValue);
      return true;
    }
  }
  throw new Error("Data dengan ID " + idValue + " tidak ditemukan.");
}

function handleStockIn(payload) {
  const sheet = SS.getSheetByName(SHEETS.TRANSACTIONS_IN);
  const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
  const timestamp = new Date();

  payload.items.forEach(item => {
    // 1. Simpan ke Log Transaksi Masuk
    sheet.appendRow([
      timestamp, 
      payload.date, 
      payload.supplier, 
      payload.noForm, 
      payload.poNumber, 
      payload.deliveryNote,
      item.itemId, 
      item.itemName, 
      item.quantity, 
      item.unit, 
      item.convertedQuantity, 
      item.remarks,
      payload.user
    ]);

    // 2. Update Stok di Inventory
    updateInventoryStock(item.itemId, item.convertedQuantity, 'ADD');
  });

  logActivity(payload.user, "STOCK_IN", "Form: " + payload.noForm);
  return true;
}

function handleStockOut(payload) {
  const sheet = SS.getSheetByName(SHEETS.TRANSACTIONS_OUT);
  const timestamp = new Date();

  payload.items.forEach(item => {
    sheet.appendRow([
      timestamp, 
      payload.date, 
      payload.customer, 
      item.itemId, 
      item.itemName, 
      item.quantity, 
      item.unit, 
      item.convertedQuantity, 
      item.remarks,
      payload.user
    ]);

    updateInventoryStock(item.itemId, item.convertedQuantity, 'SUBTRACT');
  });

  logActivity(payload.user, "STOCK_OUT", "Note: " + payload.customer);
  return true;
}

function updateInventoryStock(itemId, qty, operation) {
  const sheet = SS.getSheetByName(SHEETS.INVENTORY);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('id');
  const stockIdx = headers.indexOf('stock');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(itemId)) {
      let currentStock = Number(values[i][stockIdx] || 0);
      let newStock = operation === 'ADD' ? currentStock + Number(qty) : currentStock - Number(qty);
      sheet.getRange(i + 1, stockIdx + 1).setValue(newStock);
      return;
    }
  }
}

function handleStockOpname(payload) {
  const sheet = SS.getSheetByName(SHEETS.TRANSACTIONS_OPNAME);
  const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
  const timestamp = new Date();

  payload.items.forEach(item => {
    sheet.appendRow([
      timestamp, 
      payload.date, 
      item.itemId, 
      item.itemName, 
      item.systemStock, 
      item.physicalStock, 
      item.difference, 
      item.remarks,
      payload.user
    ]);

    // Hard reset stock ke nilai fisik
    setInventoryStock(item.itemId, item.physicalStock);
  });
  return true;
}

function setInventoryStock(itemId, exactQty) {
  const sheet = SS.getSheetByName(SHEETS.INVENTORY);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('id');
  const stockIdx = headers.indexOf('stock');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(itemId)) {
      sheet.getRange(i + 1, stockIdx + 1).setValue(exactQty);
      return;
    }
  }
}

function handleLogin(username, password) {
  const users = getTableData(SHEETS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Username atau Password salah.");
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

function getAllTransactions() {
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN).map(t => ({ 
    ...t, 
    type: 'IN', 
    Timestamp: t.Timestamp || t.timestamp,
    Kode: t.itemId || t.item_id,
    Nama: t.itemName || t.item_name,
    QtyDefault: t.convertedQuantity || t.converted_qty
  }));
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT).map(t => ({ 
    ...t, 
    type: 'OUT', 
    Timestamp: t.Timestamp || t.timestamp,
    Kode: t.itemId || t.item_id,
    Nama: t.itemName || t.item_name,
    QtyDefault: t.convertedQuantity || t.converted_qty
  }));
  return [...txIn, ...txOut].sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
}

function searchItems(query) {
  const items = getTableData(SHEETS.INVENTORY);
  const q = String(query || '').toLowerCase();
  return items.filter(item => {
    const name = String(item.name || '').toLowerCase();
    const id = String(item.id || '').toLowerCase();
    return (name.includes(q) || id.includes(q)) && String(item.status).toUpperCase() === 'ACTIVE';
  });
}

function getDashboardStats() {
  const inv = getTableData(SHEETS.INVENTORY);
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN);
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT);
  const today = new Date().toISOString().split('T')[0];
  
  const activeItems = inv.filter(i => String(i.status).toUpperCase() === 'ACTIVE');
  const lowStockList = activeItems.filter(i => Number(i.stock || 0) <= Number(i.minStock || 0));
  
  const outCounts = {};
  txOut.forEach(t => {
    const name = t.itemName || t.Nama || 'Unknown';
    const qty = Number(t.convertedQuantity || t.QtyDefault || 0);
    outCounts[name] = (outCounts[name] || 0) + qty;
  });

  const topItemsOut = Object.entries(outCounts)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return {
    totalItems: activeItems.length,
    totalStock: activeItems.reduce((a, b) => a + Number(b.stock || 0), 0),
    lowStockItems: lowStockList.length,
    transactionsInToday: txIn.filter(t => String(t.date || t.Tgl).includes(today)).length,
    transactionsOutToday: txOut.filter(t => String(t.date || t.Tgl).includes(today)).length,
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
