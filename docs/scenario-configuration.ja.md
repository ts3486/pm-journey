# シナリオ設定ガイド

このドキュメントは、pm-journey におけるシナリオ設定（エージェントのキャラクター/トーン、初期メッセージ、完了条件、シナリオのメタデータ）について説明します。

## 概要

シナリオは pm-journey の学習単位の中核です。各シナリオは、AI によるガイダンス付きで実際の PM/PMO の状況をシミュレーションします。設定は複数のファイルに分割されています。

| 項目 | 場所 |
|--------|----------|
| シナリオ定義 | `frontend/src/config/scenarios.ts` |
| エージェントプロファイル（トーン/キャラクター） | `frontend/src/config/agentProfiles.ts` |
| 型定義 | `frontend/src/types/session.ts` |
| システムプロンプトの合成 | `frontend/app/api/agent/route.ts` |
| ミッション完了検出 | `frontend/app/api/mission-detect/route.ts` |

---

## 1. シナリオ定義

**ファイル:** `frontend/src/config/scenarios.ts`

各シナリオは以下の構造を持つオブジェクトとして定義されます。

```typescript
{
  id: string;                    // 一意の識別子 (例: "basic-intro-alignment")
  title: string;                 // 表示タイトル
  description: string;           // カタログに表示される短い説明
  discipline: "BASIC" | "CHALLENGE";  // エージェントプロファイルを決定
  product: ProductInfo;          // シナリオの文脈/メタデータ
  mode: "guided" | "freeform";   // シナリオのモード
  kickoffPrompt: string;         // エージェントへの初期指示
  evaluationCriteria: EvaluationCategory[];  // 採点ルーブリック
  passingScore: number;          // 合格最低点 (例: 70)
  missions: Mission[];           // ユーザーが達成すべきタスク
  supplementalInfo?: string;     // 追加のガイダンス
}
```

### 現在のシナリオ

| ID | タイトル | 難易度 |
|----|-------|------------|
| `basic-intro-alignment` | 自己紹介＆期待値合わせ | BASIC |
| `basic-ticket-refine` | チケット要件整理 | BASIC |
| `basic-testcase-design` | テストケース作成 | BASIC |
| `challenge-project-rescue` | 遅延プロジェクト立て直し | CHALLENGE |
| `challenge-scope-negotiation` | スコープ／リソース交渉 | CHALLENGE |
| `challenge-conflict-mediation` | コンフリクト調整 | CHALLENGE |

---

## 2. エージェントのキャラクターとトーン

**ファイル:** `frontend/src/config/agentProfiles.ts`

エージェントのキャラクターとトーンは、シナリオの `discipline` フィールドによって決定されます。3つのプロファイルがあります。

### BASIC プロファイル
`discipline: "BASIC"` のシナリオで使用されます。

```typescript
{
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたは基礎シナリオのPMメンターです。短時間で論点整理を手伝い、次の一手を具体的に示してください。敬意を持ちつつ、簡潔に。"
}
```

**キャラクター:** 論点整理を素早く手伝い、具体的な次の一手を示すサポート型 PM メンター。

### CHALLENGE プロファイル
`discipline: "CHALLENGE"` のシナリオで使用されます。

```typescript
{
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたはチャレンジシナリオのPM/PMOアドバイザーです。難易度の高い状況で、交渉・リスク判断・意思決定を支援します。前提を確認し、根拠を添えて提案してください。"
}
```

**キャラクター:** 高難度状況で交渉・リスク判断・意思決定を支援する PM/PMO アドバイザー。

### DEFAULT プロファイル
シナリオの `discipline` が不明な場合のフォールバック。

```typescript
{
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたはPMとしてユーザーと対話し、要件・リスク・次アクションを整理します。簡潔で具体的に、敬語で回答してください。"
}
```

### プロファイルの解決方法

`resolveAgentProfile(scenarioId)` は次の順に判定します。
1. シナリオ ID で検索
2. `discipline` を確認
3. BASIC / CHALLENGE / DEFAULT のいずれかを返却

**エージェントのトーンを変更するには:** `agentProfiles.ts` の `systemPrompt` を編集します。

---

## 3. 初期メッセージ（Kickoff Prompt）

**ファイル:** `frontend/src/config/scenarios.ts`（シナリオごと）

最初のメッセージコンテキストは、各シナリオの `kickoffPrompt` から取得します。これはユーザーに直接表示されず、AI へ送るシステム指示に含まれます。

### 例: Kickoff Prompts

**basic-intro-alignment:**
```
あなたは新規PJに参加するPM/PMOとして、初回ミーティングで役割と期待値を揃えます。短時間で目的・進め方・次アクションを決めてください。
```

**challenge-project-rescue:**
```
あなたは遅延しているプロジェクトのPM/PMOです。遅延要因を整理し、スコープ再交渉とリカバリ計画をまとめてください。
```

### システムプロンプトの合成方法

**ファイル:** `frontend/app/api/agent/route.ts`（34-36行目）

Gemini に送られる最終システム指示は、以下3つの要素を結合したものです。

```typescript
const mergedSystem = [
  profile.systemPrompt,    // 1. エージェントのキャラクター/トーン (agentProfiles.ts)
  scenarioPrompt,          // 2. Kickoff prompt (シナリオ定義)
  userPrompt               // 3. 追加のユーザー文脈 (任意)
].filter(Boolean).join("\n\n");
```

この結合プロンプトにより、AI は「人格」と「シナリオ文脈」の両方を得ます。

---

## 4. 完了条件（Missions）

### Mission 定義

**ファイル:** `frontend/src/config/scenarios.ts`

各シナリオは 3 つのミッションを定義します。

```typescript
missions: [
  { id: "basic-intro-m1", title: "自己紹介と役割・責任範囲の確認", order: 1 },
  { id: "basic-intro-m2", title: "成功条件と優先度の合意", order: 2 },
  { id: "basic-intro-m3", title: "次アクションと連絡リズムの設定", order: 3 },
]
```

### Mission 構造

```typescript
type Mission = {
  id: string;           // 一意の識別子
  title: string;        // ユーザーが達成すべきこと
  description?: string; // 任意の詳細説明
  order: number;        // 表示/実行順
}
```

### Mission 完了検出

**ファイル:** `frontend/app/api/mission-detect/route.ts`

ミッションの完了は AI 評価（Gemini 1.5 Flash）で判定されます。

1. システムがミッション一覧と最近の会話を AI に送信
2. AI がどのミッションが明確に達成されたかを分析
3. `{ completedMissionIds: ["mission-id-1", "mission-id-2"] }` を返却

**ミッション検出のシステムプロンプト:**
```
You are a strict evaluator. Identify which missions are clearly completed based on the conversation. Only mark a mission complete when the user has explicitly covered the goal; if uncertain, omit it. Return JSON only with this exact shape: {"completedMissionIds": ["..."]}.
```

### シナリオ完了

すべてのミッションが完了と判定された時点でシナリオ完了になります。UI の「Complete Scenario」ボタンは、全ミッションのチェックが入った時のみ有効になります。

---

## 5. シナリオ情報（Product メタデータ）

**ファイル:** `frontend/src/config/scenarios.ts`

各シナリオは `product` フィールドに詳細な文脈を持ちます。

```typescript
product: {
  name: string;              // プロダクト/セッション名
  summary: string;           // 簡潔な説明
  audience: string;          // 対象ステークホルダー
  problems: string[];        // 解決したい課題
  goals: string[];           // セッションの目的
  differentiators: string[]; // 独自性
  scope: string[];           // スコープ範囲
  constraints: string[];     // 制約
  timeline: string;          // 時間軸
  successCriteria: string[]; // 成功指標
  uniqueEdge?: string;       // 学習の焦点
  techStack?: string[];      // 技術文脈（任意）
  coreFeatures?: string[];   // 主要機能（任意）
}
```

### Product 情報の例

```typescript
product: {
  name: "オンボーディングワークショップ",
  summary: "ステークホルダーと目的・役割・進め方を合意する初回ミーティング。",
  audience: "プロダクトオーナー、開発リーダー、QA",
  problems: ["役割が不明瞭", "優先度の解像度が低い"],
  goals: ["役割・責任の明確化", "初期コミュニケーション計画の合意"],
  differentiators: ["シンプルな準備リスト", "会話テンプレート"],
  scope: ["自己紹介", "目的確認", "進め方合意"],
  constraints: ["30分タイムボックス", "参加者3名想定"],
  timeline: "初回ミーティング当日",
  successCriteria: ["期待値の一致が確認できる", "次アクションが2件以上決定"],
  uniqueEdge: "短時間で役割と進め方を固める練習に特化",
  techStack: ["Next.js", "Tailwind CSS", "Axum"],
  coreFeatures: ["メモ", "アクション記録"],
}
```

---

## 6. 評価基準（Evaluation Criteria）

すべてのシナリオは 4 つの評価カテゴリ（各25%）を共有します。

```typescript
const evaluationCriteria = [
  { name: "方針提示とリード力", weight: 25 },
  { name: "計画と実行可能性", weight: 25 },
  { name: "コラボレーションとフィードバック", weight: 25 },
  { name: "リスク/前提管理と改善姿勢", weight: 25 },
];
```

`passingScore`（通常 70）が合否の基準になります。

---

## 6.1 シナリオ評価（スコアリング）ロジック

**ファイル:** `frontend/src/services/sessions.ts` → `createEvaluation()`

現在の評価はクライアント側の簡易ロジックで生成されています（AI評価ではありません）。
採点は以下の流れで決まります。

1. **評価基準の決定**
   - `scenario.evaluationCriteria` があればそれを使用
   - ない場合はデフォルトの4項目（各25%）

2. **カテゴリ別スコアの生成**
   - 基準点 `baseScore = 75`
   - 各カテゴリのスコアは `baseScore + delta` で計算
     - `delta = (idxが偶数 ? +5 : -2) + ランダム(-3〜+2)`
   - スコアは **60〜95** にクランプ

3. **フィードバック生成**
   - `supplementalInfo` があり、かつ最初のカテゴリの場合のみ専用コメント
   - それ以外は共通テンプレの改善コメント

4. **総合スコア**
   - 各カテゴリのスコアを **weight(%)** で加重平均し、四捨五入

5. **合否**
   - 現状 `passing: true` が固定（`passingScore` とは未連動）

> Note: `passingScore` はシナリオ側で設定されていますが、現行の評価ロジックでは参照されていません。

---

## 7. 新しいシナリオを追加する

1. **`frontend/src/config/scenarios.ts` にシナリオを追加**
   - 一意の `id` を決める
   - `discipline` を "BASIC" または "CHALLENGE" に設定
   - `kickoffPrompt` にシナリオ文脈を記述
   - 3つの `missions` を定義
   - `product` メタデータを記入

2. **必要なら新しいエージェントプロファイルを追加**
   - 新しいトーン/キャラクターが必要なら `agentProfiles.ts` に追加
   - `resolveAgentProfile()` を更新して参照させる

3. **バックエンド同期（APIを使う場合）**
   - `backend/src/models/mod.rs` の `default_scenarios()` に反映

---

## 8. 設定クイックリファレンス

| 変更内容 | 場所 |
|----------------|-------|
| シナリオの追加/編集 | `frontend/src/config/scenarios.ts` |
| エージェントのトーン/キャラクター変更 | `frontend/src/config/agentProfiles.ts` → `systemPrompt` |
| 初期シナリオ文脈の変更 | `frontend/src/config/scenarios.ts` → `kickoffPrompt` |
| 完了タスクの追加/編集 | `frontend/src/config/scenarios.ts` → `missions` |
| 評価ルーブリックの変更 | `frontend/src/config/scenarios.ts` → `evaluationCriteria` |
| 合格基準の変更 | `frontend/src/config/scenarios.ts` → `passingScore` |
| 補足ガイダンスの追加 | `frontend/src/config/scenarios.ts` → `supplementalInfo` |
