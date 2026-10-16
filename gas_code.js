// データ保存処理（POST）
function doPost(e) {
  try {
    saveAnswer(JSON.parse(e.postData.contents));

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 保存する列: ID, 学年, 性別, イベントの感想, 良かった点, その他のメッセージ, 今後参加したいイベント, 送信日時
function saveAnswer(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 同時送信でIDが重複しないようにロックする
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    // ID列（2行目以降）が日付形式のままだと番号が日付に変換されるため、数値形式にそろえる
    sheet.getRange("A2:A").setNumberFormat("0");

    // 最終行のID + 1（見出し行のみ・データなしの場合は 1 から開始）
    var lastRow = sheet.getLastRow();
    var lastId = lastRow > 0 ? sheet.getRange(lastRow, 1).getValue() : 0;
    var id = typeof lastId === "number" ? lastId + 1 : 1;

    sheet.appendRow([
      id,
      data.grade,
      data.gender,
      data.satisfaction,
      data.highlight,
      data.message,
      data.future,
      new Date()
    ]);
  } finally {
    lock.releaseLock();
  }
}
