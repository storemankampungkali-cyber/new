
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

function setupDatabase() {
  const structure = {
    [SHEETS.USERS]: ['id', 'username', 'name', 'role', 'password'],
    [SHEETS.INVENTORY]: [
      'id', 'name', 'category', 'stock', 'minStock', 
      'defaultUnit', 'altUnit1', 'conv1', 'altUnit2', 'conv2', 'altUnit3', 'conv3', 
      'initialStock', 'status'
    ],
    [SHEETS.SUPPLIERS]: ['id', 'name', 'contactPerson', 'phone', 'email', 'address'],
    [SHEETS.TRANSACTIONS_IN]: [
      'Timestamp', 'Tgl', 'NoSJ', 'Supplier', 'NoForm', 'NoPO', 
      'Kode', 'Nama', 'QtyInput', 'SatuanInput', 'QtyDefault', 'SatuanDefault', 
      'Keterangan', 'FotoUrl', 'User'
    ],
    [SHEETS.TRANSACTIONS_OUT]: [
      'Timestamp', 'Tgl', 'KeteranganGlobal', 'Kode', 'Nama', 
      'QtyInput', 'SatuanInput', 'QtyDefault', 'SatuanDefault', 
      'StokSebelum', 'StokSesudah', 'User'
    ],
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
  
  return "Database Optimized & Setup Complete!";
}

function getItemConversionFactor(item, unitName) {
  if (!unitName || unitName === item.defaultUnit) return 1;
  if (unitName === item.altUnit1) return Number(item.conv1) || 1;
  if (unitName === item.altUnit2) return Number(item.conv2) || 1;
  if (unitName === item.altUnit3) return Number(item.conv3) || 1;
  return 1;
}

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
      case 'GET_TRANSACTIONS': response = getAllTransactions(); break; // Baru: Untuk Ekspor
      case 'SEARCH_ITEMS': response = searchItems(payload.query); break;
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
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

/**
 * Fungsi baru untuk mengambil semua transaksi (Masuk & Keluar) secara flat
 */
function getAllTransactions() {
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN).map(t => ({ ...t, type: 'IN' }));
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT).map(t => ({ ...t, type: 'OUT' }));
  return [...txIn, ...txOut].sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
}

function searchItems(query) {
  const items = getTableData(SHEETS.INVENTORY);
  const q = query.toLowerCase();
  return items.filter(item => 
    item.status === 'ACTIVE' && 
    (item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
  );
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
  const headers = values[0];
  const idIdx = headers.indexOf(idKey);
  const rowData = headers.map(h => data[h] !== undefined ? data[h] : '');
  
  let rowIndex = -1;
  if (data[idKey]) {
    for (let i = 1; i < values.length; i++) {
      if (values[i][idIdx] == data[idKey]) { rowIndex = i + 1; break; }
    }
  } else {
    data[idKey] = Utilities.getUuid().split('-')[0].toUpperCase();
    rowData[idIdx] = data[idKey];
  }

  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  else sheet.appendRow(rowData);
  return data;
}

function handleStockIn(tx) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
    const txSheet = SS.getSheetByName(SHEETS.TRANSACTIONS_IN);
    const itemsMaster = getTableData(SHEETS.INVENTORY);
    const invHeader = invSheet.getDataRange().getValues()[0];
    const idIdx = invHeader.indexOf('id');
    const stockIdx = invHeader.indexOf('stock');
    const timestamp = new Date();

    tx.items.forEach(it => {
      const master = itemsMaster.find(m => m.id == it.itemId);
      const factor = getItemConversionFactor(master, it.unit);
      const deltaBase = Number(it.quantity) * factor;

      // Update Stock
      const invValues = invSheet.getDataRange().getValues();
      for (let i = 1; i < invValues.length; i++) {
        if (invValues[i][idIdx] == it.itemId) {
          invSheet.getRange(i + 1, stockIdx + 1).setValue(Number(invValues[i][stockIdx]) + deltaBase);
          break;
        }
      }

      txSheet.appendRow([
        timestamp, tx.date, tx.deliveryNote || '', tx.supplier || '', tx.noForm || '', tx.poNumber || '',
        it.itemId, it.itemName, it.quantity, it.unit, deltaBase, master.defaultUnit, it.remarks || '', '', tx.user
      ]);
    });
    return true;
  } finally { lock.releaseLock(); }
}

function handleStockOut(tx) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const invSheet = SS.getSheetByName(SHEETS.INVENTORY);
    const txSheet = SS.getSheetByName(SHEETS.TRANSACTIONS_OUT);
    const itemsMaster = getTableData(SHEETS.INVENTORY);
    const invHeader = invSheet.getDataRange().getValues()[0];
    const idIdx = invHeader.indexOf('id');
    const stockIdx = invHeader.indexOf('stock');
    const timestamp = new Date();

    tx.items.forEach(it => {
      const master = itemsMaster.find(m => m.id == it.itemId);
      const factor = getItemConversionFactor(master, it.unit);
      const deltaBase = Number(it.quantity) * factor;

      let stokSebelum = 0;
      let stokSesudah = 0;

      const invValues = invSheet.getDataRange().getValues();
      for (let i = 1; i < invValues.length; i++) {
        if (invValues[i][idIdx] == it.itemId) {
          stokSebelum = Number(invValues[i][stockIdx]);
          stokSesudah = stokSebelum - deltaBase;
          invSheet.getRange(i + 1, stockIdx + 1).setValue(stokSesudah);
          break;
        }
      }

      txSheet.appendRow([
        timestamp, tx.date, tx.customer || '', it.itemId, it.itemName, it.quantity, it.unit, 
        deltaBase, master.defaultUnit, stokSebelum, stokSesudah, tx.user
      ]);
    });
    return true;
  } finally { lock.releaseLock(); }
}

function getDashboardStats() {
  const inv = getTableData(SHEETS.INVENTORY);
  const txIn = getTableData(SHEETS.TRANSACTIONS_IN);
  const txOut = getTableData(SHEETS.TRANSACTIONS_OUT);
  const today = new Date().toISOString().split('T')[0];
  const lowStockList = inv.filter(i => i.status === 'ACTIVE' && Number(i.stock) <= Number(i.minStock));
  
  const outCounts = {};
  txOut.forEach(t => {
    outCounts[t.Nama] = (outCounts[t.Nama] || 0) + Number(t.QtyDefault); 
  });

  const topItemsOut = Object.entries(outCounts)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  return {
    totalItems: inv.filter(i => i.status === 'ACTIVE').length,
    totalStock: inv.reduce((a, b) => a + Number(b.stock), 0),
    lowStockItems: lowStockList.length,
    transactionsInToday: txIn.filter(t => (t.Tgl instanceof Date ? t.Tgl.toISOString().split('T')[0] : t.Tgl) == today).length,
    transactionsOutToday: txOut.filter(t => (t.Tgl instanceof Date ? t.Tgl.toISOString().split('T')[0] : t.Tgl) == today).length,
    topItemsOut,
    lowStockList
  };
}

function logActivity(user, action, details) {
  const sheet = SS.getSheetByName(SHEETS.LOGS);
  sheet.appendRow([new Date(), user, action, String(details)]);
}
