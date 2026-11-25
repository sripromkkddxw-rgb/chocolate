/**
 * Google Apps Script — วางใน Extensions > Apps Script ของ Google Sheet
 * ชีต "Orders" จะถูกสร้างอัตโนมัติ  Deploy > New deployment > Web app
 * Execute as: Me / Who has access: Anyone
 */
const SKUS = {                       // ต้องตรงกับ PRODUCTS ใน index.html
  "CHOC-DK70":  {name: "ดาร์ก 70% เชียงราย", price: 129},
  "CHOC-MLKHZ": {name: "มิลค์ เฮเซลนัท",     price: 119}
};
const SHIPPING = 40;
const SKU_LIST = Object.keys(SKUS);
const HEADERS = ["OrderID","เวลา","ชื่อ","โทร","ที่อยู่","จังหวัด","รหัสไปรษณีย์","หมายเหตุ"]
  .concat(SKU_LIST, ["ยอดรวม(บาท)","สถานะ"]);

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (headers) sh.appendRow(headers); }
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const sh = sheet_("Orders", HEADERS);
    const qty = {}; SKU_LIST.forEach(s => qty[s] = 0);
    let sum = 0;
    (d.items || []).forEach(i => {
      if (SKUS[i.sku]) { const q = Math.max(0, Math.min(20, +i.qty || 0)); qty[i.sku] = q; sum += q * SKUS[i.sku].price; }
    });
    if (sum === 0) return out_({ok:false});
    const id = "ORD" + Utilities.formatDate(new Date(), "Asia/Bangkok", "yyMMddHHmmss");
    const t = s => "'" + String(s || "").trim();   // กันเลข 0 นำหน้าหาย
    sh.appendRow([id, new Date(), String(d.name||"").trim(), t(d.phone), String(d.address||"").trim(),
      String(d.province||"").trim(), t(d.zip), String(d.note||"").trim()]
      .concat(SKU_LIST.map(s => qty[s]), [sum + SHIPPING, "ใหม่"]));
    return out_({ok:true, id});
  } finally { lock.release(); }
}
function out_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/** รันจากเมนู "Chocolate" > สร้างใบหยิบสินค้า (เฉพาะออเดอร์สถานะ "ใหม่" หรือ "ชำระแล้ว") */
function buildPickList() {
  const rows = sheet_("Orders", HEADERS).getDataRange().getValues();
  const h = rows[0], iStatus = h.indexOf("สถานะ");
  const totals = {}; SKU_LIST.forEach(s => totals[s] = 0);
  const lines = [["OrderID","ชื่อ"].concat(SKU_LIST.map(s => SKUS[s].name))];
  rows.slice(1).forEach(r => {
    if (!["ใหม่","ชำระแล้ว"].includes(r[iStatus])) return;
    lines.push([r[0], r[2]].concat(SKU_LIST.map(s => { const q = r[h.indexOf(s)]; totals[s] += q; return q; })));
  });
  lines.push(["รวมที่ต้องหยิบ",""].concat(SKU_LIST.map(s => totals[s])));
  const sh = sheet_("PickList"); sh.clear();
  sh.getRange(1,1,lines.length,lines[0].length).setValues(lines);
  sh.getRange(1,1,1,lines[0].length).setFontWeight("bold");
  sh.getRange(lines.length,1,1,lines[0].length).setFontWeight("bold").setBackground("#F6E4E6");
}

/** สร้างชีต "Labels" — 1 ออเดอร์ต่อ 1 ใบ พร้อมพิมพ์ (ใช้ File > Print) */
function buildLabels() {
  const rows = sheet_("Orders", HEADERS).getDataRange().getValues();
  const h = rows[0], iStatus = h.indexOf("สถานะ");
  const sh = sheet_("Labels"); sh.clear();
  let r = 1;
  rows.slice(1).forEach(x => {
    if (!["ใหม่","ชำระแล้ว"].includes(x[iStatus])) return;
    const items = SKU_LIST.filter(s => x[h.indexOf(s)] > 0).map(s => SKUS[s].name + " x" + x[h.indexOf(s)]).join(", ");
    const text = "ผู้ส่ง: Bean Bar (ใส่ที่อยู่ร้าน เบอร์โทร)\n──────────────\n" +
      "ผู้รับ: " + x[2] + "  โทร " + x[3] + "\n" + x[4] + " จ." + x[5] + " " + x[6] +
      "\n──────────────\nรายการ: " + items + "\nOrder: " + x[0] + (x[7] ? "\nหมายเหตุ: " + x[7] : "");
    const cell = sh.getRange(r, 1);
    cell.setValue(text).setWrap(true).setVerticalAlignment("top").setFontSize(12)
      .setBorder(true,true,true,true,false,false,"#000",SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sh.setRowHeight(r, 190); r += 2;
  });
  sh.setColumnWidth(1, 420);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Chocolate")
    .addItem("สร้างใบหยิบสินค้า", "buildPickList")
    .addItem("สร้างใบปะหน้าพัสดุ", "buildLabels").addToUi();
}
