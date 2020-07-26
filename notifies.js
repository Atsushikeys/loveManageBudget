// ゴミ出しや経費申請などの各種お知らせ機能をここに書いていく

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
    // 経費申請のフォームを呼び出すとき
    userMsg === "経費申請"
  ) {
    var text = "物品購入の協力ありがとうな！\n";
    text += "経費はここから申請してくれ！\n";
    text += budgetFormURL;
    sendReplyMsg(text, replyToken);
  } else if (
    // 経費情報をお知らせする
    userMsg === "経費"
  ) {
    var text = "今までの経費合計は" + notifyExpenseSum().toLocaleString() + "円\n";
    text += "月ごとの未立替金は\n" + notifyMitatekae() + "だよ〜\n\n";
    text += "詳細はここから！\n";
    text += budgetSheetURL;
    sendReplyMsg(text, replyToken);
  } else if (
    // 未建て替えサマリ情報の表示
    userMsg === "立て替え" ||
    userMsg === "立替"
  ) {
    var text = "未建て替え情報を表示するよ！\n\n";
    text += notifyMitatekae();
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

//#region 家計簿お知らせ関連メソッド

/**
 * 経費の合計額をお知らせする
 * @return {int} sumPrice
 */
function notifyExpenseSum() {
  // 経費管理表シートを配列で取得
  var arrExpenseInfo = expenseSpreadSheet.getRange(2, 1, expenseSsLastRow - 1, expenseSsLastColumn).getValues();

  // 合計値格納用変数を定義
  var sumPrice = 0;

  // 配列を回す
  arrExpenseInfo.forEach(function (item) {
    sumPrice += parseInt(item[expensePriceIdx]);
  });

  return sumPrice;
}

/**
 * 経費管理表 未建て替え情報を表示
 * @return {String} 未建て替えサマリ
 */
function notifyMitatekae() {
  // 経費管理表シートを配列で取得
  var arrExpenseInfo = expenseSpreadSheet.getRange(2, 1, expenseSsLastRow - 1, expenseSsLastColumn).getValues();
  var arrMitatekae = arrExpenseInfo.filter(function (item) {
    return !item[isTatekaezumiColIdx];
  });

  // 未建て替えの引き落とし月セットを作成
  var monthSet = new Set();
  arrMitatekae.forEach(function (item) {
    if(item[hikiotoshiMonthColIdx] == ""){
      monthSet.add("引き落としなし");
      return
    };
    var month = item[hikiotoshiMonthColIdx].getMonth() + 1; // getMonthは0始まりなので実際の月-1
    var monthStr = month < 10 ? "0" + month.toString() : month.toString();
    monthSet.add(item[hikiotoshiMonthColIdx].getFullYear().toString() + "/" + monthStr);
  });

  var arrSumMonth = [];
  for (var v of monthSet) {
    arrSumMonth.push(v);
  }

  arrSumMonth.sort();
  Logger.log(arrSumMonth);

  var rettxt = "";
  // 月毎でサマってテキストに格納する
  for (var i = 0; i < arrSumMonth.length; i++) {
    var sum = 0;
    arrMitatekae.forEach(function (item) {
      if(item[hikiotoshiMonthColIdx] == ""){
        // 引き落としなしのとき以外は次のループへ
        if(arrSumMonth[i] !== "引き落としなし") return;
        sum += item[expensePriceIdx];
        return
      };
      var month = item[hikiotoshiMonthColIdx].getMonth() + 1;
      var monthStr = month < 10 ? "0" + month.toString() : month.toString();
      var ym = item[hikiotoshiMonthColIdx].getFullYear().toString() + "/" + monthStr;

      // yyyyMMが一致するなら合計値に追加
      sum += arrSumMonth[i] === ym ? item[expensePriceIdx] : 0;
    });
    rettxt += arrSumMonth[i] + " : " + sum.toLocaleString() + "円\n";
  }

  Logger.log(rettxt);
  return rettxt;
}

//#endregion 家計簿お知らせ関連メソッド

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
        text: msgText,
      },
    ],
  };

  var url = "https://api.line.me/v2/bot/message/push";
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN,
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData),
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
    Authorization: "Bearer " + ACCESS_TOKEN,
  };
  var options = {
    method: "get",
    headers: headers,
    muteHttpExceptions: true,
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
        text: msgText,
      },
    ],
  };
  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + ACCESS_TOKEN,
  };

  var options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(postData),
  };

  var response = UrlFetchApp.fetch(replyUrl, options);
}

//#endregion 共通モジュール
