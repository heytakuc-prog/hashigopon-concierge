# はしごポン 実店舗版 Codex実装指示

このリポジトリの `docs/shop-data.csv` は、実店舗12店舗のデータへ差し替え済みです。
Codexは本ファイルを読み、`docs/index.html` と `docs/app-v1.js` を以下の仕様に合わせて修正してください。

## 最優先

1. 通常質問を固定5問にする。
   - 今どんな感じ？
   - 何人？
   - 予算は？
   - どんな雰囲気？
   - 食べたい？飲みたい？
2. `MAX_QUESTIONS` は `5`。
3. 4問後に自由入力へ強制遷移する処理を削除する。
4. 自由入力は結果画面の任意機能に移動する。
5. 「盛り上がってる」を選んでも終了せず、にぎやかな店を提案する。
6. 「かなり酔ってる」を追加する。この回答では店を提案せず、帰宅・水分補給を案内する。
7. 結果は営業中または営業時間要確認の店舗から3店舗を表示する。
8. 松戸駅イベントでは `event_zone=matsudo_station` の店舗だけを通常候補にする。`YAGIRIYA` は除外する。
9. 営業時間前を営業中扱いしない。
10. 営業終了・本日休みの店舗は通常候補から除外する。

## 質問と会話

### Q1 今どんな感じ？

- かなり酔ってる
  - 「もう家に帰れ！」
  - 「店を探す前に水飲め。今日は無理するな。」
  - 店舗推薦はしない。
- 盛り上がってる
  - タグ: `lively,group_fun`
  - 「そのテンションなら静かな店は無理だな。」
  - 「店の迷惑はかけるなよ。」
- 落ち着いて飲みたい
  - タグ: `calm,quiet_drink,slow_talk`
- いいムードになりたい
  - タグ: `romantic,stylish,pair_welcome`
  - 「へえ。そういう夜か。」
- お腹が空いた
  - タグ: `hungry,full_meal`
- もう一軒だけ
  - タグ: `second_round,light_drink,quick_finish`
  - 「その“一軒だけ”は信用してない。」

### Q2 何人？

- 1人
  - タグ: `solo,solo_welcome,counter,solo_time`
  - 「ひとりか。俺もいつも一人酒だぜ。」
- 2人
  - タグ: `pair,pair_welcome,slow_talk`
  - 「2人？へえ。詳しくは聞かないでおく。」
- 3〜4人
  - タグ: `small_group,small_group_welcome,group_welcome`
- 5人以上
  - タグ: `large_group,large_group_welcome,group_welcome,table`
  - `small_shop` は原則候補から除外する。候補不足時だけ「事前確認が必要」と表示する。

### Q3 予算は？

- 1,500円くらいまで
- 3,000円くらい
- 5,000円くらい
- 今日は気にしない

### Q4 どんな雰囲気？

- にぎやか
- 落ち着いている
- おしゃれ・いいムード
- 昔ながら・アットホーム
- 初めてでも入りやすい
- 店主やスタッフと話しやすい

### Q5 食べたい？飲みたい？

- とにかく飲みたい
- ご飯もしっかり
- 軽くつまみながら
- 締めを食べたい
- どっちも大事

## はしごポン画像

画像パスは1か所で管理する。

- normal: `./assets/hashigopon-normal.png`
- good: `./assets/hashigopon-good.png`
- surprise: `./assets/hashigopon-surprise.png`
- bad: `./assets/hashigopon-bad.png`
- tired: `./assets/hashigopon-tired.png`
- satisfied: `./assets/hashigopon-satisfied.png`
- recommend: `./assets/hashigopon-recommend.png`

`thinking` と `tsukkomi` の専用画像がない場合は、当面以下で代用する。

- thinking → tired
- tsukkomi → bad

5問終了後は考え中画像を1.2〜1.5秒表示してから結果を出す。

## 推薦ロジック

100点満点や相性パーセントは表示しない。

内部加点の目安:

- 人数一致: +24
- 雰囲気一致: +20
- 食べる・飲む一致: +18
- 気分一致: +16
- 予算一致: +12
- 営業中: +10
- 店舗アンケート回答店の歓迎タグ一致: 1件 +6
- 公開情報による暫定タグ一致: 1件 +3
- 閉店60分以内: -12
- 営業時間要確認: -5

上位5店舗の中から、1位を固定し、残り上位候補から2店舗を選ぶ。
完全ランダムにはしない。

表示ラベル:

- 1位: 本命
- 2位: かなり合いそう
- 3位: 意外とアリ

## CSVの新しい項目

`docs/shop-data.csv` の以下を必ず利用する。

- `public_summary`
- `comment_type`
- `pon_comment`
- `walk_minutes`
- `area`
- `event_zone`
- `survey_confirmed`
- `data_status`
- `hours_status`
- `official_url`
- `instagram_url`
- `reservation_url`

表示ルール:

- `survey_confirmed=true`
  - 見出し「お店からのひとこと」
  - 本文は `owner_comment`
- `survey_confirmed=false`
  - 見出し「公開情報からの特徴」
  - 本文は `public_summary`
- `event_benefit=未確認` は特典欄を表示しない。
- `hours_status=needs_confirmation` は「営業時間は最新の公式情報で確認」と表示する。
- 距離は固定文をやめ、`area` と `walk_minutes` を表示する。

## 店舗カード

表示順:

1. 店名・ジャンル
2. `pon_comment`
3. 本命等の推薦ラベル
4. 現在の営業状況
5. 予算
6. エリア・徒歩分数
7. 雰囲気等のタグ最大3つ
8. お店からのひとこと／公開情報からの特徴
9. 確認済みの場合だけイベント特典
10. 地図・公式情報・予約

リンクは空欄ならボタン自体を表示しない。

## スマホUI

- 360〜430pxを最優先にする。
- 初回表示でQ1の選択肢が見えるようにする。
- 質問開始後は大きなバナーとプロフィールを縮小または非表示にする。
- 会話欄の `max-height` と `overflow-y:auto` を削除し、ページ全体のスクロールだけにする。
- パネル、カード、吹き出し、ボタンの角丸を18〜24px程度にする。
- 回答ボタンは高さ52px以上。
- 店舗カードはスマホで1列。
- 公開画面の「選んで遊ぶ V1」を「松戸の夜、次の一軒を探す」へ変更する。

## 最後の感想

結果後に以下を表示する。

- いい感じ
  - 満足顔
  - 「だろ？まあ、俺に任せとけ。」
- ちょっと違う
  - 悪そうな顔
  - 「わがままだな。もう一回やるなら付き合ってやる。」
- もう一回
  - 最初から再診断

感想の後にも自由入力で条件を追加して再推薦できるようにする。

## 実装後の確認

- JavaScript構文エラーがないこと。
- 360px幅で横スクロールが出ないこと。
- 5問ですべて完了すること。
- 盛り上がってる回答で終了しないこと。
- かなり酔ってる回答で店舗カードを出さないこと。
- 松戸駅イベントでYAGIRIYAが通常表示されないこと。
- 営業終了店舗が候補に混ざらないこと。
- 実店舗12件のCSVを正常に読み込めること。
