# 愛の家計簿 仕様書

# TODO
- [ ] 共通で使うグローバル定数は`globalConst`にまとめる

# 仕様詳細

## 共通仕様
- [ ] 共通で使うグローバル定数は`globalConst`にまとめる
- [ ] 立替済みにチェックがついていないものだけを集計してLINEに報告する

## 経費管理表

### お知らせ機能

立替済みにチェックがついていないものだけを集計してLINEに報告する
forEachで足し合わせる変数をいちいちIntegerにキャストしないと、`toLocaleString()`も機能しない？
