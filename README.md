# シムレース体験 予約システム

学園祭のシムレース体験ブース向けの、時間枠制の予約Webアプリです。

- 来場者: `/book` で日付・時間枠を選んで予約 → 6桁の予約コードを発行。`/reservation` でコードから照会・キャンセルできる。
- 運営: `/admin` で予約一覧の確認・受付チェックイン、`/admin/settings` で稼働台数・時間枠・開催日を設定して枠を生成。

## 技術構成

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma 7 (driver adapter方式) + SQLite（開発時は `better-sqlite3` アダプタ）
- 管理者認証: 環境変数のパスワード + 署名付きJWTセッションCookie

## セットアップ

```bash
npm install
npx prisma migrate deploy   # 初回のみ（DBスキーマ作成）
npm run dev
```

`http://localhost:3000` で起動します（ポートが使用中の場合は自動で別ポートになります）。

### 環境変数

`.env.example` を `.env` にコピーして値を設定してください。

| 変数名 | 説明 |
| --- | --- |
| `DATABASE_URL` | DB接続文字列（開発時は `file:./dev.db`） |
| `ADMIN_PASSWORD` | 管理画面 (`/admin`) のログインパスワード |
| `AUTH_SECRET` | 管理セッションCookie署名用の秘密鍵。`openssl rand -hex 32` などで生成 |

### 初期設定の流れ（イベント準備時）

1. `/admin/login` で管理者パスワードでログイン
2. `/admin/settings` で稼働台数・1枠の長さ・営業時間・開催日（例: `2026-09-12,2026-09-13`）を入力し「設定を保存」
3. 「枠を生成」を押すと、開催日ごとに時間枠が自動作成される（既に枠がある日付はスキップされる）
4. 当日は `/admin` で予約一覧を確認し、来場者の受付時に「チェックイン」を押す
5. 機材トラブル等で台数が減った場合は `/admin/settings` の個別枠編集で該当時間帯の定員を減らす・枠を閉じる

## デプロイ（Vercel + Postgres）

このアプリは開発時 SQLite（ファイルDB）を使っていますが、Vercelのようなサーバーレス環境ではファイルが永続化されないため、**本番ではPostgresへの切り替えが必須**です。また Prisma 7 はDBごとに専用の「ドライバーアダプタ」を使うため、以下の切り替え作業が必要です。

1. Vercelにデプロイ後、プロジェクトの Storage タブから Postgres を追加する（Neon/Supabase等の無料枠でも可）
2. `prisma/schema.prisma` の `datasource` を `provider = "postgresql"` に変更
3. Postgres用ドライバーアダプタを追加

   ```bash
   npm install pg @prisma/adapter-pg
   ```

4. `src/lib/db.ts` の `PrismaBetterSqlite3` を `PrismaPg` に差し替える

   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   ```

5. ローカルで `npx prisma migrate dev` を実行し直してPostgres用のマイグレーションを再生成し、コミットする
6. Vercelの環境変数に `DATABASE_URL`（Postgres接続文字列）・`ADMIN_PASSWORD`・`AUTH_SECRET` を設定してデプロイ

## 検証済みの動作

- 予約作成時の定員チェック（同時予約による超過なし）はDBトランザクションで保護されています
- 予約キャンセル時は該当枠の予約数が正しく戻ります
- 管理画面 (`/admin/*`, `/api/admin/*`) は未ログイン時に自動的にログイン画面へリダイレクト／401を返します

## 既知の注意点

- `middleware.ts` は Next.js 16 で非推奨表示が出ますが（`proxy.ts` への移行案内）、現時点では動作に問題ありません。
