# Scenario Enhancement Plan: Polishing Existing Scenarios with Claude PM Course Concepts

## Purpose

This document plans how to **enhance the 16 existing pm-journey scenarios** by incorporating techniques from the [Claude Code PM Course](https://ccforpms.com/). The priority is keeping pm-journey's existing style (Japanese, deliverable-focused, support-assistant model) while borrowing the course's pedagogical depth: Socratic questioning, structured frameworks, progressive hints, and richer context.

It also proposes **new scenarios** for gaps the course highlights (PRD writing, data analysis, product strategy) — adapted to the existing 保険金請求サポートサービス product context.

---

## Part 1: Enhancements to Existing Scenarios

### Category A: Soft Skills (基礎ソフトスキル)

#### A1. `basic-intro-alignment` — 自己紹介

**Current state**: Simple free-text self-introduction. 2 evaluation criteria (clarity 50%, completeness 50%). Minimal guidance.

**Enhancements from course**:
- **Add progressive hints** (course's guided learning pattern). Currently the user gets no hints about what a strong intro looks like.
- **Add audience-awareness** (course Module 1.3 teaches audience-specific communication — the same message formatted differently for Slack, email, docs).

**Proposed changes**:
```
hints:
  1. "PMとしての自己紹介では、役割だけでなく「自分がチームにどう貢献するか」を伝えると信頼を得やすくなります。"
  2. "具体的な経験や得意分野を1つ挙げると、チームメンバーがあなたに何を相談できるかイメージしやすくなります。"
  3. "例: 「前職でECサイトのPMをしていました。要件整理とステークホルダー調整が得意です。まずはプロダクトの現状を理解するところから始めたいです。」"

missions: (expand from 1 to 3)
  1. "自分の役割と経験を伝える" (order: 1)
  2. "チームへの貢献方針を示す" (order: 2)
  3. "最初に取り組みたいことを述べる" (order: 3)

evaluationCriteria: (expand from 2 to 4)
  - intro-role-clarity (25%): 役割の明確さ — 自分の役割と経験が具体的に伝わるか
  - intro-contribution (25%): 貢献方針 — チームにどう貢献するかが伝わるか
  - intro-first-step (25%): 初動の具体性 — 最初に何をするかが明確か
  - intro-tone (25%): トーンと簡潔さ — チームに親しみやすく、かつ簡潔か
```

---

#### A2. `basic-product-understanding` — プロダクト理解 (NEW)

**Concept**: The user is a PM newly joining the 保険金請求サポートサービス project. They must read/absorb the product context (which is globally set as `default_product`) and demonstrate understanding by producing a structured summary. The agent acts as a supportive onboarding guide — answering questions, clarifying ambiguities, and prompting the user to think deeper about the product's positioning, users, and challenges.

Inspired by the Claude PM Course's Module 1.1 (Welcome to TaskFlow) where learners first absorb the fictional company's context — personas, product details, competitive positioning — before doing any PM work. This scenario serves the same purpose: **ensuring the user understands the product before tackling harder scenarios**.

```
id: "basic-product-understanding"
title: "プロダクト理解"
discipline: "BASIC"
scenarioType: "basic"
description: "新しくプロジェクトに参加したPMとして、保険金請求サポートサービスのプロダクト概要を理解し、自分の言葉で整理する。"
mode: "guided"
assistanceMode: "guided"
passingScore: 60

task:
  instruction: |
    あなたは保険金請求サポートサービスのPMとして新しくプロジェクトに参加しました。
    プロダクトの概要を理解し、以下の観点で自分の言葉で整理してください。
    わからないことがあれば、遠慮なく質問してください。
  deliverableFormat: "structured"
  template:
    format: "structured"
    sections:
      - "プロダクト概要（何を、誰に、なぜ提供しているか）"
      - "対象ユーザーと主な課題（3つ）"
      - "現在の主要機能と差別化ポイント"
      - "自分が最初に深掘りしたいポイントと理由"
  referenceInfo: |
    プロダクト情報は会話の中でエージェントに質問して確認してください。
    以下はプロジェクトの概要です：

    ■ プロダクト名: 保険金請求サポートサービス
    ■ 概要: ユーザーが保険商品を購入し、後から証跡を提出して保険金を受け取れる請求体験を提供するサービス
    ■ 対象ユーザー: 個人契約者、小規模事業者、保険金請求を担当する運用チーム

    ■ ユーザーが抱える課題:
    - 保険金請求に必要な証跡が分かりづらく、提出漏れが発生する
    - 差し戻し理由が不明確で、再提出の手間と時間が増える
    - 請求ステータスが見えづらく、問い合わせ対応コストが高い

    ■ プロダクトの目標:
    - ユーザーが迷わず保険金請求を完了できる体験を提供する
    - 提出から支払いまでのリードタイムを短縮する
    - 差し戻し率を下げ、初回提出での受理率を高める

    ■ 差別化ポイント:
    - 必要書類をステップ形式で案内し、提出漏れを防ぐ
    - 不足証跡を自動で検知し、再提出を最小化する
    - 請求進捗をリアルタイムで可視化し、ユーザー不安を軽減する

    ■ 主要機能: 保険商品購入、証跡アップロード、請求ステータス管理、審査・承認ワークフロー
    ■ 技術スタック: Next.js, Tailwind CSS, Axum, PostgreSQL, Redis
    ■ 制約: 個人情報・証跡データの安全な取り扱い必須、監査対応のため履歴保持、MVPから段階的拡張
    ■ タイムライン: 今四半期にMVP、次四半期に運用最適化機能を追加
    ■ 成功指標: 請求完了率の向上、差し戻し率の低下、初回支払いまでの日数短縮

behavior:
  userLed: false
  allowProactive: true
  maxQuestions: 2
  responseStyle: "guide_lightly"
  forbidRolePlay: true

kickoffPrompt: |
  お疲れ様です！保険金請求サポートサービスのプロジェクトへようこそ。
  まずはプロダクトの全体像を掴んでいただきたいと思います。
  プロダクトについて気になることがあれば何でも聞いてください。理解できたら、自分の言葉でプロダクトの概要を整理してみてください。

missions:
  1. "プロダクトの目的と対象ユーザーを自分の言葉で説明する" (order: 1)
  2. "ユーザーの課題とプロダクトの解決策を対応づけて整理する" (order: 2)
  3. "自分がPMとして最初に深掘りしたいポイントを述べる" (order: 3)

supplementalInfo: |
  プロダクトを理解する際は、以下の観点で考えてみましょう：

  【ユーザー視点】
  - このプロダクトを使うのはどんな人ですか？
  - その人たちは今、何に困っていますか？
  - このプロダクトがなかったら、どうやって解決していますか？

  【ビジネス視点】
  - なぜ今このプロダクトを作っているのですか？
  - 競合や代替手段と比べて、何が違いますか？
  - 成功をどう測りますか？

  【PM視点】
  - 最も不確実性が高い部分はどこですか？
  - 自分がPMとして最初に確認すべきことは何ですか？
  - プロダクトのどの部分に最もインパクトを出せそうですか？

hints:
  1. "プロダクト概要を書く際は「何を → 誰に → なぜ」の順で整理すると伝わりやすくなります。"
  2. "課題と機能を1対1で対応づけてみましょう。例: 「証跡が分かりづらい → ステップ形式のガイドで案内」"
  3. "「最初に深掘りしたいポイント」は正解がありません。ただし「なぜそこを深掘りしたいか」の理由を書くと、PM としての思考が伝わります。例: 「差し戻し率30%の内訳を知りたい。原因が証跡の種類間違いなのか品質不足なのかで打ち手が変わるため。」"

evaluationCriteria:
  - product-overview (25%): プロダクト概要の正確さ — 何を、誰に、なぜ提供しているかが正確に述べられているか
  - product-user-problem (25%): 課題と解決策の対応づけ — ユーザー課題とプロダクト機能が論理的に結びついているか
  - product-differentiation (25%): 差別化の理解 — 競合や代替手段と比較した優位性を理解しているか
  - product-pm-perspective (25%): PMとしての着眼点 — 深掘りポイントの選定理由が具体的で、PMとしての思考が示されているか
```

---

#### A3. `basic-schedule-share` — ミーティング調整

**Current state**: Free-text meeting coordination message. 2 evaluation criteria. Template checklist exists (目的, 議題, 日時候補, 参加者) but no structured guidance.

**Enhancements from course**:
- **Add Socratic pre-questions** (course Module 2.1 technique). Before writing, the user should think about: Who needs to attend? What decision needs to be made? What pre-read is needed?
- **Add audience-specific output** (course Module 1.3). The same meeting invite looks different for executives vs engineers.

**Proposed changes**:
```
supplementalInfo: (enrich with Socratic prompts)
  "メッセージを書く前に、以下を考えてみましょう：
  - このミーティングで何を決定・合意する必要がありますか？
  - 必須参加者は誰ですか？任意参加者は？
  - 参加者が事前に読むべき資料はありますか？
  - ミーティングのゴール（終了条件）は何ですか？"

hints:
  1. "ミーティングの目的は「情報共有」か「意思決定」かを明確にしましょう。"
  2. "参加者を「必須」と「任意」に分けると、相手の判断がしやすくなります。"
  3. "例: 「【目的】証跡提出フローの要件詰め 【議題】①必須項目の確定 ②エラーハンドリング方針 【日時候補】...」"

evaluationCriteria: (expand from 2 to 4)
  - schedule-purpose (25%): 目的の明確さ — ミーティングの目的と終了条件が明確か
  - schedule-agenda (25%): 議題の具体性 — 議題が具体的で時間配分を想像できるか
  - schedule-participants (25%): 参加者の適切さ — 必要な参加者が過不足なく含まれているか
  - schedule-logistics (25%): 実務的な配慮 — 日時候補、所要時間、事前準備の案内があるか
```

---

#### A4. `basic-meeting-minutes` — 議事メモの作成と共有

**Current state**: Structured deliverable (決定事項, 未決事項, 次のアクション). 2 criteria. Minimal guidance.

**Enhancements from course**:
- **Add action-item rigor** (course Module 1.3 emphasizes each action item must have 担当・期限).
- **Add progressive template** to show what "good" looks like.

**Proposed changes**:
```
template sections: (enrich)
  - "日時・参加者"
  - "決定事項（背景・理由付き）"
  - "未決事項（確認先・期限）"
  - "次のアクション（担当・期限・完了条件）"

hints:
  1. "決定事項には「なぜその決定に至ったか」の背景も1行加えると、後から見返した時に文脈がわかります。"
  2. "未決事項には「誰に確認するか」と「いつまでに」を必ずセットで書きましょう。"
  3. "例: 「【決定】証跡アップロードはPDF・JPEG・PNGに限定（理由: 初期はファイル検証コストを抑えるため） 【次アクション】佐藤: バリデーション仕様書を作成（期限: 2/21）」"

evaluationCriteria: (expand from 2 to 4)
  - minutes-decisions (25%): 決定事項の明確さ — 何が決まったか、なぜ決まったかが記載されているか
  - minutes-open-items (25%): 未決事項の追跡可能性 — 未決事項に確認先と期限が付いているか
  - minutes-actions (25%): アクションの実行可能性 — 担当・期限・完了条件が明確か
  - minutes-readability (25%): 読みやすさ — 非参加者が読んでも理解できる構成か
```

---

### Category B: Test Cases (テストケース作成)

#### B1-B3. `test-login` / `test-form` / `test-file-upload`

**Current state**: Well-structured with 3 missions, 4 evaluation criteria, spec-based referenceInfo, guided behavior. Already the strongest category.

**Enhancements from course**:
- **Add risk-based prioritization** (course Module 2.2 data analysis teaches "never stop at topline — always segment"). Apply this to test cases: prioritize by risk/impact, not just enumerate.
- **Add "what would you test first?" mission** to force prioritization thinking.

**Proposed changes (apply to all 3)**:
```
missions: (add 4th mission)
  4. "テストケースに優先順位をつけ、最初に実行すべき3件を選定する" (order: 4)

hints: (add to all 3)
  1. "正常系を列挙したら、「ユーザーが最も頻繁にたどるパス」を特定しましょう。"
  2. "異常系は「発生確率×影響度」で優先順位をつけると、限られたテスト時間で最大のカバレッジが得られます。"
  3. "前提条件は「このテストを実行するために何が準備されている必要があるか」を明確にしましょう。"

evaluationCriteria: (add 5th criterion to each)
  - [existing 4 criteria, each reduced to 20% weight]
  - test-prioritization (20%): テスト優先順位 — リスクと影響度に基づいた優先順位付けができているか
```

---

### Category C: Requirement Definition (要件定義)

#### C1. `basic-requirement-definition-doc` — ログイン機能

**Current state**: Dialogue-based requirement definition with advisor behavior. 1 mission. 4 evaluation criteria.

**Enhancements from course**:
- **Embed Socratic questioning framework** (course Module 2.1). The current scenario asks the user to define requirements, but doesn't guide _how_ to think through them.
- **Add "why this solution?" challenge** (course's devil's advocate pattern, lightweight version).

**Proposed changes**:
```
supplementalInfo: (enrich with Socratic framework)
  "要件定義を進める際は、以下の観点で考えてみましょう：

  【問題の明確化】
  - 「ログインできない」とは具体的にどの状態を指しますか？
  - 最も影響を受けているユーザーセグメントは？
  - 何もしない場合のビジネスインパクトは？

  【ソリューションの検証】
  - なぜこのアプローチが最適ですか？
  - 他にどんな選択肢がありますか？
  - 最小限のスコープで価値を出すには？

  【成功指標】
  - 何をもって「改善された」と判断しますか？
  - 失敗を示すシグナルは何ですか？"

missions: (expand from 1 to 3)
  1. "問題の影響範囲と対象ユーザーを明確にする" (order: 1)
  2. "受入条件を検証可能な形で定義する" (order: 2)
  3. "スコープ外と不明点を明示する" (order: 3)

hints:
  1. "「ログインできない」には複数のパターンがあります。パスワード忘れ？アカウントロック？メール未確認？まず問題を分解しましょう。"
  2. "受入条件は「〇〇の場合、〇〇が表示される」のように、観測可能な形で書くと検証しやすくなります。"
  3. "例: 「AC1: ユーザーが正しいメール/パスワードを入力した場合、ダッシュボードにリダイレクトされる。AC2: パスワードを5回間違えた場合、15分間ロックされその旨が表示される。」"
```

---

#### C2. `basic-requirement-hearing-plan` — 問い合わせフォーム機能

**Current state**: Dialogue with conflicting stakeholder requirements (CS wants fewer fields, legal wants stricter consent). 3 missions. Good scenario setup.

**Enhancements from course**:
- **Add tradeoff analysis framework** (course Module 2.3 strategic choices). The user needs to explicitly state what they're choosing and what they're giving up.
- **Add structured tradeoff template**.

**Proposed changes**:
```
supplementalInfo: (enrich with tradeoff framework)
  "ステークホルダーの要求が対立する場合は、トレードオフを明示的に整理しましょう：

  【対立の構造化】
  - CSの要求: 何を、なぜ求めているか？
  - 法務の要求: 何を、なぜ求めているか？
  - 両者の共通目的は何か？

  【トレードオフの選択肢】
  - 選択肢A: CSの要求を優先した場合 → 何を得て、何を失うか？
  - 選択肢B: 法務の要求を優先した場合 → 何を得て、何を失うか？
  - 選択肢C: 段階的アプローチ → MVP時点とフル実装時点で分ける

  トレードオフの選択には「判断基準」を明示してください。"

hints:
  1. "対立する要求は「どちらが正しいか」ではなく「どちらを優先するか」の問題です。判断基準を先に決めましょう。"
  2. "段階リリースで対立を解消できることがあります。MVP時点ではCS寄り、次フェーズで法務要件を追加、という方法も検討してみましょう。"
  3. "例: 「MVP: 必須項目を名前・メール・内容の3つに絞る（CS要求対応）。Phase 2: 同意取得フローを追加（法務要件対応）。判断基準: ユーザー離脱率の改善を最優先。」"
```

---

#### C3. `basic-requirement-user-story` — ファイルアップロード機能

**Current state**: Similar dialogue with conflicting stakeholder requirements (sales wants fast release, infra wants size limits). 3 missions.

**Enhancements from course**:
- **Add ROI estimation thinking** (course Module 2.2). When stakeholders conflict on scope, estimating the business impact of each option helps make data-driven decisions.

**Proposed changes**:
```
supplementalInfo: (enrich with impact estimation)
  "要件の優先度を判断する際は、ビジネスインパクトを見積もりましょう：

  【インパクト推定の考え方】
  - 対象ユーザー数 × 現状の行動率 × 期待される改善率 × ユーザー単価
  - 「早期リリース」の場合: 早く出すことで何件の問い合わせ対応を削減できるか？
  - 「サイズ制限厳守」の場合: 制限を緩めた場合のインフラコスト増はいくらか？

  数字が出せない場合でも「大/中/小」の相対評価で判断根拠を示してください。"

hints:
  1. "「早期リリース」と「品質」のトレードオフを議論する前に、「早期」とは具体的にいつまでかを確認しましょう。"
  2. "ファイルサイズ制限は「ユーザー体験」と「インフラコスト」の両面で考えます。典型的なユーザーの添付ファイルサイズを確認しましたか？"
  3. "例: 「MVP: JPEG/PNG/PDFのみ、5MB上限、3ファイルまで（インフラ要件充足）。リリース後にユーザーの実使用データを見て上限を調整（営業要件の段階対応）。」"
```

---

### Category D: Incident Response (障害対応) — Coming Soon

#### D1. `coming-incident-response` — P1障害: ログイン不能バグの緊急対応

**Current state**: Structured deliverable with 4 template sections, 3 missions, challengeBehavior. Good foundation.

**Enhancements from course**:
- **Add structured impact assessment framework** (course Module 2.2 data analysis applied to incident severity).
- **Add communication template** for stakeholder reporting (course Module 1.3 audience-specific communication).

**Proposed changes**:
```
supplementalInfo: (enrich with impact assessment framework)
  "P1障害対応では、以下のフレームワークで影響を評価してください：

  【影響評価の4軸】
  1. 影響範囲: 全ユーザー / 一部ユーザー / 特定セグメント
  2. ビジネスインパクト: 売上損失 / 契約更新リスク / レピュテーション
  3. 復旧見込み: 分単位 / 時間単位 / 日単位
  4. 代替手段: あり / なし / 暫定策可能

  【初回報告のテンプレート】
  件名: [P1] [影響概要] - [ステータス]
  - 事象: 何が起きているか（1文）
  - 影響: 誰に、どの程度影響しているか
  - 現在の対応: 何をしているか
  - 次回報告: いつ、何を報告するか

  終了条件: 影響範囲、初動アクション、連絡先、初回報告文が確定していること。"

hints:
  1. "P1障害の初動では「原因究明」より「影響範囲の確認」と「暫定対応」を優先しましょう。原因は復旧後に調査します。"
  2. "エスカレーション先は「技術判断」と「ビジネス判断」で分けましょう。CTOには技術状況、VP/CSには顧客影響を報告します。"
  3. "初回報告は「わからないこと」も正直に書きましょう。「発生時刻: 調査中（最初のアラート: 14:30）」のように。"
```

---

#### D2. `coming-incident-triage-escalation` — P2障害: 決済遅延バグ

**Current state**: Triage and escalation scenario with 3 missions. Good scenario setup.

**Enhancements from course**:
- **Add data-driven severity classification** (course Module 2.2 segment analysis).

**Proposed changes**:
```
supplementalInfo: (enrich with severity framework)
  "トリアージでは、主観ではなくデータで優先度を判定しましょう：

  【優先度判定マトリクス】
  | 軸 | P1 | P2 | P3 |
  |---|---|---|---|
  | 影響範囲 | 全ユーザー | 一部ユーザー | 特定条件のみ |
  | 業務影響 | 業務停止 | 業務遅延 | 代替手段あり |
  | 復旧緊急度 | 即時 | 24時間以内 | 次スプリント |

  【エスカレーション判断基準】
  - P1: 即時エスカレーション（CTO, VP）
  - P2: 状況報告 + 対応方針を報告（エンジニアリードマネージャー）
  - P3: 次回定例で報告

  終了条件: 重大度、判断根拠、エスカレーション経路、次回報告時刻が確定していること。"

hints:
  1. "「一部ユーザー」の影響範囲を具体的に特定しましょう。何%のユーザーか？特定のプランや地域に偏っているか？"
  2. "P2でも「顧客から問い合わせが来ている場合」はエスカレーションの緊急度が上がります。CS/サポートチームの状況を確認しましょう。"
  3. "報告リズムは「次の報告で何を報告するか」を先に決めると、調査の優先度が明確になります。"
```

---

#### D3. `coming-postmortem-followup` — P3障害: 表示崩れバグの再発防止

**Current state**: Postmortem scenario with 3 missions. Focus on root cause and prevention.

**Enhancements from course**:
- **Add 5 Whys framework** for root cause analysis.
- **Add prevention action quality checklist** (actionable, assigned, time-bound).

**Proposed changes**:
```
supplementalInfo: (enrich with postmortem framework)
  "ポストモーテムでは「誰が悪い」ではなく「プロセスのどこが弱い」に焦点を当てましょう：

  【5 Whys による原因分析】
  1. なぜ表示崩れが発生した？ → CSSの条件分岐が不足
  2. なぜ条件分岐が不足した？ → 対象端末のテストが不十分
  3. なぜテストが不十分だった？ → テスト対象端末リストが古かった
  4. なぜリストが古かった？ → 更新プロセスが定義されていなかった
  5. なぜ定義されていなかった？ → 端末対応方針が未整備

  【再発防止アクションの品質基準】
  各アクションは以下を満たすこと：
  - 具体的（「気をつける」ではなく「チェックリストに追加する」）
  - 担当者が明確
  - 期限が設定されている
  - 完了の検証方法が定義されている

  終了条件: 再発防止アクション（担当/期限）と検証方法が明文化されていること。"

hints:
  1. "「原因」と「事象」を混同しないようにしましょう。「表示崩れした」は事象、「CSSの条件分岐が不足していた」が原因です。"
  2. "暫定対応（今すぐの火消し）と恒久対応（根本解決）を明確に分けましょう。"
  3. "再発防止は「人の注意力」に頼らない仕組みが理想です。例: コードレビューチェックリスト追加、CI/CDにビジュアルリグレッションテスト追加。"
```

---

### Category E: Business Execution (事業推進) — Coming Soon

#### E1. `coming-priority-tradeoff-workshop` — 優先度トレードオフ

**Current state**: Compare 3 release candidates by value/effort/risk. 3 missions.

**Enhancements from course**:
- **Embed RICE/weighted scoring framework** (course Module 2.2 ROI modeling).
- **Add "strategy vs not-strategy" distinction** (course Module 2.3) — goals are not strategy.

**Proposed changes**:
```
supplementalInfo: (enrich with scoring framework)
  "優先度の比較には、定量的なスコアリングを使いましょう：

  【RICE スコアリング】
  - Reach: 何人のユーザーに影響するか（月間）
  - Impact: 1人あたりの改善インパクト（3=大, 2=中, 1=小, 0.5=極小）
  - Confidence: 見積もりの確信度（100%, 80%, 50%）
  - Effort: 必要な人月（エンジニア工数）
  - RICE Score = (Reach × Impact × Confidence) / Effort

  【戦略 vs 目標の区別】
  × 「売上を50%増やす」→ これは目標であり戦略ではない
  ○ 「管理画面改修を優先し、運用効率を上げることでCSコストを削減する」→ トレードオフを含む戦略

  各案の比較後、「なぜこの順序なのか」の判断理由を明示してください。"

hints:
  1. "3案を横並びで比較する前に、「何を最も重視するか」の比較軸を先に決めましょう。"
  2. "「やらない」と決めた案にも理由を書きましょう。将来「なぜやらなかったのか」と聞かれた時の説明責任になります。"
  3. "段階リリースを提案する場合は、各フェーズの「最小出荷可能単位（MSU）」を定義しましょう。"
```

---

#### E2. `coming-stakeholder-negotiation` — ステークホルダー優先度交渉

**Current state**: Sales vs. engineering conflict on release timing. 3 missions.

**Enhancements from course**:
- **Add devil's advocate questioning** (course Module 2.3). After the user proposes a resolution, challenge it.
- **Add negotiation preparation framework**.

**Proposed changes**:
```
supplementalInfo: (enrich with negotiation framework)
  "交渉の前に、以下を整理しましょう：

  【交渉準備チェックリスト】
  □ 各ステークホルダーの「本当の関心事」は何か？（ポジションではなくインタレスト）
  □ 譲れない線（BATNA）は何か？
  □ 共通のゴールは何か？
  □ どの基準で判断すれば双方が納得するか？

  【対立構造の分析】
  - 営業の本当の関心事: 今月のパイプラインにある商談に間に合わせたい？それとも競合に先行されたくない？
  - 開発の本当の関心事: 技術的負債を増やしたくない？それともリリース後の障害対応を避けたい？

  本当の関心事がわかると、ポジション（「今月出せ」vs「品質が足りない」）とは別の解決策が見えることがあります。"

hints:
  1. "「今月中に出したい」に対して「なぜ今月なのですか？」と聞いてみましょう。具体的な商談やイベントがあるかもしれません。"
  2. "「品質基準を満たさない」に対して「具体的にどの品質基準ですか？」と聞きましょう。全部が未達なのか、特定の項目だけなのかで対応が変わります。"
  3. "合意案の例: 「コア機能のみ今月リリース（営業の商談に間に合う）。エッジケースのバグ修正は来月パッチ（開発の品質基準を段階的に満たす）。リリース判定基準: クリティカルバグ0件。」"
```

---

#### E3. `coming-decision-log-alignment` — 意思決定ログ共有と認識合わせ

**Current state**: Resolve misalignment on a prior decision. 3 missions.

**Enhancements from course**:
- **Add structured decision record format** (inspired by course Module 2.1 PRD template — decisions need context, not just conclusions).
- **Add "diagnosis" thinking** (course Module 2.3 Rumelt's Strategy Kernel — diagnose why the misalignment happened).

**Proposed changes**:
```
supplementalInfo: (enrich with decision record framework)
  "認識ズレが発生する原因を診断し、再発を防ぐ共有方法を設計しましょう：

  【認識ズレの診断】
  - 決定時に全員が参加していたか？
  - 決定の「背景・理由」が共有されていたか、それとも「結論」だけが伝わっていたか？
  - 決定後に前提条件が変わっていないか？

  【意思決定レコードの構成】
  1. 決定事項: 何を決めたか（1文）
  2. 背景: なぜこの決定が必要だったか
  3. 検討した選択肢: A案, B案, C案
  4. 選んだ理由: なぜこの案を選んだか
  5. 前提条件: この決定が有効な条件
  6. 見直し条件: どんな状況変化があれば再検討するか

  共有メッセージには「結論」だけでなく「理由」と「前提条件」を含めてください。"

hints:
  1. "認識ズレは「結論だけ伝わって理由が伝わっていない」ときに起きやすいです。決定の背景を1-2文追加しましょう。"
  2. "確認ポイントは「Yes/Noで答えられる質問」にすると、認識合わせがスムーズです。"
  3. "例: 「確認①: 段階リリースの第1弾は「高速検索」のみで合っていますか？ 確認②: 第2弾の「通知改善」は来月スプリントで着手予定で合っていますか？ 確認③: 「管理画面改修」はQ3以降に延期で合っていますか？」"
```

---

## Part 2: New Scenarios (Course-Inspired, pm-journey Style)

These new scenarios fill skill gaps identified in the Claude PM Course, adapted to pm-journey's 保険金請求サポートサービス product context and deliverable-focused style.

### New Category: PRD・企画 (PRD / Product Planning)

#### N1. `adv-prd-feature` — 機能PRD作成

**Concept**: Write a PRD for a new feature on the insurance claims product. Adapted from course Module 2.1.

```
id: "adv-prd-feature"
title: "機能PRD作成: AI証跡チェック"
discipline: "BASIC"
scenarioType: "basic"
description: "AI証跡チェック機能のPRDを作成する。問題定義・ソリューション・成功指標・リスクを整理し、実装判断に必要な情報をまとめる。"
mode: "guided"
assistanceMode: "guided"
passingScore: 60

task:
  instruction: "保険金請求サービスに「AI証跡チェック機能」を追加するPRDを作成してください。提出された証跡をAIが自動チェックし、不足や不備を即座にフィードバックする機能です。"
  deliverableFormat: "structured"
  template:
    sections:
      - "問題定義（誰の、どんな課題を解決するか）"
      - "ソリューション概要（なぜこのアプローチか）"
      - "ユーザーストーリー"
      - "成功指標（KPI と目標値）"
      - "スコープ（やること / やらないこと）"
      - "リスクと依存関係"
  referenceInfo: |
    背景:
    - 現状、提出された証跡の30%が不備で差し戻しされている
    - 差し戻し→再提出のサイクルに平均3日かかる
    - ユーザーの不満と運用チームの負荷が増大している

    検討中のアプローチ:
    - AIが提出時に証跡の不足・不備を自動検出
    - ユーザーにリアルタイムでフィードバック
    - 運用チームの目視確認工数を削減

behavior: guidedBehavior + forbidRolePlay: true

kickoffPrompt: "証跡の差し戻し率が30%に達しています。AIで提出時に不備を検出する機能を企画したいのですが、PRDを作成してもらえますか？"

missions:
  1. "問題の影響範囲とビジネスインパクトを定義する" (order: 1)
  2. "ソリューションとユーザーストーリーを作成する" (order: 2)
  3. "成功指標とスコープ境界を明確にする" (order: 3)

supplementalInfo: |
  PRDを書く前に、以下の観点で考えてみましょう：

  【問題の明確化】
  - 差し戻しが多い証跡の種類は？（写真の品質？書類の種類間違い？）
  - 最も影響を受けているユーザーセグメントは？
  - 差し戻し1件あたりのコスト（ユーザーの時間 + 運用チームの時間）は？

  【ソリューションの検証】
  - AIチェック以外の選択肢は？（ガイド改善？チェックリスト追加？）
  - 最小限のMVPは何か？
  - 誤検知（正しい証跡を不備と判定）のリスクは？

  【成功指標】
  - 差し戻し率をどこまで下げれば成功か？
  - ユーザー体験（提出完了までの時間）はどう変わるべきか？

hints:
  1. "問題定義では「何が起きているか」だけでなく「何もしない場合どうなるか」も書きましょう。"
  2. "成功指標は「差し戻し率を30%→15%に削減」のように具体的な数値目標を設定しましょう。"
  3. "スコープ外の例: 「MVP時点では写真の品質チェックのみ。書類内容の正確性チェックはPhase 2。」"

evaluationCriteria:
  - prd-problem (25%): 問題定義の深さ — 対象ユーザー、課題の具体性、ビジネスインパクトが明確か
  - prd-solution (25%): ソリューションの妥当性 — なぜこのアプローチか、代替案との比較があるか
  - prd-metrics (25%): 成功指標の具体性 — KPIが測定可能で目標値が設定されているか
  - prd-scope (25%): スコープの明確さ — やること/やらないこと、リスク、依存関係が整理されているか
```

---

#### N2. `adv-prd-strategic-options` — 戦略的アプローチの比較検討

**Concept**: Generate and compare 3 strategic approaches for a feature. Adapted from course Module 2.1 "Generate Multiple Strategic Approaches."

```
id: "adv-prd-strategic-options"
title: "戦略オプション比較: 請求ステータス改善"
discipline: "CHALLENGE"
description: "請求ステータスの可視性を改善する3つの戦略オプションを作成・比較し、推奨案を選定する。"
mode: "guided"
assistanceMode: "on-request"
passingScore: 60

task:
  instruction: "請求ステータスの可視性を改善するため、3つの異なる戦略アプローチを作成し、比較した上で推奨案を選定してください。"
  deliverableFormat: "structured"
  template:
    sections:
      - "オプションA: [アプローチ名] — 概要、メリット、デメリット、想定工数"
      - "オプションB: [アプローチ名] — 概要、メリット、デメリット、想定工数"
      - "オプションC: [アプローチ名] — 概要、メリット、デメリット、想定工数"
      - "比較マトリクス（ユーザー価値 / 実装難度 / リスク）"
      - "推奨案と判断理由"
  referenceInfo: |
    背景:
    - 請求ステータスが見えづらく、「今どうなっていますか？」の問い合わせが月200件
    - CS対応コストが月50万円相当
    - ユーザーNPSでも「進捗が見えない」が最大の不満

    検討の方向性（例）:
    A. リアルタイム通知（プッシュ通知 + メール）
    B. セルフサービスダッシュボード（ステータス追跡画面）
    C. チャットボット（ステータス問い合わせ自動応答）

behavior: singleResponseBehavior + forbidRolePlay: true

kickoffPrompt: ""

missions:
  1. "3つの異なる戦略オプションを作成する" (order: 1)
  2. "統一した比較軸で各案を評価する" (order: 2)
  3. "推奨案を選定し、判断理由を明示する" (order: 3)

supplementalInfo: |
  戦略オプションの比較では、以下を意識しましょう：
  - 各オプションは本当に「異なるアプローチ」か？（同じ方向の微調整ではないか）
  - 比較軸は「ユーザー価値」「実装コスト」だけでなく「リスク」「将来の拡張性」も含めましょう
  - 推奨案の判断理由には「なぜ他の案を選ばなかったか」も書きましょう

hints:
  1. "3案が似通っていませんか？「通知の種類が違うだけ」ではなく、ユーザー体験の設計思想が異なる案を考えましょう。"
  2. "比較マトリクスでは「全項目で最高」の案は存在しません。トレードオフを明示することが重要です。"
  3. "推奨案は「最も安全な案」ではなく「判断基準に最も合致する案」を選びましょう。判断基準を先に明示すると説得力が増します。"

evaluationCriteria:
  - options-diversity (25%): オプションの多様性 — 3案が本質的に異なるアプローチか
  - options-analysis (25%): 分析の深さ — 各案のメリット/デメリット/リスクが具体的か
  - options-comparison (25%): 比較の公平性 — 統一した比較軸で評価しているか
  - options-recommendation (25%): 推奨の説得力 — 判断基準が明確で、選定理由が論理的か
```

---

### New Category: データ分析 (Data Analysis)

#### N3. `adv-data-funnel` — ファネル分析と課題特定

**Concept**: Analyze a funnel to identify where users drop off. Adapted from course Module 2.2 discovery phase.

```
id: "adv-data-funnel"
title: "ファネル分析: 請求完了率の改善"
discipline: "BASIC"
scenarioType: "basic"
description: "請求フローのファネルデータを分析し、最大のドロップオフポイントと改善仮説を特定する。"
mode: "guided"
assistanceMode: "guided"
passingScore: 60

task:
  instruction: "以下の請求フローファネルデータを分析し、最大の改善機会を特定してください。"
  deliverableFormat: "structured"
  template:
    sections:
      - "ファネル分析（各ステップの離脱率）"
      - "最大のドロップオフポイントと仮説"
      - "改善提案（優先順位付き）"
  referenceInfo: |
    請求フローファネル（Q4実績）:
    | ステップ | 流入ユーザー | 完了ユーザー | 完了率 | 中央値所要時間 |
    |----------|------------|------------|--------|-------------|
    | 請求開始 | 10,000 | 10,000 | 100% | - |
    | 証跡アップロード | 10,000 | 6,500 | 65% | 12分 |
    | 確認・送信 | 6,500 | 5,800 | 89% | 3分 |
    | 審査待ち | 5,800 | 5,200 | 90% | 5日 |
    | 請求完了 | 5,200 | 4,500 | 87% | 2日 |

    追加データ:
    - 証跡アップロードでの離脱理由アンケート:
      - 「必要な書類がわからない」52%
      - 「写真がうまく撮れない」23%
      - 「後でやろうと思った」18%
      - 「その他」7%

    全体の請求完了率: 45%（目標: 70%）

behavior: guidedBehavior + forbidRolePlay: true

kickoffPrompt: "請求完了率が45%で目標の70%に届いていません。ファネルデータを分析して、最も効果的な改善ポイントを特定してください。"

missions:
  1. "各ステップの離脱率を計算し、最大のドロップオフを特定する" (order: 1)
  2. "定量データと定性データを掛け合わせて改善仮説を立てる" (order: 2)
  3. "改善提案を優先順位付きで整理する" (order: 3)

supplementalInfo: |
  ファネル分析のポイント：
  - 離脱率が最も大きいステップはどこですか？
  - そのステップの離脱理由は定性データ（アンケート）で裏付けられますか？
  - 改善のインパクト = 離脱率の改善幅 × そのステップに到達するユーザー数

hints:
  1. "証跡アップロードの完了率65%は、流入10,000人のうち3,500人が離脱していることを意味します。ここが最大のボトルネックです。"
  2. "アンケートで「必要書類がわからない」が52%です。ガイド改善で離脱の半分以上に対処できる可能性があります。"
  3. "改善インパクトの試算例: 証跡アップロード完了率を65%→80%に改善できた場合、請求完了率は45%→55%になる見込み（+10pp、+1,000件/Q）。"

evaluationCriteria:
  - funnel-analysis (30%): ファネル分析の正確さ — 離脱率の計算とボトルネック特定が正確か
  - funnel-hypothesis (25%): 仮説の妥当性 — 定量と定性を組み合わせた根拠ある仮説か
  - funnel-proposal (25%): 改善提案の具体性 — 実行可能で優先順位が明確か
  - funnel-impact (20%): インパクト見積もり — 改善による期待効果を定量的に示しているか
```

---

#### N4. `adv-data-roi` — ROIモデル作成

**Concept**: Build a 3-scenario ROI model. Adapted from course Module 2.2 impact estimation phase.

```
id: "adv-data-roi"
title: "ROI分析: AI証跡チェック機能の投資判断"
discipline: "CHALLENGE"
description: "AI証跡チェック機能の開発投資について、3シナリオのROIモデルを作成し、投資判断の根拠を整理する。"
mode: "guided"
assistanceMode: "on-request"
passingScore: 60

task:
  instruction: "AI証跡チェック機能の開発に必要な投資（エンジニア3名×3ヶ月 = 約1,500万円）に対するROIモデルを作成してください。"
  deliverableFormat: "structured"
  template:
    sections:
      - "インパクト計算式（各変数の定義と根拠）"
      - "3シナリオ分析（悲観的 / 現実的 / 楽観的）"
      - "投資判断の推奨と根拠"
  referenceInfo: |
    前提データ:
    - 月間請求件数: 10,000件
    - 現在の差し戻し率: 30%（3,000件/月）
    - 差し戻し1件あたりのコスト:
      - ユーザー側: 再提出に平均2時間（機会損失）
      - 運用チーム側: 確認・連絡に平均20分（人件費換算 約800円/件）
    - 月間運用コスト: 3,000件 × 800円 = 240万円
    - 開発コスト: エンジニア3名 × 3ヶ月 = 約1,500万円
    - ユーザーLTV: 請求完了ユーザーの年間継続率80%、年間保険料平均12万円

    ROI計算式:
    Impact = 対象件数 × 現在の差し戻し率 × 期待改善率 × 1件あたり削減コスト

behavior: singleResponseBehavior + forbidRolePlay: true

kickoffPrompt: ""

missions:
  1. "インパクト計算の各変数を定義し根拠を示す" (order: 1)
  2. "3シナリオ（悲観/現実/楽観）を作成する" (order: 2)
  3. "投資判断の推奨を根拠付きで示す" (order: 3)

supplementalInfo: |
  ROIモデル作成のポイント：
  - 採用率は100%で計算しないこと（段階的ロールアウトを想定）
  - 3シナリオで不確実性の幅を示すこと
  - 「最悪でも投資回収できるか？」が判断の鍵

  | シナリオ | 採用率 | 差し戻し率改善 | 前提 |
  |----------|--------|-------------|------|
  | 悲観的 | 30% | 30%→25% | AI精度が想定以下 |
  | 現実的 | 70% | 30%→18% | 想定通りの精度 |
  | 楽観的 | 90% | 30%→12% | 高精度 + UX改善効果 |

hints:
  1. "「対象件数」は月間10,000件ではなく、採用率を掛けた数字を使いましょう。悲観シナリオでは3,000件（30%採用）です。"
  2. "コスト削減だけでなく、請求完了率の改善によるLTV向上も収益インパクトに含めましょう。"
  3. "経営層への報告では「最悪でも○ヶ月で回収、現実的には○倍のROI」という形で伝えると判断しやすくなります。"

evaluationCriteria:
  - roi-variables (25%): 変数定義の妥当性 — 各変数の定義と根拠が明確で現実的か
  - roi-scenarios (25%): 3シナリオの設計 — 悲観/現実/楽観が適切な幅を持ち、前提が明示されているか
  - roi-calculation (25%): 計算の正確性 — 計算式が論理的で数値が整合しているか
  - roi-recommendation (25%): 投資判断の説得力 — 推奨が根拠に基づき、リスクも考慮されているか
```

---

### New Category: 戦略・方針 (Strategy)

#### N5. `adv-strategy-diagnosis` — 戦略診断と方針策定

**Concept**: Apply Rumelt's Strategy Kernel. Adapted from course Module 2.3.

```
id: "adv-strategy-diagnosis"
title: "プロダクト戦略: 請求サービスの競争優位"
discipline: "CHALLENGE"
description: "保険金請求サービスの戦略的課題を診断し、競争優位を確立するための方針と行動計画を策定する。"
mode: "guided"
assistanceMode: "guided"
passingScore: 60

task:
  instruction: "保険金請求サービスの戦略を、診断→方針→行動の3ステップで策定してください。"
  deliverableFormat: "structured"
  template:
    sections:
      - "診断（DIAGNOSIS）: 戦略的課題は何か"
      - "方針（GUIDING POLICY）: どこで、どう戦うか"
      - "行動計画（COHERENT ACTIONS）: 具体的に何をするか（Q1/Q2）"
      - "前提条件と見直し条件"
  referenceInfo: |
    現状:
    - 保険金請求サポートサービスは利用者5,000人、ARR 1.5億円
    - 請求完了率45%（業界平均60%）
    - 差し戻し率30%（業界平均15%）
    - NPS: -5（「進捗が見えない」「書類がわからない」が主な不満）
    - エンジニア5名、PM1名（あなた）、CS3名

    競合環境:
    - 大手保険会社の既存システム: 機能は広いがUIが古い。切替コストが高くユーザーは不満を抱えつつ使い続ける。
    - InsurTechスタートアップX社: モダンUI、AI審査機能あり。ただし実績が少なく大手保険会社への導入は進んでいない。
    - Salesforceカスタマイズ: 汎用的だが保険請求特化の機能がなく、導入・運用コストが高い。

    制約:
    - 開発リソース: エンジニア5名（うち2名はインフラ運用兼務）
    - 予算: 四半期あたり500万円（外注含む）
    - 「全部やる」は不可能 — 何を捨てるかの判断が必要

behavior: challengeBehavior + forbidRolePlay: true

kickoffPrompt: "請求完了率が業界平均を大きく下回っています。限られたリソースで競争優位を確立するための戦略を策定してください。"

missions:
  1. "戦略的課題を診断する（データと競合分析に基づく）" (order: 1)
  2. "方針を策定する（トレードオフを明示する）" (order: 2)
  3. "Q1/Q2の行動計画を策定する（方針と整合した具体的施策）" (order: 3)

supplementalInfo: |
  戦略策定のフレームワーク（Rumelt's Strategy Kernel）：

  【診断】戦略的課題を特定する
  - 「全部が問題」ではなく「核心的な課題」を1つに絞る
  - データで裏付ける（数字がないなら仮説でもよい）
  - × 「UIが古い」→ 事象であり診断ではない
  - ○ 「ユーザーが証跡提出で離脱する根本原因は、必要書類のガイダンス不足」→ 診断

  【方針】どこで戦うか / 何を捨てるか
  - 目標は方針ではない（× 「売上2倍」）
  - 機能リストは方針ではない（× 「AI、通知、ダッシュボードを作る」）
  - ○ 「証跡提出体験に集中し、審査自動化は捨てる」→ トレードオフを含む方針

  【行動】方針と整合した施策
  - 各施策が方針を実現するものであること
  - 施策同士が矛盾しないこと（「コスト削減」と「大規模投資」の同時追求は矛盾）

hints:
  1. "診断では「何が問題か」だけでなく「なぜそれが最も重要な問題か」を説明しましょう。"
  2. "方針には必ず「やらないこと」を書きましょう。やることだけでは方針になりません。"
  3. "行動計画のQ1施策がQ2施策の土台になっているか確認しましょう。施策が互いに強化し合う構成が理想です。"

evaluationCriteria:
  - strategy-diagnosis (25%): 診断の鋭さ — 核心的課題が特定され、データで裏付けられているか
  - strategy-policy (25%): 方針の明確さ — トレードオフが明示され、「やらないこと」が書かれているか
  - strategy-actions (25%): 行動計画の整合性 — 施策が方針と整合し、互いに強化し合っているか
  - strategy-assumptions (25%): 前提条件の認識 — 前提条件と見直し条件が明示されているか
```

---

## Part 3: Updated homeScenarioCatalog Structure

After all enhancements and additions, the proposed catalog structure:

```
homeScenarioCatalog = [
  {
    id: "soft-skills",
    title: "基礎ソフトスキル",
    subcategories: [{
      scenarios: ["basic-intro-alignment", "basic-product-understanding", "basic-schedule-share", "basic-meeting-minutes"]
    }]
  },
  {
    id: "test-cases",
    title: "テストケース作成",
    subcategories: [{
      scenarios: ["test-login", "test-form", "test-file-upload"]
    }]
  },
  {
    id: "requirement-definition",
    title: "要件定義",
    subcategories: [{
      scenarios: ["basic-requirement-definition-doc", "basic-requirement-hearing-plan", "basic-requirement-user-story"]
    }]
  },
  {
    id: "prd-planning",              // ← NEW
    title: "PRD・企画",
    subcategories: [{
      scenarios: ["adv-prd-feature", "adv-prd-strategic-options"]
    }]
  },
  {
    id: "data-analysis",             // ← NEW
    title: "データ分析",
    subcategories: [{
      scenarios: ["adv-data-funnel", "adv-data-roi"]
    }]
  },
  {
    id: "strategy",                  // ← NEW
    title: "戦略・方針",
    subcategories: [{
      scenarios: ["adv-strategy-diagnosis"]
    }]
  },
  {
    id: "incident-response",
    title: "障害対応",
    subcategories: [{
      scenarios: ["coming-incident-response", "coming-incident-triage-escalation", "coming-postmortem-followup"]
    }]
  },
  {
    id: "business-execution",
    title: "事業推進",
    subcategories: [{
      scenarios: ["coming-priority-tradeoff-workshop", "coming-stakeholder-negotiation", "coming-decision-log-alignment"]
    }]
  }
]
```

**Total**: 16 existing (enhanced) + 6 new = **22 scenarios**

---

## Summary of Changes

### Existing Scenario Enhancements (16 scenarios)

| Enhancement | Applied To | Source |
|-------------|-----------|--------|
| Progressive hints (3 per scenario) | All 16 | Course pedagogical pattern |
| Socratic pre-questions in supplementalInfo | Soft Skills, Requirements | Course Module 2.1 |
| Expanded evaluation criteria (2→4 categories) | Soft Skills (3 scenarios) | Course rubric depth |
| Test prioritization mission | Test Cases (3 scenarios) | Course Module 2.2 segment thinking |
| Tradeoff analysis framework | Requirements (2 scenarios) | Course Module 2.3 strategy choices |
| ROI estimation thinking | Requirements (1 scenario) | Course Module 2.2 impact estimation |
| Impact assessment framework | Incident Response (3 scenarios) | Course Module 2.2 data analysis |
| 5 Whys root cause framework | Postmortem (1 scenario) | Course diagnostic approach |
| RICE scoring framework | Priority Tradeoff (1 scenario) | Course Module 2.2 ROI |
| Negotiation preparation framework | Stakeholder Negotiation (1 scenario) | Course Module 2.3 devil's advocate |
| Decision record format | Decision Log (1 scenario) | Course Module 2.1 PRD template |

### New Scenarios (6 scenarios)

| ID | Category | Inspired By |
|----|----------|-------------|
| `basic-product-understanding` | 基礎ソフトスキル | Course Module 1.1 (TaskFlow onboarding — understand the product before doing PM work) |
| `adv-prd-feature` | PRD・企画 | Course Module 2.1 (PRD writing + Socratic questioning) |
| `adv-prd-strategic-options` | PRD・企画 | Course Module 2.1 (Multiple strategic approaches) |
| `adv-data-funnel` | データ分析 | Course Module 2.2 (Funnel analysis + discovery) |
| `adv-data-roi` | データ分析 | Course Module 2.2 (ROI modeling + 3 scenarios) |
| `adv-strategy-diagnosis` | 戦略・方針 | Course Module 2.3 (Rumelt's Strategy Kernel) |
