# AGENTS.md

## Project Overview

このリポジトリは、「はじめてのハッカソン 2026 Summer」に向けて開発している Web アプリです。

テーマは「よりよいスケジュール帳」です。

開発メンバーは4人で、全員Webアプリ開発の初心者です。

そのため、複雑な設計や高度な抽象化よりも、以下を優先してください。

- 初心者が読んで理解しやすいこと
- 小さく動くものを作ること
- フロントエンド・バックエンド・DBが実際につながっていること
- 後から機能追加しやすいこと
- 不要な技術やライブラリを増やさないこと

## Tech Stack

基本構成は以下です。

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- Uvicorn

### Database

- SQLite

特別な理由がない限り、この技術構成を変更しないでください。

TypeScript、Docker、ORM、大規模な状態管理ライブラリなどは、現時点では導入しないでください。

## Current Goal

現在の最優先目標は「ウォーキングスケルトン」を完成させることです。

以下の一連の通信が実際に動作する状態を作ってください。

React
→ FastAPI
→ SQLite
→ FastAPI
→ React

最初に実装する機能は、非常に単純な予定登録機能です。

ユーザーが予定タイトルを入力して追加すると、

1. ReactからFastAPIへPOSTする
2. FastAPIがSQLiteへ保存する
3. ReactがFastAPIから予定一覧をGETする
4. 保存された予定が画面に表示される

ここまで動けばウォーキングスケルトン完成とします。

## Scope

ウォーキングスケルトンでは、以下だけを実装してください。

- 予定タイトル入力欄
- 予定追加ボタン
- 予定一覧表示
- `GET /api/events`
- `POST /api/events`
- SQLiteへの保存
- FastAPIとReact間のCORS設定
- 最低限のエラーハンドリング
- 起動方法をREADMEに記載

## Out of Scope

現段階では以下を実装しないでください。

- ログイン
- ユーザー管理
- Google Calendar連携
- Google Maps連携
- 乗換案内
- AI機能
- 通知
- カレンダー形式UI
- ドラッグ＆ドロップ
- 高度なデザイン
- Docker
- クラウドへのデプロイ
- ORM
- Redux等の状態管理ライブラリ

これらはウォーキングスケルトン完成後に検討します。

## Backend Design

バックエンドはできるだけ単純にしてください。

推奨構成:

```text
backend/
├── main.py
├── database.py
├── requirements.txt
└── schedule.db
```

必要に応じて多少変更して構いませんが、ファイルを細かく分割しすぎないでください。

SQLiteには最低限、以下のテーブルを作ります。

```text
events
- id
- title
```

必要であれば `created_at` を追加して構いません。

DBファイルはコード実行時に自動作成されるようにしてください。

## API Design

### GET /api/health

既存のhealth checkです。

レスポンス例:

```json
{
  "status": "ok"
}
```

既存のエンドポイントは壊さないでください。

### GET /api/events

登録済み予定の一覧を返します。

レスポンス例:

```json
[
  {
    "id": 1,
    "title": "ハッカソン"
  }
]
```

### POST /api/events

予定を登録します。

リクエスト例:

```json
{
  "title": "ハッカソン"
}
```

レスポンス例:

```json
{
  "id": 1,
  "title": "ハッカソン"
}
```

空文字のタイトルは登録できないようにしてください。

## Frontend Design

デザインは最低限で構いません。

画面には以下があれば十分です。

```text
よりよいスケジュール帳

[ 予定タイトル             ] [追加]

予定一覧

- ハッカソン
- ミーティング
```

コードの分割は必要最低限にしてください。

ウォーキングスケルトン段階では、無理に多数のcomponentsへ分割しないでください。

## Coding Guidelines

初心者チームが読むことを前提にしてください。

以下を守ってください。

- 読みやすい名前を使う
- 短く単純なコードを優先する
- 不要なクラスを作らない
- 不要な抽象化をしない
- マジックを避ける
- コメントは「なぜそうするか」が必要な箇所にだけ書く
- 1つの関数に大量の処理を書かない
- 既存コードを不用意に削除しない

コードを高度にすることより、チームメンバーが理解できることを優先してください。

## Dependencies

新しいライブラリを追加する場合は、本当に必要か確認してください。

標準ライブラリで簡単に実装できるものについては、新しい依存関係を追加しないでください。

特にウォーキングスケルトンでは、依存関係をできるだけ少なくしてください。

## Environment Variables and Secrets

GitHubリポジトリはpublicです。

APIキー、パスワード、トークンなどの秘密情報をコードへ直接書いたり、Gitへcommitしたりしないでください。

必要な場合は環境変数を使用し、`.env` は `.gitignore` に追加してください。

## Before Making Changes

変更前に必ず現在のリポジトリを確認してください。

特に以下を確認してください。

- frontend/package.json
- frontend/src/
- backend/main.py
- backend/requirements.txt
- .gitignore
- README.md

既存コードを利用できる場合は、作り直さず利用してください。

## Verification

実装後は可能な範囲で以下を確認してください。

### Backend

FastAPIが起動すること。

```bash
cd backend
uvicorn main:app --reload
```

以下が成功すること。

```text
GET /api/health
GET /api/events
POST /api/events
```

### Frontend

Reactが起動すること。

```bash
cd frontend
npm run dev
```

ブラウザから以下を確認してください。

1. 画面が表示される
2. 予定タイトルを入力できる
3. 追加ボタンを押せる
4. FastAPIへPOSTされる
5. SQLiteへ保存される
6. ページを再読み込みしても予定が残る
7. 一覧が表示される

## Documentation

実装後、ルートのREADME.mdに初心者向けの起動方法を追加してください。

少なくとも以下を書いてください。

- 必要なソフトウェア
- バックエンド起動方法
- フロントエンド起動方法
- アクセスするURL
- APIのURL
- データがSQLiteに保存されること

コマンドについては、どのディレクトリで実行するのか分かるようにしてください。

## Important

ウォーキングスケルトンでは「機能を増やすこと」より「一本の経路が最後まで動くこと」を優先してください。

勝手にスコープを広げないでください。

不明点があっても、ウォーキングスケルトンに不要なものについては実装せず、TODOまたは提案として残してください。

作業終了時には、以下を報告してください。

1. 変更したファイル
2. 実装した内容
3. 動作確認した内容
4. 実行したコマンド
5. 残っている問題
6. 次にやると良さそうなこと
