// グローバル変数は全てここに記載する

//#region アクセス情報

// アクセストークン
var ACCESS_TOKEN = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(1, 2).getValue();

// LINEグループID
var loveGroupId = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(2, 2).getValue();

//#endregion アクセス情報

//#region 各種URL

// 経費申請フォームURL
var budgetFormURL = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(3, 2).getValue();

// 経費管理表シートURL
var budgetSheetURL = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(4, 2).getValue();

// 市のゴミ情報 URL
var garbageCityInfoURL = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("hidden").getRange(5, 2).getValue();

//#endregion 各種URL

//#region スプレッドシート オブジェクト

//シートの情報を取得
// `ゴミ情報`シート
var garbageSpreadSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ゴミ情報");
var garbageSsLastRow = garbageSpreadSheet.getLastRow();
var garbageSsLastColumn = garbageSpreadSheet.getLastColumn();

// `経費管理表`シート
var expenseSpreadSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("経費管理表");
var expenseSsLastRow = expenseSpreadSheet.getLastRow();
var expenseSsLastColumn = expenseSpreadSheet.getLastColumn();
var isTatekaezumiColIdx = 12;
var hikiotoshiMonthColIdx = 11;
var expensePriceIdx = 8;

//#endregion スプレッドシート オブジェクト