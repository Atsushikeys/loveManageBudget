/**
 * 経費申請フォームが送信された場合にグループLINEに内容を投稿する
 * @param {JSON} e フォーム送信イベントオブジェクト
 */
function sendFormResult(e) {
  // FormAppを宣言
  FormApp.getActiveForm();

  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("経費管理表");

  // 送信内容の配列
  var arrSentForm = ss.getRange(ss.getLastRow(), 1, 1, ss.getLastColumn()).getValues();
  // 購入日
  var boughtDate = Utilities.formatDate(arrSentForm[0][1], "Asia/Tokyo", "yyyy年M月d日");
  // 購入者
  var boughtPerson = arrSentForm[0][2];
  // 経費分類
  var expenseKind = arrSentForm[0][3];
  // 金額
  var expenseAmount = arrSentForm[0][8];
  // 備考
  var expenseInfo = arrSentForm[0][9];
  // レシートURL
  var receiptUrl = arrSentForm[0][10];

  var text = "【経費申請がありました】\n";
  text += "購入日 : " + boughtDate + "\n";
  text += "購入者 : " + boughtPerson + "\n";
  text += "経費分類 : " + expenseKind + "\n";
  text += "金額 : " + expenseAmount.toLocaleString() + "円\n";
  text += "備考 : " + expenseInfo + "\n";
  text += "レシートURL : " + receiptUrl + "\n\n";

  text += "過去の経費申請一覧はこちらのURLを参照してください\n";
  text += budgetSheetURL;

  Logger.log(text);
  // MSG送信
  msgSender(text, loveGroupId);
}
