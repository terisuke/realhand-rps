# 要件定義書：RealHand RPS — AI Psychological Battle

**プロジェクト名（仮）：** RealHand RPS - AI Psychological Battle
**バージョン：** 1.0（MVP）
**作成日：** 2026年3月

---

## 1. プロジェクト概要

### コンセプト
「自分の手をリアルタイムでカメラにかざして出す」体験型じゃんけん。  
AIは過去の癖・心理バイアス・メタ戦略で予測し、勝率 60% 以上を安定維持。  
30戦達成で「あなたの癖丸裸レポート」を自動生成し、中毒性を爆上げ。

### ターゲット
じゃんけん好き・AI 対戦好き・SNS 映え狙いの 20〜40 代。

### 成功指標

| 指標 | 目標値 |
|---|---|
| 30 戦後の人間平均勝率 | ≤ 40%（AI 勝率 60% 以上） |
| カメラモード利用率 | 70% 以上 |
| レポート閲覧率 | 85% 以上 |

---

## 2. 必須要件（MVP で必ず実装）

### 2-1. コア機能

#### カメラ手検知モード（デフォルト）
- `@mediapipe/tasks-vision` Hand Landmarker でリアルタイム検知
- 手が **1 秒以上安定**したら「出した」と判定（後出し防止）
- 判定精度 99% 以上（照明普通・片手の場合）

#### ボタン選択モード（フォールバック）
- カメラ拒否時やモバイル非対応時に即切り替え

#### AI 対戦
- プレイヤー手検知後、即座に**サーバー側**で AI 決定（イカサマ完全防止）
- AI 勝率目標：30 戦で 65〜72%

#### 心理戦演出
- AI 思考吹き出し（毎回ランダム表示）
- 例：「あなたは負けた後にチョキに変えやすいですね…」

#### 30 戦達成レポート
- 自動ポップアップ
- 癖ランキング（グー率、負け後変更率など）
- AI が最もよく読んだパターン
- 勝率推移グラフ（Recharts）

### 2-2. 非機能要件

| 項目 | 要件 |
|---|---|
| イカサマ防止 | AI ロジックは全サーバー実行。クライアントには予測スコアすら渡さない |
| プライバシー | 映像はブラウザ内処理のみ。サーバーに 1 フレームも送信しない |
| 対応環境 | Chrome / Edge / Safari 最新版（モバイル含む）。PWA 対応 |
| 検知 FPS | ≥ 30 |
| AI 応答 | ≤ 300ms |
| データ永続化 | セッション ID（cookie）で戦歴保存（Supabase） |

---

## 3. AI ロジック詳細（勝率の肝）

### 基盤：Iocaine Powder 方式
複数予測器のメタ評価によりリアルタイムで最強手を選択。

### 予測器リスト（優先度順）

| 予測器 | 説明 |
|---|---|
| `FrequencyPredictor` | 全体 / 直近 10 手の出手頻度から予測 |
| `MarkovPredictor` | 1 手前・2 手前の遷移確率から予測 |
| `PsychPredictor` | 日本人特有心理バイアス（初手グー 45%、負け後変更 78% 等） |
| `StreakPredictor` | 連勝 / 連敗時の行動変化を予測 |

### メタ評価
各予測器の過去的中率を動的に重み付けし、最もスコアの高い予測を採用。

### 思考コメント生成
スコア上位予測器の根拠を自然言語化して吹き出しに表示。

---

## 4. 技術スタック

| レイヤー | 採用技術 |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| カメラ検知 | `@mediapipe/tasks-vision`（Hand Landmarker） |
| アニメーション | Framer Motion + Lottie（AI の手アニメ） |
| Backend | Next.js Route Handler（`/api/play`） |
| DB | Supabase Postgres |
| デプロイ | Vercel（Edge Functions 対応） |
| グラフ | Recharts |

---

## 5. システムアーキテクチャ

```
ユーザー ←→ [Next.js Frontend (CameraRPS.tsx)]
               ↓ POST /api/play（player_move のみ送信）
[Route Handler /api/play] ←→ [JankenAI クラス (lib/janken-ai.ts)]
               ↓
Supabase（戦歴保存）
```

> **重要：** AI の決定はプレイヤー手を受け取ってから実行するため、後出しが物理的に不可能。

---

## 6. データモデル（Supabase）

```sql
CREATE TABLE matches (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text        NOT NULL,
  player_move text       NOT NULL CHECK (player_move IN ('rock','paper','scissors')),
  ai_move    text        NOT NULL CHECK (ai_move    IN ('rock','paper','scissors')),
  result     text        NOT NULL CHECK (result     IN ('win','lose','draw')),
  round      integer     NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_matches_session ON matches(session_id);
```

---

## 7. UI / UX 要件

### 画面構成
- 中央：カメラ映像（またはボタン選択）＋ AI の手アニメ＋思考吹き出し
- 右上：カメラ / ボタン切り替えトグル
- ヘッダー：戦績カウンター（例：現在 15 / 30 戦）

### 30 戦達成レポート画面
- 円グラフ：手の分布（グー / チョキ / パー）
- 折れ線グラフ：ラウンドごとの勝率推移
- テキスト解説：AI による癖の言語化
- シェアボタン（X / コピー）

---

## 8. 参考リポジトリ

### カメラ検知・判定ロジック
- [hand-gesture-whiteboard](https://github.com/Cygra/hand-gesture-whiteboard) — Next.js + @mediapipe/tasks-vision の実例
- [hand-gesture-recognition-using-mediapipe-in-react](https://github.com/TomasGonzalez/hand-gesture-recognition-using-mediapipe-in-react) — React/Next.js 移植版
- [Rock-Paper-Scissors-Machine](https://github.com/kairess/Rock-Paper-Scissors-Machine) — MediaPipe Hands で RPS 判定（指位置ルールの参考）
- [MediaPipe Hand Landmarker 公式](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)

### AI 心理戦ロジック
- [RockPaperScissors_AI](https://github.com/NavjotMinhas/RockPaperScissors_AI) — Iocaine Powder の Java 実装
- [iocane](https://github.com/jacdebug/iocane) — Iocaine の JavaScript 完全移植（TypeScript 変換して使用）
- [rock-paper-scissors-webapp](https://github.com/detrin/rock-paper-scissors-webapp) — メタ戦略 AI の Web アプリ版

---

## 9. 実装優先順位・スケジュール（総 8 時間想定）

| ステップ | 内容 | 目安 |
|---|---|---|
| 1 | Next.js 16 + Supabase 基盤 | 1h |
| 2 | ボタン版じゃんけん + AI 基本 | 2h |
| 3 | MediaPipe カメラ検知 + 判定 | 2h |
| 4 | Iocaine メタ AI 実装 | 2h |
| 5 | 思考吹き出し + 30 戦レポート | 1h |
| 6 | Vercel デプロイ | 即時 |

---

## 10. 今後の拡張（MVP 後 1 週間以内）

- 全国ランキング
- Nightmare モード（メタ深め）
- LLM で思考コメントをさらに辛辣に
- 友達と同時対戦（同じ AI で勝負）

---

## ディレクトリ構成

```
realhand-rps/
├── docs/
│   └── requirements.md          # 本ファイル
├── src/
│   ├── app/
│   │   ├── page.tsx              # メインゲーム画面
│   │   ├── layout.tsx
│   │   └── api/
│   │       └── play/
│   │           └── route.ts     # AI 決定 Route Handler
│   ├── components/
│   │   ├── CameraRPS.tsx         # カメラ手検知コンポーネント
│   │   ├── ButtonRPS.tsx         # ボタン選択フォールバック
│   │   ├── AiThoughtBubble.tsx   # 思考吹き出し
│   │   ├── GameResult.tsx        # 勝敗表示
│   │   └── ReportModal.tsx       # 30 戦達成レポート
│   ├── lib/
│   │   ├── janken-ai.ts          # JankenAI クラス（予測器群）
│   │   ├── supabase.ts           # Supabase クライアント
│   │   └── gesture.ts           # MediaPipe 判定ロジック
│   └── types/
│       └── index.ts             # 共通型定義
├── public/
└── package.json
```
