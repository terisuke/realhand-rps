# RealHand RPS - AI心理戦じゃんけん

カメラで手を認識し、AIと心理戦を繰り広げるじゃんけんアプリ。AIの読みを出し抜け。

## Features

- 手検出: MediaPipe Hands によるリアルタイム手形状認識
- AI予測: 複数予測アルゴリズム（頻度・マルコフ・パターン・ランダム）の組み合わせ
- 事前コミット: AIが手を出す前にコミットハッシュで手を封印、後出しなし
- 動的フェーズ: 序盤/中盤/終盤でAI戦略が変化
- AI性格: 複数のAI性格タイプによる多様なプレイスタイル

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Hand Detection | MediaPipe Hands |
| Testing | Jest, Playwright |
| Architecture | DDD (Domain-Driven Design) |

## Architecture

```
src/
  domain/         # ビジネスロジック（純粋関数・値オブジェクト）
    game/         # ラウンド・フェーズ・セッションレポート
    ai/           # 予測器・メタ戦略・AI性格
    input/        # ジェスチャー分類
  application/    # ユースケース・スキーマ
    use-cases/    # start-round, submit-move, generate-report
  infrastructure/ # 外部依存（暗号化ハッシュ等）
  app/            # Next.js App Router（ページ・APIルート）
  components/     # UIコンポーネント
```

## Getting Started

```bash
npm install
npm run dev
```

`http://localhost:3000` をブラウザで開く。

## Test Commands

```bash
npm test                  # 単体テスト
npm run test:coverage     # カバレッジレポート
npm run test:e2e          # E2Eテスト (Playwright)
```
