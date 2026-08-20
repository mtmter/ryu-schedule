# よりよいスケジュール帳

予定タイトルを登録し、一覧で確認できるシンプルなWebアプリです。

ReactからFastAPIへ予定を送り、SQLiteへ保存します。保存した予定はページを再読み込みしても残ります。

## DB・API共通仕様（Issueベース）

この節は、フロントエンドとバックエンドを並行して実装するための共通仕様です。

以下のIssueをもとに、Issue内で未指定だったデータ型、日時形式、リクエストとレスポンスの形をこのREADMEで統一します。

- [#2 Back01 eventsテーブルを拡張する](https://github.com/mtmter/ryu-schedule/issues/2)
- [#3 Front02 予定追加フォームを作る](https://github.com/mtmter/ryu-schedule/issues/3)
- [#5 Back02 Event APIの更新・削除を追加](https://github.com/mtmter/ryu-schedule/issues/5)
- [#8 Back03 tasksテーブルを追加](https://github.com/mtmter/ryu-schedule/issues/8)
- [#9 Front05 タスク追加フォームを作る](https://github.com/mtmter/ryu-schedule/issues/9)
- [#11 Back04 Task APIを追加](https://github.com/mtmter/ryu-schedule/issues/11)

> [!IMPORTANT]
> この節には、上記Issueでこれから実装する予定の仕様も含まれます。
> `events`のAPIと予定追加フォームは実装済みですが、`tasks`の仕様には未実装の内容が含まれます。

### 共通ルール

- APIのURLは`/api/`から始める
- リクエストとレスポンスはJSONを使用する
- `start_at`、`end_at`、`due_at`は、ブラウザの`datetime-local`と同じ`YYYY-MM-DDTHH:mm`形式の文字列にする
- 上記の日時にはタイムゾーン情報を付けず、画面へ入力されたローカル日時として扱う
- `tasks`の`created_at`はバックエンドで作成し、`YYYY-MM-DDTHH:mm:ss`形式の文字列で返す
- `id`はフロントエンドから送信しない。`tasks`の`created_at`もフロントエンドから送信しない
- 文字列として必須の項目は、空白だけの値を許可しない
- タイトルの空文字や日時の前後関係など、値の内容に問題がある場合は`400 Bad Request`を返す
- 必須項目の不足やデータ型の違いなど、JSONの形式に問題がある場合はFastAPI標準の`422 Unprocessable Entity`を返す
- 更新・削除の対象となるIDが存在しない場合は`404 Not Found`を返す
- エラー時はFastAPI標準と同じ`{"detail": "エラーメッセージ"}`形式を返す
- CORSでは`GET`、`POST`、`PUT`、`DELETE`を許可する

### eventsテーブル

| カラム | SQLite型 | 必須 | 初期値・役割 |
| --- | --- | --- | --- |
| `id` | `INTEGER` | はい | 主キー、`AUTOINCREMENT` |
| `title` | `TEXT` | はい | 予定タイトル |
| `start_at` | `TEXT` | はい | 開始日時、`YYYY-MM-DDTHH:mm`形式 |
| `end_at` | `TEXT` | はい | 終了日時、`YYYY-MM-DDTHH:mm`形式 |
| `description` | `TEXT` | はい | 説明。未入力時は空文字 |

`end_at`は`start_at`と同じか、それより後の日時にします。

#### EventのJSON形式

```json
{
  "id": 1,
  "title": "ハッカソン",
  "start_at": "2026-08-24T11:00",
  "end_at": "2026-08-24T18:00",
  "description": "開発と発表を行う"
}
```

#### Event API

| メソッド | URL | リクエスト | 成功時 |
| --- | --- | --- | --- |
| `GET` | `/api/events` | なし | `200 OK`、Eventの配列 |
| `POST` | `/api/events` | 下記の作成用JSON | `201 Created`、作成したEvent |
| `PUT` | `/api/events/{id}` | 下記の更新用JSON | `200 OK`、更新したEvent |
| `DELETE` | `/api/events/{id}` | なし | `204 No Content`、レスポンス本文なし |

```json
{
  "title": "ハッカソン",
  "start_at": "2026-08-24T11:00",
  "end_at": "2026-08-24T18:00",
  "description": "開発と発表を行う"
}
```

更新用JSONでは、次の編集可能な項目をすべて送ります。

```json
{
  "title": "ハッカソン成果発表",
  "start_at": "2026-08-24T11:00",
  "end_at": "2026-08-24T19:00",
  "description": "開発後に成果を発表する"
}
```

### tasksテーブル

| カラム | SQLite型 | 必須 | 初期値・役割 |
| --- | --- | --- | --- |
| `id` | `INTEGER` | はい | 主キー、`AUTOINCREMENT` |
| `title` | `TEXT` | はい | タスクタイトル |
| `due_at` | `TEXT` | いいえ | 期限。未設定時は`NULL` |
| `description` | `TEXT` | はい | 説明。未入力時は空文字 |
| `completed` | `INTEGER` | はい | 未完了は`0`、完了は`1`。作成時は`0` |
| `created_at` | `TEXT` | はい | バックエンドが作成日時を設定 |

SQLiteでは`completed`を`0`または`1`で保存しますが、APIでは`false`または`true`の真偽値として扱います。

#### TaskのJSON形式

```json
{
  "id": 1,
  "title": "発表資料を作る",
  "due_at": "2026-08-24T10:00",
  "description": "デモ画面を含める",
  "completed": false,
  "created_at": "2026-08-20T13:00:00"
}
```

#### Task API

| メソッド | URL | リクエスト | 成功時 |
| --- | --- | --- | --- |
| `GET` | `/api/tasks` | なし | `200 OK`、Taskの配列 |
| `POST` | `/api/tasks` | 下記の作成用JSON | `201 Created`、作成したTask |
| `PUT` | `/api/tasks/{id}` | 下記の更新用JSON | `200 OK`、更新したTask |
| `DELETE` | `/api/tasks/{id}` | なし | `204 No Content`、レスポンス本文なし |

作成時の`completed`はバックエンドが`false`に設定します。期限を設定しない場合、`due_at`には`null`を送ります。

```json
{
  "title": "発表資料を作る",
  "due_at": "2026-08-24T10:00",
  "description": "デモ画面を含める"
}
```

更新用JSONでは、次の編集可能な項目をすべて送ります。

```json
{
  "title": "発表資料を完成させる",
  "due_at": null,
  "description": "最終確認まで行う",
  "completed": true
}
```

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

1. 「予定タイトル」へ予定を入力する
2. 「追加」ボタンを押す
3. 入力した予定が「予定一覧」に表示されることを確認する
4. ブラウザを再読み込みし、予定が残っていることを確認する

フロントエンドとバックエンドの両方を起動してから操作してください。通信に失敗した場合は、両方のターミナルにエラーが出ていないか確認してください。
