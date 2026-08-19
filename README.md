# よりよいスケジュール帳

予定タイトルを登録し、一覧で確認できるシンプルなWebアプリです。

ReactからFastAPIへ予定を送り、SQLiteへ保存します。保存した予定はページを再読み込みしても残ります。

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
