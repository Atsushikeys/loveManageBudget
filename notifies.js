// ゴミ出しや経費申請などの各種お知らせ機能をここに書いていく

//#region フィールド変数

// アクセス情報は外部に記載
var ACCESS_TOKEN = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName("hidden")
  .getRange(1, 2)
  .getValue();
  
var loveGroupId = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName("hidden")
  .getRange(2, 2)
  .getValue();

// 経費申請フォームURL
var budgetFormURL = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName("hidden")
  .getRange(3, 2)
  .getValue();

// スプレッドシートURL
var budgetSheetURL = SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName("hidden")
  .getRange(4, 2)
  .getValue();

// 市のゴミ情報 URL
var garbageCityInfoURL = SpreadsheetApp.getActiveSpreadsheet()
.getSheetByName("hidden")
.getRange(5, 2)
.getValue();

//シートの情報を取得
// `ゴミ情報`シート
var garbageSpreadSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ゴミ情報");
var garbageSsLastRow = garbageSpreadSheet.getLastRow();
var garbageSsLastColumn = garbageSpreadSheet.getLastColumn();

//#endregion フィールド変数

//#region イベント関連メソッド

/**
 * ユーザーからのアクションイベントに応答する
 * @param {JSON} e 受信したイベントオブジェクト
 */
function doPost(e) {
  // WebHookで受信した応答用Token
  var replyToken = JSON.parse(e.postData.contents).events[0].replyToken;
  // ユーザーのメッセージを取得
  var userMsg = JSON.parse(e.postData.contents).events[0].message.text;
  // グループIDを取得
  var groupId = JSON.parse(e.postData.contents).events[0].source.groupId;
  // ユーザーIDを取得
  var userId = JSON.parse(e.postData.contents).events[0].source.userId;

  //ユーザーIDからプロフィール情報を抜き出すリクエストURL
  var getProfileUrl = "https://api.line.me/v2/bot/profile/" + userId;

  // 2020/04/25 17:27:12 初期にグループIDを取得するための記述
  SpreadsheetApp.getActiveSpreadsheet()
  .getSheetByName("hidden")
  .getRange(2, 2)
  .setValue(groupId);

  // ユーザーからの受信MSGによって処理を分岐
  if (
    // ゴミを出した時
    userMsg.indexOf("出した") !== -1 ||
    userMsg.indexOf("だした") !== -1
  ) {
    // ユーザー情報から名前を抜き出す
    var userName = JSON.parse(getUserInfo(userId)).displayName;
    var text = "ちゃんとゴミを出した" + userName + "はえらいね";
    sendReplyMsg(text, replyToken);
  } else if (
    // ゴミを出し忘れた時
    userMsg.indexOf("忘れた") !== -1 ||
    userMsg.indexOf("いつ？") !== -1 ||
    userMsg.indexOf("ゴミの日？") !== -1 ||
    userMsg.indexOf("だっけ？") !== -1
  ) {
    sendForgetGarbageMsg(replyToken);
  } else if (
    // オウム返しをする時
    userMsg.indexOf("欲しい") !== -1
  ) {
    var text = userMsg + "ンゴ";
    sendReplyMsg(text, replyToken);
  } else if (
    // 経費申請のフォームを呼び出すとき
    userMsg === "経費申請"
  ) {
    var text = "物品購入の協力ありがとうな！\n";
    text += "経費はここから申請してくれ！\n";
    text += budgetFormURL;
    sendReplyMsg(text, replyToken);
  }
}

//#endregion イベント関連メソッド

//#region ゴミ出し関連メソッド

/**
 * ゴミを忘れた場合や質問があった場合に通知する
 * @param {String} replyToken 応答用リプライトークン
 */
function sendForgetGarbageMsg(replyToken) {
  // 各曜日のゴミ出しリストを配列で取得
  var arrGarbageInfo = garbageSpreadSheet.getRange(2, 1, garbageSsLastRow, garbageSsLastColumn).getValues();

  // 現在の曜日に対応する配列のインデックスを取得
  var weekDayNumber = new Date().getDay();

  // 次のゴミ出し日情報
  var nextGarbageDay = arrGarbageInfo[weekDayNumber][3];

  // メッセージ本文を作成
  var text = "";
  text += "次は " + nextGarbageDay + " だぞ！ 忘れんなよ！\n";
  text += "詳しくはここを見てくれ！\n";
  text += garbageCityInfoURL;
  sendReplyMsg(text, replyToken);
}

/**
 * ゴミの日をお知らせする
 */
function notifyGarbageKind() {
  // 各曜日のゴミ出しリストを配列で取得
  var arrGarbageInfo = garbageSpreadSheet.getRange(2, 1, garbageSsLastRow, garbageSsLastColumn).getValues();

  //現在の曜日に対応する配列のインデックスを取得
  var weekDayNumber = new Date().getDay();

  // インデックスの情報
  var weekdayName = arrGarbageInfo[weekDayNumber][0];
  var isGarbageDay = arrGarbageInfo[weekDayNumber][1];
  var kindOfGarbage = arrGarbageInfo[weekDayNumber][2];
  var nextGarbageDay = arrGarbageInfo[weekDayNumber][3];

  // メッセージ本文を作成
  var text = "";
  text += "今日は" + weekdayName + "だ！\n";
  // ゴミ出し日かそうでないかで分岐
  if (isGarbageDay) {
    text += kindOfGarbage + "の日だぞ！";
  } else {
    text += "次は " + nextGarbageDay + " だぞ！";
  }
  text += "詳しくはここを見てくれ！\n";
  text += garbageCityInfoURL;

  // MSG送信
  msgSender(text, loveGroupId);
}

//#endregion ゴミ出し関連メソッド

//#region 家賃お知らせ関連メソッド

/**
 * 家賃を月末までに支払うように通知する
 */
function notifyRentDay() {
  // 今日を取得
  var today = new Date();
  // 翌月を取得
  var nextMonth = Utilities.formatDate(new Date(today.getFullYear(), today.getMonth() + 1), "Asia/Tokyo", "yyyy年M月");

  // 送信メッセージ本文を作成
  var text = "【家賃の支払い時期になりました】\n";
  text += nextMonth + "分の家賃の支払いを、今月末までにお願いしますm(_ _ )m";
  text += "支払状況は下記の`収入明細表`シートからご確認ください\n";
  text += budgetSheetURL;

  // MSG送信
  msgSender(text, loveGroupId);
}

/**
 * 翌月分の家賃を支払った人のリストを通知する
 */
function notifyPaidPerson() {
  // 今日を取得
  var today = new Date();
  // 翌月を取得
  var nextMonth = new Date(today.getFullYear(), today.getMonth() + 1);

  // 家賃支払者リストを取得
  var arrPaidList = pickPaidPersonArray(nextMonth);

  // 収入発生日(家賃支払日)インデックス
  var incomeDateIndex = 0;
  // 金額インデックス
  var incomeAmountIndex = 2;
  // 支払者インデックス
  var incomePersonIndex = 4;

  // 通知用にDate型をフォーマット
  var todayFormatted = Utilities.formatDate(today, "Asia/Tokyo", "yyyy年M月d日");
  var nextMonthFormatted = Utilities.formatDate(nextMonth, "Asia/Tokyo", "yyyy年M月");

  // MSG作成
  var text = "【" + nextMonthFormatted + "分 家賃支払い状況】\n";
  if (arrPaidList.length !== 0) {
    arrPaidList.forEach(function(item) {
      text +=
        "支払日: " +
        Utilities.formatDate(item[incomeDateIndex], "Asia/Tokyo", "M/d") +
        ", 支払者: " +
        item[incomePersonIndex] +
        ", 金額:" +
        item[incomeAmountIndex].toLocaleString() +
        "円\n";
    });
    text += "\n";
  } else {
    text += "まだ誰からも家賃もらってません…早く払って…(´・ω・`)\n";
  }

  text += "支払状況は下記の`収入明細表`シートからご確認ください\n";
  text += budgetSheetURL;

  // MSG送信
  msgSender(text, loveGroupId);
}

/**
 * 集計月の家賃を支払った人のリストを作成する
 * @param {Date} pickMonth 集計月
 * @returns {Array[][]} `収入明細表`シートの`収入項目`が家賃収入かつ`収入計上月`が pickmonth の項目
 */
function pickPaidPersonArray(pickMonth) {
  // 収入明細表シートを配列で取得
  var arrIncomeList = incomeSpreadSheet.getRange(2, 1, incomeSsLastRow, incomeSsLastColumn).getValues();

  // 収入項目インデックス
  var incomeTypeIndex = 1;
  // 収入計上月インデックス
  var incomeMonthIndex = 3;

  // 翌月分の家賃収入の配列を作成
  var arrPaidList = arrIncomeList.filter(function(item) {
    return item[incomeMonthIndex].toString() === pickMonth.toString() && item[incomeTypeIndex] === "家賃収入";
  });

  return arrPaidList;
}

//#endregion 家賃お知らせ関連メソッド

//#region 共通モジュール

/**
 * メッセージを送信するメソッド
 * @param {String} msgText 送信するメッセージ本文
 * @param {String} sendToID 送信先ID
 */
function msgSender(msgText, sendToID) {
  //投稿データを作成
  var postData = {
    to: sendToID,
    messages: [
      {
        type: "text",
        text: msgText
      }
    ]
  };

  var url = "https://api.line.me/v2/bot/message/push";
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData)
  };
  var response = UrlFetchApp.fetch(url, options);
}

/**
 * ユーザー情報を抜き出す
 * @param {String} userId イベントオブジェクトから抜き出したユーザーID
 * @returns {JSON} ユーザー情報のJSON
 */
function getUserInfo(userId) {
  //ユーザーIDからプロフィール情報を抜き出すリクエストURL
  var profileUrl = "https://api.line.me/v2/bot/profile/" + userId;
  //ユーザー情報をGetするためのhttpリクエストを作成するためのヘッダとボディを作成
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN
  };
  var options = {
    method: "get",
    headers: headers,
    muteHttpExceptions: true
  };

  return UrlFetchApp.fetch(profileUrl, options);
}

/**
 * 応答(リプライ)メッセージを送る
 * @param {String} msgText 応答メッセージ内容
 * @param {String} replyToken リプライトークン
 */
function sendReplyMsg(msgText, replyToken) {
  // 応答メッセージ用のAPI URL
  var replyUrl = "https://api.line.me/v2/bot/message/reply";
  //投稿データを作成
  var postData = {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: msgText
      }
    ]
  };
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData)
  };

  var response = UrlFetchApp.fetch(replyUrl, options);
}

//#endregion 共通モジュール
