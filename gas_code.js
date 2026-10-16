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

// 保存する列: 回答番号, 学年, 性別, イベントの感想, 良かった点, その他のメッセージ, 今後参加したいイベント, 送信日時
function saveAnswer(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 同時送信で回答番号が重複しないようにロックする
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    // 最終行の回答番号 + 1（見出し行のみ・データなしの場合は 1 から開始）
    var lastRow = sheet.getLastRow();
    var lastNumber = lastRow > 0 ? sheet.getRange(lastRow, 1).getValue() : 0;
    var answerNumber = typeof lastNumber === "number" ? lastNumber + 1 : 1;

    sheet.appendRow([
      answerNumber,
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
