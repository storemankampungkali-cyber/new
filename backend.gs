
/**
 * ProStock Enterprise - Google Apps Script Backend API
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

function setupDatabase() {
  const structure = {
    [SHEETS.USERS]: ['id', 'username', 'name', 'role', 'password'],
    [SHEETS.INVENTORY]: [
      'id', 'sku', 'name', 'category', 'stock', 'minStock', 'price', 
      'defaultUnit', 'altUnit1', 'conv1', 'altUnit2', 'conv2', 'altUnit3', 'conv3', 
      'initialStock', 'status'
    ],
    [SHEETS.SUPPLIERS]: ['id', 'name', 'contactPerson', 'phone', 'email', 'address'],
    [SHEETS.TRANSACTIONS_IN]: ['id', 'date', 'supplier', 'poNumber', 'deliveryNote', 'items', 'photos', 'timestamp', 'user'],
    [SHEETS.TRANSACTIONS_OUT]: ['id', 'date', 'customer', 'items', 'timestamp', 'user'],
    [SHEETS.TRANSACTIONS_OPNAME]: ['id', 'date', 'items', 'timestamp', 'user'],
    [SHEETS.LOGS]: ['timestamp', 'user', 'action', 'details']
  };

  Object.keys(structure).forEach(name => {
    let sheet = SS.getSheetByName(name);
    if (!sheet) {
      sheet = SS.insertSheet(name);
    }
    sheet.clear();
    sheet.getRange(1, 1, 1, structure[name].length).setValues([structure[name]]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  const userSheet = SS.getSheetByName(SHEETS.USERS);
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow(['1', 'admin', 'Root Admin', 'ADMIN', 'admin123']);
  }
  
  return "Database Setup Updated with Multi-Unit Support!";
}

function doPost(e) {
  let response;
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload || {};

    switch (action) {
      case 'LOGIN': response = handleLogin(payload.username, payload.password); break;
      case 'GET_INVENTORY': response = getTableData(SHEETS.INVENTORY); break;
      case 'UPDATE_ITEM': response = upsertRow(SHEETS.INVENTORY, 'id', payload.item, payload.actor, 'ITEM'); break;
      case 'DELETE_ITEM': response = deleteRow(SHEETS.INVENTORY, 'id', payload.id, payload.actor, 'ITEM'); break;
      case 'GET_SUPPLIERS': response = getTableData(SHEETS.SUPPLIERS); break;
      case 'UPDATE_SUPPLIER': response = upsertRow(SHEETS.SUPPLIERS, 'id', payload.supplier, payload.actor, 'SUPPLIER'); break;
      case 'DELETE_SUPPLIER': response = deleteRow(SHEETS.SUPPLIERS, 'id', payload.id, payload.actor, 'SUPPLIER'); break;
      case 'GET_USERS': response = getTableData(SHEETS.USERS); break;
      case 'UPDATE_USER': response = upsertRow(SHEETS.USERS, 'id', payload.user, payload.actor, 'USER'); break;
      case 'DELETE_USER': response = deleteRow(SHEETS.USERS, 'id', payload.id, payload.actor, 'USER'); break;
      case 'SAVE_STOCK_IN': response = handleStockIn(payload); break;
      case 'SAVE_STOCK_OUT': response = handleStockOut(payload); break;
      case 'SAVE_OPNAME': response = handleOpname(payload); break;
      case 'GET_DASHBOARD_STATS': response = getDashboardStats(); break;
      case 'GET_LOGS': response = getTableData(SHEETS.LOGS); break;
      case 'SEARCH_ITEMS': response = searchItems(payload.query); break;
      default: throw new Error("Action not found: " + action);
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
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[h] = val;
    });
    return obj;
  });
}

function searchItems(query) {
  const items = getTableData(SHEETS.INVENTORY);
  const q = query.toLowerCase();
  return items.filter(item => 
    item.status === 'ACTIVE' && (
      item.name.toLowerCase().includes(q) || 
      item.sku.toLowerCase().includes(q)
    )
  );
}

function handleLogin(username, password) {
  const users = getTableData(SHEETS.USERS);
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error("Invalid credentials.");
  logActivity(username, 'LOGIN', 'Success');
  return { id: user.id, username: user.username, name: user.name, role: user.role };
}

function upsertRow(sheetName, idKey, data, actor, label) {
  const sheet = SS.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIdx = headers.indexOf(idKey);
  
  const rowData = headers.map(h => {
    let val = data[h];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val !== undefined ? val : '';
  });
  
  let rowIndex = -1;
  if (data[idKey]) {
    for (let i = 1; i < values.length; i++) {
      if (values[i][idIdx] == data[idKey]) {
        rowIndex = i + 1;
        break;
      }
    }
  } else {
    data[idKey] = Utilities.getUuid().split('-')[0].toUpperCase();
    rowData[idIdx] = data[idKey];
  }

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  logActivity(actor, 'UPSERT_' + label, data[idKey]);
  return data;
}

function deleteRow(sheetName, idKey, id, actor, label) {
  const sheet = SS.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIdx = headers.indexOf(idKey);
  for (let i = 1; i < values.length; i++) {
    if (values[i][idIdx] == id) {
      sheet.deleteRow(i + 1);
      logActivity(actor, 'DELETE_' + label, id);
      return true;
    }
  }
  throw new Error("ID not found");
}

function handleStockIn(tx) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
    const invData = invSheet.getDataRange().getValues();
    const headers = invData[0];
    const idIdx = headers.indexOf('id');
    const stockIdx = headers.indexOf('stock');
    tx.items.forEach(it => {
      for (let i = 1; i < invData.length; i++) {
        if (invData[i][idIdx] == it.itemId) {
          const newStock = Number(invData[i][stockIdx]) + Number(it.convertedQuantity);
          invSheet.getRange(i + 1, stockIdx + 1).setValue(newStock);
          break;
        }
      }
    });
    const txSheet = SS.getSheetByName(SHEETS.TRANSACTIONS_IN);
    txSheet.appendRow(['TXI-' + Date.now(), tx.date, tx.supplier, tx.poNumber, tx.deliveryNote, JSON.stringify(tx.items), JSON.stringify(tx.photos || []), new Date(), tx.user]);
    logActivity(tx.user, 'STOCK_IN', tx.poNumber);
    return true;
  } finally { lock.releaseLock(); }
}

function handleStockOut(tx) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
    const invData = invSheet.getDataRange().getValues();
    const headers = invData[0];
    const idIdx = headers.indexOf('id');
    const stockIdx = headers.indexOf('stock');
    tx.items.forEach(it => {
      for (let i = 1; i < invData.length; i++) {
        if (invData[i][idIdx] == it.itemId) {
          const current = Number(invData[i][stockIdx]);
          if (current < it.convertedQuantity) throw new Error("Stock insufficient for " + it.itemName);
          invSheet.getRange(i + 1, stockIdx + 1).setValue(current - Number(it.convertedQuantity));
          break;
        }
      }
    });
    const txSheet = SS.getSheetByName(SHEETS.TRANSACTIONS_OUT);
    txSheet.appendRow(['TXO-' + Date.now(), tx.date, tx.customer, JSON.stringify(tx.items), new Date(), tx.user]);
    logActivity(tx.user, 'STOCK_OUT', tx.customer);
    return true;
  } finally { lock.releaseLock(); }
}

function handleOpname(op) {
  const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
  const invData = invSheet.getDataRange().getValues();
  const idIdx = invData[0].indexOf('id');
  const stockIdx = invData[0].indexOf('stock');
  op.items.forEach(it => {
    for (let i = 1; i < invData.length; i++) {
      if (invData[i][idIdx] == it.itemId) {
        invSheet.getRange(i + 1, stockIdx + 1).setValue(Number(it.physicalStock));
        break;
      }
    }
  });
  const txSheet = SS.getSheetByName(SHEETS.TRANSACTIONS_OPNAME);
  txSheet.appendRow(['SOP-' + Date.now(), op.date, JSON.stringify(op.items), new Date(), op.user]);
  logActivity(op.user, 'OPNAME', op.date);
  return true;
}

function getDashboardStats() {
  const inv = getTableData(SHEETS.INVENTORY);
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN);
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT);
  const today = new Date().toISOString().split('T')[0];
  const lowStockList = inv.filter(i => i.status === 'ACTIVE' && i.stock <= i.minStock);
  const outCounts = {};
  txOut.forEach(t => {
    const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
    items.forEach(it => { outCounts[it.itemName] = (outCounts[it.itemName] || 0) + Number(it.convertedQuantity); });
  });
  const topItemsOut = Object.entries(outCounts).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 3);
  return {
    totalItems: inv.filter(i => i.status === 'ACTIVE').length,
    totalStock: inv.reduce((a, b) => a + Number(b.stock), 0),
    lowStockItems: lowStockList.length,
    transactionsInToday: txIn.filter(t => t.date == today).length,
    transactionsOutToday: txOut.filter(t => t.date == today).length,
    topItemsOut,
    lowStockList
  };
}

function logActivity(user, action, details) {
  const sheet = SS.getSheetByName(SHEETS.LOGS);
  sheet.appendRow([new Date(), user, action, String(details)]);
}
