# よりよいスケジュール帳

## アプリ概要

予定とタスクをまとめて管理できるWebスケジュール帳です。

通常の予定管理に加えて、予定の目的地までの経路を検索し、**予定そのものだけでなく、その予定へ向かうために必要な移動時間もスケジュールとして管理できる**ことを本アプリの中心機能とします。

例えば10:30開始の予定に対して、目的地まで1時間かかる場合、

* 09:20〜10:20 移動
* 10:30〜12:00 予定

のように、移動時間をカレンダー上に表示します。

これにより、

> 「10:30に予定がある」

だけではなく、

> 「その予定に間に合うためには09:20から移動を始める必要がある」

ところまでスケジュール帳で管理できることを目指します。

---

# 1. 技術構成

| 項目      | 技術                |
| ------- | ----------------- |
| フロントエンド | React             |
| ビルドツール  | Vite              |
| バックエンド  | FastAPI           |
| データベース  | SQLite            |
| 経路検索    | Google Routes API |
| 通信形式    | JSON              |

基本的な構成は次のとおりです。

```text
React
  |
  | HTTP / JSON
  v
FastAPI
  |
  +------ SQLite
  |
  +------ Google Routes API
```

Google Routes APIのAPIキーはバックエンド側だけで使用し、フロントエンドには公開しません。

`.env` などAPIキーを含むファイルはGitへpushしません。

---

# 2. アプリ全体の機能要件

## 2.1 カレンダー

カレンダーには以下の表示を用意します。

* 月表示
* 週表示
* タスク表示

画面上部の切り替えボタンから表示を変更します。

### 月表示

1か月分の予定を確認します。

各日付セルには、その日に登録されている予定を表示します。

日付セルをクリックすると、その日を初期値とした予定追加モーダルを開きます。

### 週表示

1週間分の予定を時間軸上に表示します。

通常の予定に加えて、登録済みの**移動予定も時間ブロックとして表示**します。

例：

```text
09:00

09:20 ┌────────────────┐
      │ 移動            │
      │ → Garraway F    │
10:20 └────────────────┘

10:30 ┌────────────────┐
      │ ハッカソン      │
      │ Garraway F      │
12:00 └────────────────┘
```

週表示の空いている時間をクリックすると、その日時を初期値とした予定追加モーダルを開きます。

### タスク表示

タスクを一覧表示します。

タスクには以下の情報を持たせます。

* タイトル
* 期限
* 説明
* 完了状態

未完了タスクと完了済みタスクを分けて表示します。

---

# 3. 予定機能

## 3.1 予定追加

以下の場所から共通の予定追加モーダルを開きます。

* ヘッダーの「追加」ボタン
* 月カレンダーの日付
* 週カレンダーの空き時間

予定には以下を入力できます。

| 項目     | 必須 | 説明                 |
| ------ | -- | ------------------ |
| タイトル   | 必須 | 予定名                |
| 開始日時   | 必須 | 予定開始日時             |
| 終了日時   | 必須 | 予定終了日時             |
| 説明     | 任意 | 予定についての説明          |
| 場所名    | 任意 | 画面に表示する場所名         |
| 目的地    | 任意 | 経路検索に使用する住所・駅名・施設名 |
| 到着余裕時間 | 任意 | 予定開始何分前までに到着したいか   |

例：

```text
タイトル:
ハッカソン

開始:
2026-08-24 10:30

終了:
2026-08-24 18:00

場所名:
Garraway F

目的地:
福岡市中央区今泉1丁目19番22号 天神CLASS 3階

到着余裕時間:
10分
```

`目的地` が設定されていない予定は、通常の予定として扱います。

---

# 4. 予定詳細

カレンダー上の予定をクリックすると、予定詳細モーダルを表示します。

予定詳細では以下を行えるようにします。

* 予定内容の確認
* 予定の編集
* 予定の削除
* 登録済み移動予定の確認
* 経路検索
* 経路再検索

移動予定が登録されていない場合は、

```text
移動予定がありません

[ 経路を検索 ]
```

と表示します。

移動予定が登録済みの場合は、

```text
09:20 → 10:20
所要時間 60分

九州大学
  ↓ 徒歩
九大学研都市駅
  ↓ JR筑肥線
天神駅
  ↓ 徒歩
Garraway F

[ 経路を再検索 ]
```

のように表示します。

---

# 5. 経路検索機能

## 5.1 経路検索の入口

経路検索は主に予定詳細モーダルから行います。

```text
カレンダー
   ↓
予定をクリック
   ↓
予定詳細
   ↓
「経路を検索」
   ↓
経路検索モーダル
```

目的地を含む予定を新規作成した場合は、予定保存後に続けて経路検索モーダルを開いても構いません。

---

## 5.2 出発地

**出発地はユーザー設定として保存しません。**

経路検索を行うたびに、経路検索モーダルでユーザーが入力します。

例：

```text
出発地
[ 九州大学 伊都キャンパス ]

目的地
Garraway F

到着希望
10:20

[ 経路を検索 ]
```

出発地の初期値をDBへ保存する機能や設定画面は設けません。

---

## 5.3 到着希望時刻

到着希望時刻は予定の開始日時と到着余裕時間から計算します。

```text
到着希望日時
= 予定開始日時 - 到着余裕時間
```

例：

```text
予定開始:
10:30

到着余裕時間:
10分

↓

到着希望:
10:20
```

`arrival_buffer_minutes` が未設定の場合は `0` 分として扱います。

---

## 5.4 経路検索

フロントエンドからFastAPIへ経路検索を依頼し、FastAPIからGoogle Routes APIを呼び出します。

```text
React
   |
   | event_id + origin
   v
FastAPI
   |
   | eventsから目的地・予定開始時刻を取得
   |
   | 到着希望日時を計算
   v
Google Routes API
   |
   v
FastAPI
   |
   | アプリ用JSONへ変換
   v
React
```

Google Routes APIの生レスポンスを、そのままフロントエンドやDBでは使用しません。

バックエンドでアプリ用データへ変換します。

---

## 5.5 経路検索結果

MVPでは、まず**1つの経路を表示**することを基本とします。

経路はNAVITIMEなどの乗換案内サービスのような縦型表示を想定します。

```text
09:20                  10:20
出発         60分       到着

九州大学
│
│ 徒歩 10分
│
九大学研都市駅
│
│ JR筑肥線
│ 09:35 → 10:05
│
天神駅
│
│ 徒歩 15分
│
Garraway F

[ この経路を登録 ]
```

検索しただけでは移動予定をDBへ保存しません。

ユーザーが「この経路を登録」を押した時点で保存します。

---

# 6. 移動予定

移動予定は通常の予定とは別の `travel_plans` テーブルへ保存します。

1つの予定につき、登録できる移動予定は1件とします。

経路を再検索して新しい経路を登録した場合は、以前の移動予定を上書きします。

予定を削除した場合は、その予定に紐づく移動予定も削除します。

---

# 7. DB共通仕様

SQLiteを使用します。

日時はブラウザの `datetime-local` と同じ、

```text
YYYY-MM-DDTHH:mm
```

形式の文字列として保存します。

例：

```text
2026-08-24T10:30
```

MVPではタイムゾーン情報を保存せず、ユーザーが入力したローカル日時として扱います。

使用するテーブルは以下の3つです。

```text
events
tasks
travel_plans
```

出発地点を保存する `settings` テーブルは使用しません。

---

# 8. eventsテーブル

通常の予定を保存します。

| カラム                      | SQLite型   | 必須 | 説明                  |
| ------------------------ | --------- | -- | ------------------- |
| `id`                     | `INTEGER` | 必須 | 主キー、`AUTOINCREMENT` |
| `title`                  | `TEXT`    | 必須 | 予定タイトル              |
| `start_at`               | `TEXT`    | 必須 | 開始日時                |
| `end_at`                 | `TEXT`    | 必須 | 終了日時                |
| `description`            | `TEXT`    | 必須 | 説明。未入力時は空文字         |
| `location_name`          | `TEXT`    | 任意 | ユーザー向けの場所表示名        |
| `destination`            | `TEXT`    | 任意 | 経路検索に使用する目的地        |
| `arrival_buffer_minutes` | `INTEGER` | 任意 | 予定開始何分前に到着するか       |

### 制約

* `title` は空文字・空白のみを許可しない
* `end_at >= start_at` とする
* `arrival_buffer_minutes` は0以上とする
* `destination` がない予定でも登録可能
* `destination` がない場合、経路検索は行えない

### Event JSON

```json
{
  "id": 1,
  "title": "ハッカソン",
  "start_at": "2026-08-24T10:30",
  "end_at": "2026-08-24T18:00",
  "description": "開発を行う",
  "location_name": "Garraway F",
  "destination": "福岡市中央区今泉1丁目19番22号 天神CLASS 3階",
  "arrival_buffer_minutes": 10
}
```

---

# 9. tasksテーブル

タスクを保存します。

| カラム           | SQLite型   | 必須 | 説明                  |
| ------------- | --------- | -- | ------------------- |
| `id`          | `INTEGER` | 必須 | 主キー、`AUTOINCREMENT` |
| `title`       | `TEXT`    | 必須 | タスクタイトル             |
| `due_at`      | `TEXT`    | 任意 | 期限                  |
| `description` | `TEXT`    | 必須 | 説明。未入力時は空文字         |
| `completed`   | `INTEGER` | 必須 | 未完了 `0`、完了 `1`      |

API上では `completed` は `true / false` として扱います。

### Task JSON

```json
{
  "id": 1,
  "title": "Topa'zの記事を書く",
  "due_at": "2026-08-24T22:00",
  "description": "",
  "completed": false
}
```

---

# 10. travel_plansテーブル

予定までの移動予定を保存します。

| カラム                | SQLite型   | 必須 | 説明                  |
| ------------------ | --------- | -- | ------------------- |
| `id`               | `INTEGER` | 必須 | 主キー、`AUTOINCREMENT` |
| `event_id`         | `INTEGER` | 必須 | 対応する `events.id`    |
| `origin`           | `TEXT`    | 必須 | 経路検索時に入力した出発地       |
| `destination`      | `TEXT`    | 必須 | 経路検索時に使用した目的地       |
| `departure_at`     | `TEXT`    | 必須 | 出発日時                |
| `arrival_at`       | `TEXT`    | 必須 | 到着日時                |
| `duration_minutes` | `INTEGER` | 必須 | 所要時間                |
| `transport_mode`   | `TEXT`    | 必須 | 主な移動手段              |
| `route_details`    | `TEXT`    | 必須 | 経路詳細JSONを文字列として保存   |

`event_id` には `UNIQUE` 制約を設定し、1予定につき移動予定を1件とします。

```sql
FOREIGN KEY (event_id)
REFERENCES events(id)
ON DELETE CASCADE
```

を設定し、予定削除時に対応する移動予定も削除します。

---

# 11. route_detailsの形式

SQLiteにはJSON専用カラムを使用せず、JSONを文字列化して `TEXT` として保存します。

例：

```json
{
  "segments": [
    {
      "type": "WALK",
      "from": "九州大学",
      "to": "九大学研都市駅",
      "departure_at": "2026-08-24T09:20",
      "arrival_at": "2026-08-24T09:30",
      "duration_minutes": 10,
      "line_name": null
    },
    {
      "type": "TRANSIT",
      "from": "九大学研都市駅",
      "to": "天神駅",
      "departure_at": "2026-08-24T09:35",
      "arrival_at": "2026-08-24T10:05",
      "duration_minutes": 30,
      "line_name": "JR筑肥線"
    }
  ]
}
```

Google Routes APIの生レスポンス全体は保存しません。

アプリの表示に必要な情報だけを保存します。

---

# 12. DBの関連

```text
events
┌──────────────────────┐
│ id PK                │
│ title                │
│ start_at             │
│ end_at               │
│ description          │
│ location_name        │
│ destination          │
│ arrival_buffer       │
└──────────┬───────────┘
           │
           │ 1
           │
           │ 0..1
           v
travel_plans
┌──────────────────────┐
│ id PK                │
│ event_id FK UNIQUE   │
│ origin               │
│ destination          │
│ departure_at         │
│ arrival_at           │
│ duration_minutes     │
│ transport_mode       │
│ route_details        │
└──────────────────────┘


tasks
┌──────────────────────┐
│ id PK                │
│ title                │
│ due_at               │
│ description          │
│ completed            │
└──────────────────────┘
```

`tasks` は `events` とは独立して管理します。

---

# 13. API共通仕様

APIのURLはすべて `/api/` から始めます。

リクエストとレスポンスはJSONを使用します。

日時は以下の形式です。

```text
YYYY-MM-DDTHH:mm
```

例：

```text
2026-08-24T10:30
```

### エラー形式

エラー時はFastAPI標準と同じ形式を使用します。

```json
{
  "detail": "エラーメッセージ"
}
```

### HTTPステータス

| ステータス                       | 用途                       |
| --------------------------- | ------------------------ |
| `200 OK`                    | 取得・更新成功                  |
| `201 Created`               | 作成成功                     |
| `204 No Content`            | 削除成功                     |
| `400 Bad Request`           | 入力内容が不正                  |
| `404 Not Found`             | データ・経路が存在しない             |
| `422 Unprocessable Entity`  | JSONの型や必須項目が不正           |
| `502 Bad Gateway`           | Google Routes APIとの通信に失敗 |
| `500 Internal Server Error` | 予期しないサーバーエラー             |

---

# 14. Event API

## GET `/api/events`

予定一覧を取得します。

### Response

```json
[
  {
    "id": 1,
    "title": "ハッカソン",
    "start_at": "2026-08-24T10:30",
    "end_at": "2026-08-24T18:00",
    "description": "",
    "location_name": "Garraway F",
    "destination": "福岡市中央区今泉1丁目19番22号",
    "arrival_buffer_minutes": 10
  }
]
```

---

## POST `/api/events`

予定を作成します。

### Request

```json
{
  "title": "ハッカソン",
  "start_at": "2026-08-24T10:30",
  "end_at": "2026-08-24T18:00",
  "description": "",
  "location_name": "Garraway F",
  "destination": "福岡市中央区今泉1丁目19番22号",
  "arrival_buffer_minutes": 10
}
```

### Response

`201 Created`

作成したEventを返します。

---

## PUT `/api/events/{event_id}`

予定を更新します。

編集可能な項目をすべて送信します。

予定の開始日時、目的地、到着余裕時間など、経路に影響する項目が変更された場合は、フロントエンドで再検索を促します。

### Response

`200 OK`

更新後のEventを返します。

---

## DELETE `/api/events/{event_id}`

予定を削除します。

対応する `travel_plans` も `ON DELETE CASCADE` により削除します。

### Response

`204 No Content`

---

# 15. Task API

## GET `/api/tasks`

タスク一覧を取得します。

---

## POST `/api/tasks`

タスクを作成します。

### Request

```json
{
  "title": "Topa'zの記事を書く",
  "due_at": "2026-08-24T22:00",
  "description": ""
}
```

作成時の `completed` はバックエンドで `false` とします。

### Response

`201 Created`

---

## PUT `/api/tasks/{task_id}`

タスクを更新します。

### Request

```json
{
  "title": "Topa'zの記事を完成させる",
  "due_at": "2026-08-24T22:00",
  "description": "",
  "completed": true
}
```

### Response

`200 OK`

---

## DELETE `/api/tasks/{task_id}`

タスクを削除します。

### Response

`204 No Content`

---

# 16. Route Search API

## POST `/api/events/{event_id}/route-search`

指定した予定までの経路を検索します。

### Request

出発地はDBへ保存されたユーザー設定から取得せず、検索のたびにフロントエンドから送ります。

```json
{
  "origin": "九州大学 伊都キャンパス"
}
```

### バックエンド処理

1. `event_id` から予定を取得する
2. 予定がなければ `404 Not Found`
3. `destination` がなければ `400 Bad Request`
4. `origin` が空なら `400 Bad Request`
5. `start_at` と `arrival_buffer_minutes` から到着希望日時を計算する
6. Google Routes APIへ問い合わせる
7. Googleのレスポンスをアプリ用形式へ変換する
8. 経路検索結果を返す

到着希望日時は、

```text
event.start_at - event.arrival_buffer_minutes
```

で計算します。

### Response

```json
{
  "origin": "九州大学 伊都キャンパス",
  "destination": "福岡市中央区今泉1丁目19番22号",
  "departure_at": "2026-08-24T09:20",
  "arrival_at": "2026-08-24T10:20",
  "duration_minutes": 60,
  "transport_mode": "TRANSIT",
  "segments": [
    {
      "type": "WALK",
      "from": "九州大学",
      "to": "九大学研都市駅",
      "departure_at": "2026-08-24T09:20",
      "arrival_at": "2026-08-24T09:30",
      "duration_minutes": 10,
      "line_name": null
    },
    {
      "type": "TRANSIT",
      "from": "九大学研都市駅",
      "to": "天神駅",
      "departure_at": "2026-08-24T09:35",
      "arrival_at": "2026-08-24T10:05",
      "duration_minutes": 30,
      "line_name": "JR筑肥線"
    }
  ]
}
```

このAPIを呼んだだけではDBへ保存しません。

---

# 17. Travel Plan API

## GET `/api/events/{event_id}/travel-plan`

指定した予定に登録されている移動予定を取得します。

### Response

```json
{
  "id": 1,
  "event_id": 1,
  "origin": "九州大学 伊都キャンパス",
  "destination": "福岡市中央区今泉1丁目19番22号",
  "departure_at": "2026-08-24T09:20",
  "arrival_at": "2026-08-24T10:20",
  "duration_minutes": 60,
  "transport_mode": "TRANSIT",
  "segments": [
    {
      "type": "WALK",
      "from": "九州大学",
      "to": "九大学研都市駅",
      "departure_at": "2026-08-24T09:20",
      "arrival_at": "2026-08-24T09:30",
      "duration_minutes": 10,
      "line_name": null
    }
  ]
}
```

移動予定が登録されていない場合は `404 Not Found` とします。

---

## PUT `/api/events/{event_id}/travel-plan`

経路検索結果から選んだ経路を保存します。

同じ `event_id` の移動予定がすでに存在する場合は上書きします。

### Request

```json
{
  "origin": "九州大学 伊都キャンパス",
  "destination": "福岡市中央区今泉1丁目19番22号",
  "departure_at": "2026-08-24T09:20",
  "arrival_at": "2026-08-24T10:20",
  "duration_minutes": 60,
  "transport_mode": "TRANSIT",
  "segments": [
    {
      "type": "WALK",
      "from": "九州大学",
      "to": "九大学研都市駅",
      "departure_at": "2026-08-24T09:20",
      "arrival_at": "2026-08-24T09:30",
      "duration_minutes": 10,
      "line_name": null
    }
  ]
}
```

バックエンドでは `segments` をJSON文字列へ変換し、`route_details` に保存します。

### Response

`200 OK`

保存したTravelPlanを返します。

---

## DELETE `/api/events/{event_id}/travel-plan`

登録済みの移動予定を削除します。

### Response

`204 No Content`

MVPで不要な場合、このAPIは後回しにして構いません。

---

# 18. 予定一覧と移動予定の取得

カレンダー表示時には通常予定だけでなく、登録済みの移動予定も必要になります。

MVPでは `GET /api/events` に移動予定を直接含めず、

```text
GET /api/events
GET /api/events/{event_id}/travel-plan
```

を利用できます。

ただし予定数が増えると通信回数が増えるため、必要に応じて将来的に一覧取得APIへ移動予定を含める方式へ変更します。

ハッカソンのMVPでは、実装の分かりやすさを優先します。

---

# 19. 画面構成

アプリ全体は大きく以下のUIで構成します。

| UI        | 役割         |
| --------- | ---------- |
| メイン画面     | 月・週・タスク表示  |
| 予定追加モーダル  | 新規予定作成     |
| 予定詳細モーダル  | 予定確認・編集・削除 |
| 経路検索モーダル  | 出発地入力・経路検索 |
| タスク追加モーダル | 新規タスク作成    |

経路検索専用の別ページは作らず、カレンダー上でモーダルとして完結させます。

---

# 20. 主要な画面遷移

## 新規予定

```text
カレンダー
   ↓
予定追加
   ↓
予定を保存
   ↓
目的地あり？
   ├─ No → カレンダーへ戻る
   │
   └─ Yes
       ↓
   経路検索モーダル
       ↓
   出発地を入力
       ↓
   経路検索
       ↓
   経路結果
       ↓
   「この経路を登録」
       ↓
   移動予定保存
       ↓
   カレンダー
```

## 既存予定

```text
カレンダー
   ↓
予定をクリック
   ↓
予定詳細
   ↓
「経路を検索」
   ↓
出発地を入力
   ↓
経路検索
   ↓
経路結果
   ↓
移動予定登録
```

## 経路再検索

```text
予定詳細
   ↓
既存移動予定
   ↓
「経路を再検索」
   ↓
出発地を入力
   ↓
新しい経路を検索
   ↓
「この経路を登録」
   ↓
既存travel_planを上書き
```

---

# 21. バックエンドの責務

FastAPI側では以下を担当します。

* EventのCRUD
* TaskのCRUD
* TravelPlanの取得・保存・削除
* Eventの入力値検証
* 到着希望日時の計算
* Google Routes APIへの通信
* Google Routes APIレスポンスの整形
* SQLiteへの保存
* APIキーの管理
* 外部APIエラーの変換

フロントエンド側では、Google Routes APIを直接呼び出しません。

---

# 22. フロントエンドの責務

React側では以下を担当します。

* 月カレンダー表示
* 週カレンダー表示
* タスク一覧表示
* 予定追加・編集フォーム
* タスク追加・編集フォーム
* 予定詳細表示
* 経路検索モーダル
* 出発地入力
* 経路検索結果表示
* 移動予定の時間ブロック表示
* FastAPIとのHTTP通信

経路検索に必要な時刻計算やGoogle APIレスポンス解析は、原則としてバックエンド側で行います。

---

# 23. 経路変更時の扱い

以下の予定情報が変更された場合、既存の移動予定が正しくなくなる可能性があります。

* `start_at`
* `destination`
* `arrival_buffer_minutes`

これらを変更した場合は、既存の移動予定が登録されていればフロントエンドで、

```text
予定の日時または目的地が変更されました。
移動経路を再検索してください。
```

などと表示し、再検索を促します。

MVPでは予定変更時にGoogle Routes APIを自動実行せず、ユーザー操作で再検索します。

---

# 24. MVPの範囲

ハッカソンで最低限完成させる範囲は以下とします。

1. 予定を追加できる
2. 予定を月・週カレンダーで確認できる
3. タスクを追加・完了できる
4. 予定に目的地を設定できる
5. 経路検索画面で出発地を入力できる
6. Google Routes APIから経路を取得できる
7. NAVITIME風の経路表示ができる
8. 選択した経路を移動予定として保存できる
9. 週カレンダー上に移動時間を表示できる

---

# 25. MVPでは行わないもの

以下は必須機能には含めません。

* ユーザーアカウント
* ログイン
* ユーザーごとの設定
* 出発地点の保存
* 現在地の自動取得
* Google Calendarとの同期
* 複数端末間の同期
* 複数ユーザーでの予定共有
* 高度な経路検索条件
* 複数経路候補の比較

これらは基本機能完成後の拡張候補とします。

---

# 26. バックエンド実装時のファイル構成

最低限、以下のような構成を想定します。

```text
backend/
├── main.py
├── database.py
├── routes_service.py
├── requirements.txt
├── test_database.py
└── test_routes.py
```

### `main.py`

FastAPIのAPIエンドポイントとリクエスト・レスポンスモデルを定義します。

### `database.py`

SQLiteへのアクセスを担当します。

### `routes_service.py`

Google Routes APIへの通信と、Googleのレスポンスからアプリ用経路データへの変換を担当します。

---

# 27. 環境変数

Google Routes APIのAPIキーは環境変数から取得します。

`.env` の例：

```text
GOOGLE_MAPS_API_KEY=your_api_key
```

`.env` はGit管理しません。

代わりに `.env.example` をリポジトリへ追加します。

```text
GOOGLE_MAPS_API_KEY=
```

APIキーをソースコードへ直接記述しないでください。

---

# 28. 最終的な利用イメージ

```text
10:30からGarraway Fで予定を登録
            ↓
目的地も入力
            ↓
「経路を検索」
            ↓
出発地
「九州大学 伊都キャンパス」
を入力
            ↓
Google Routes API
            ↓
09:20出発
10:20到着
という経路を取得
            ↓
「この経路を登録」
            ↓
週カレンダー

09:20〜10:20
移動 → Garraway F

10:30〜18:00
ハッカソン
```

この「予定に必要な移動時間までスケジュールとして可視化する」体験を、本アプリの中心機能とします。

## 必要なソフトウェア

- Python 3.10以上
- Node.js 20.19以上、または22.12以上
- npm

## 1. バックエンドを起動する

リポジトリのルートディレクトリで、Pythonの仮想環境を作成します。

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

続けて、`backend` ディレクトリへ移動してFastAPIを起動します。

```bash
cd backend
uvicorn main:app --reload
```

バックエンドは http://localhost:8000 で起動します。

- health check: http://localhost:8000/api/health
- 予定一覧API: http://localhost:8000/api/events
- APIドキュメント: http://localhost:8000/docs

初回起動時に `backend/schedule.db` が自動で作られ、予定はこのSQLiteファイルへ保存されます。

## 2. フロントエンドを起動する

別のターミナルを開き、リポジトリのルートから `frontend` ディレクトリへ移動します。

```bash
cd frontend
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

## 動作確認

1. 「追加」、月表示の日付セル、週表示の空き時間から追加画面が開くことを確認する
2. 予定とタスクを追加し、カレンダーやタスク一覧へ反映されることを確認する
3. 「週」を押し、予定が時刻に応じた位置へ表示されることを確認する
4. 「タスク」を押し、未完了タスクと折りたたまれた完了済みタスクを確認する
5. タスクのチェックを切り替え、未完了と完了済みの間を移動することを確認する

フロントエンドとバックエンドの両方を起動してから操作してください。通信に失敗した場合は、両方のターミナルにエラーが出ていないか確認してください。
