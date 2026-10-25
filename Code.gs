/**
 * Honey app sync server (Google Apps Script, free).
 * Paste this into Extensions > Apps Script of a Google Sheet, change TOKEN, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 *
 * Every record (batch, sale, customer, payment) is one row in the sheet "data".
 * The newest version of each record wins; deletes are kept as rows with deleted=1.
 */
const TOKEN = 'CHANGE_ME_TO_A_LONG_SECRET_WORD';
const SHEET = 'data';

/* ---- pure merge logic (no Google services, so it can be tested anywhere) ---- */
function merge_(rows, req, now) {
  const idx = {};
  rows.forEach(function (r, i) { idx[r.id] = i; });
  (req.changes || []).forEach(function (c) {
    if (!c || !c.id) return;
    const rec = {
      id: String(c.id), type: String(c.type), u: Number(c.u) || 0,
      deleted: c.deleted ? 1 : 0, stamp: now,
      data: c.deleted ? '' : JSON.stringify(c.data)
    };
    const i = idx[rec.id];
    if (i === undefined) { rows.push(rec); idx[rec.id] = rows.length - 1; }
    else if (rec.u >= rows[i].u) { rows[i] = rec; }
  });
  const since = Number(req.since) || 0;
  const out = rows.filter(function (r) { return r.stamp >= since; }).map(function (r) {
    return { id: r.id, type: r.type, u: r.u, deleted: r.deleted, data: r.deleted ? null : JSON.parse(r.data) };
  });
  return { rows: rows, out: out, stamp: now };
}

/* ---- Google Sheet storage ---- */
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.getRange('A:B').setNumberFormat('@');   // keep ids as text
    sh.getRange('F:F').setNumberFormat('@');
    sh.getRange(1, 1, 1, 6).setValues([['id', 'type', 'u', 'deleted', 'stamp', 'data']]);
    sh.setFrozenRows(1);
  }
  return sh;
}
function readRows_(sh) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, 6).getValues().map(function (r) {
    return { id: String(r[0]), type: String(r[1]), u: Number(r[2]) || 0, deleted: Number(r[3]) ? 1 : 0, stamp: Number(r[4]) || 0, data: String(r[5] || '') };
  });
}
function writeRows_(sh, rows) {
  if (!rows.length) return;
  const vals = rows.map(function (r) { return [r.id, r.type, r.u, r.deleted, r.stamp, r.data]; });
  sh.getRange(2, 1, vals.length, 6).setValues(vals);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('Honey sync server is running.');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const req = JSON.parse(e.postData.contents);
    if (TOKEN === 'CHANGE_ME_TO_A_LONG_SECRET_WORD' || req.token !== TOKEN) return json_({ error: 'auth' });
    const sh = sheet_();
    const res = merge_(readRows_(sh), req, Date.now());
    if (req.changes && req.changes.length) writeRows_(sh, res.rows);
    return json_({ stamp: res.stamp, rows: res.out });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
