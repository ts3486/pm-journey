import type {
  RatingCriterion,
  Scenario,
  ScenarioCatalogCategory,
  ScenarioSummary,
} from "@/types";

// ============================================================================
// Scenario-Specific Rating Criteria
// ============================================================================

// 1. basic-intro-alignment: 自己紹介＆期待値合わせ
const introAlignmentCriteria: RatingCriterion[] = [
  {
    id: "intro-role-clarity",
    name: "役割・責任の明確化",
    weight: 25,
    description: "自分の役割と責任範囲を明確に伝え、相手の役割も確認できているか",
    scoringGuidelines: {
      excellent: "自分の役割を具体的に説明し、相手の役割・期待も確認。責任境界が明確",
      good: "役割を説明し、相手にも確認。一部曖昧な点が残る",
      needsImprovement: "自分の役割は述べたが、相手の確認が不十分",
      poor: "役割の説明が曖昧または欠如",
    },
  },
  {
    id: "intro-expectation-align",
    name: "期待値の擦り合わせ",
    weight: 25,
    description: "成功条件や優先度について相互理解を形成できているか",
    scoringGuidelines: {
      excellent: "成功条件・優先度・制約を双方で確認し、認識のズレを解消",
      good: "主要な期待値を確認。細部の擦り合わせが一部不足",
      needsImprovement: "期待値の確認を試みたが、合意形成が不十分",
      poor: "期待値の擦り合わせがほぼ行われていない",
    },
  },
  {
    id: "intro-communication",
    name: "コミュニケーション姿勢",
    weight: 25,
    description: "積極的な傾聴、適切な質問、相手への敬意を示せているか",
    scoringGuidelines: {
      excellent: "相手の発言を引用・要約し、オープンな質問で深掘り。敬意ある対話",
      good: "適切に質問し傾聴姿勢あり。一部一方的な場面も",
      needsImprovement: "質問はあるが表面的。傾聴が不足",
      poor: "一方的な発言が多く、相手の意見を引き出せていない",
    },
  },
  {
    id: "intro-next-action",
    name: "次アクションの具体性",
    weight: 25,
    description: "担当・期日を含む具体的な次ステップを合意できているか",
    scoringGuidelines: {
      excellent: "2件以上の具体的アクションを担当・期日付きで合意",
      good: "次アクションを決定。担当または期日が一部曖昧",
      needsImprovement: "次アクションに言及したが具体性に欠ける",
      poor: "次アクションが決まっていない",
    },
  },
];

// 3a. test-login: ログイン機能テストケース作成
const testLoginCriteria: RatingCriterion[] = [
  {
    id: "login-normal-flow",
    name: "正常系の網羅性",
    weight: 25,
    description: "ログイン成功パターンを漏れなくカバーしているか",
    scoringGuidelines: {
      excellent: "メール/パスワード、SNS連携、記憶機能など主要フローを網羅",
      good: "基本的なログイン成功パターンをカバー。一部欠落",
      needsImprovement: "単純なログイン成功のみ。バリエーションが不足",
      poor: "正常系の洗い出しが不十分",
    },
  },
  {
    id: "login-error-cases",
    name: "異常系・エラーケースの考慮",
    weight: 30,
    description: "認証エラー、入力エラー、セキュリティ関連のケースを検討しているか",
    scoringGuidelines: {
      excellent: "パスワード誤り、アカウントロック、セッション切れ、CSRF対策など多角的に検討",
      good: "主要なエラーケースをカバー。一部のセキュリティ観点が欠落",
      needsImprovement: "基本的なエラーのみ。セキュリティ観点が不足",
      poor: "異常系の検討がほぼない",
    },
  },
  {
    id: "login-boundary",
    name: "境界値・制限値のテスト",
    weight: 25,
    description: "入力文字数制限、試行回数制限などの境界条件を検討しているか",
    scoringGuidelines: {
      excellent: "文字数上限/下限、試行回数制限、特殊文字など境界条件を網羅",
      good: "主要な境界値をカバー。一部欠落",
      needsImprovement: "境界値に言及したが体系的でない",
      poor: "境界値の検討がない",
    },
  },
  {
    id: "login-precondition",
    name: "前提条件とテストデータ",
    weight: 20,
    description: "テストユーザー、環境、初期状態を明確にしているか",
    scoringGuidelines: {
      excellent: "各ケースにテストユーザー・環境・初期状態を明記",
      good: "前提条件を記載。一部のケースで不足",
      needsImprovement: "前提条件の記述が断片的",
      poor: "前提条件の記載がない",
    },
  },
];

// 3a-2. test-form: フォーム機能テストケース作成
const testFormCriteria: RatingCriterion[] = [
  {
    id: "form-input-validation",
    name: "入力バリデーションの網羅性",
    weight: 30,
    description: "必須項目、フォーマット、文字種などのバリデーションをカバーしているか",
    scoringGuidelines: {
      excellent: "必須/任意、フォーマット、文字種、長さなど全バリデーションを網羅",
      good: "主要なバリデーションをカバー。一部欠落",
      needsImprovement: "基本的な必須チェックのみ",
      poor: "バリデーションの検討が不十分",
    },
  },
  {
    id: "form-error-handling",
    name: "エラー表示・ハンドリング",
    weight: 25,
    description: "エラーメッセージ、フィールドハイライト、サーバーエラーを検討しているか",
    scoringGuidelines: {
      excellent: "フィールド単位エラー、サマリー表示、サーバーエラー、タイムアウトを網羅",
      good: "主要なエラー表示をカバー。一部欠落",
      needsImprovement: "基本的なエラー表示のみ",
      poor: "エラーハンドリングの検討がない",
    },
  },
  {
    id: "form-ux-flow",
    name: "UXフロー・操作性",
    weight: 25,
    description: "タブ移動、Enter送信、クリア、戻るなどの操作性を検討しているか",
    scoringGuidelines: {
      excellent: "キーボード操作、フォーカス管理、確認画面、中断再開を網羅",
      good: "主要な操作フローをカバー。一部欠落",
      needsImprovement: "基本的な送信フローのみ",
      poor: "操作性の検討がない",
    },
  },
  {
    id: "form-data-persistence",
    name: "データ永続化・送信",
    weight: 20,
    description: "送信成功、重複送信防止、一時保存などを検討しているか",
    scoringGuidelines: {
      excellent: "送信成功、重複防止、一時保存、オフライン対応を検討",
      good: "送信成功と重複防止をカバー。一部欠落",
      needsImprovement: "送信成功のみ",
      poor: "データ永続化の検討がない",
    },
  },
];

// 3a-3. test-file-upload: ファイルアップロード機能テストケース作成
const testFileUploadCriteria: RatingCriterion[] = [
  {
    id: "upload-file-types",
    name: "ファイル種別・サイズの検証",
    weight: 30,
    description: "許可拡張子、MIMEタイプ、サイズ制限を網羅しているか",
    scoringGuidelines: {
      excellent: "許可/禁止拡張子、MIMEチェック、サイズ上限/下限、0バイトを網羅",
      good: "主要なファイル検証をカバー。一部欠落",
      needsImprovement: "基本的な拡張子チェックのみ",
      poor: "ファイル検証の検討が不十分",
    },
  },
  {
    id: "upload-error-handling",
    name: "エラー・例外ケース",
    weight: 25,
    description: "アップロード失敗、ネットワークエラー、タイムアウトを検討しているか",
    scoringGuidelines: {
      excellent: "ネットワーク切断、タイムアウト、サーバーエラー、ストレージ満杯を網羅",
      good: "主要なエラーケースをカバー。一部欠落",
      needsImprovement: "基本的なエラーのみ",
      poor: "エラーケースの検討がない",
    },
  },
  {
    id: "upload-ux",
    name: "UX・進捗表示",
    weight: 25,
    description: "進捗バー、キャンセル、複数ファイル、ドラッグ&ドロップを検討しているか",
    scoringGuidelines: {
      excellent: "進捗表示、キャンセル、複数選択、D&D、プレビューを網羅",
      good: "主要なUX要素をカバー。一部欠落",
      needsImprovement: "基本的なアップロードUIのみ",
      poor: "UXの検討がない",
    },
  },
  {
    id: "upload-security",
    name: "セキュリティ・検証",
    weight: 20,
    description: "悪意あるファイル、実行ファイル、ウイルスチェックを検討しているか",
    scoringGuidelines: {
      excellent: "実行ファイル拒否、拡張子偽装検知、サニタイズ、スキャン連携を検討",
      good: "主要なセキュリティ検証をカバー。一部欠落",
      needsImprovement: "基本的な拡張子制限のみ",
      poor: "セキュリティの検討がない",
    },
  },
];

// 3f. basic-schedule-share: スケジュール感の共有
const scheduleShareCriteria: RatingCriterion[] = [
  {
    id: "schedule-overview",
    name: "全体像の共有",
    weight: 25,
    description: "プロジェクトの流れや全体像を簡潔に説明できているか",
    scoringGuidelines: {
      excellent: "流れ・主要フェーズ・前提を簡潔に整理し共有",
      good: "全体像は共有できているが一部曖昧",
      needsImprovement: "全体像に触れたが説明が不足",
      poor: "全体像の共有がない",
    },
  },
  {
    id: "schedule-milestones",
    name: "マイルストーン設定",
    weight: 25,
    description: "重要なマイルストーンを明確にできているか",
    scoringGuidelines: {
      excellent: "主要マイルストーンを3つ以上明示し理由も説明",
      good: "マイルストーンを提示。一部の根拠が不足",
      needsImprovement: "マイルストーンに触れたが具体性が不足",
      poor: "マイルストーンが設定されていない",
    },
  },
  {
    id: "schedule-risks",
    name: "不確実性と前提",
    weight: 25,
    description: "不確実性や前提条件を共有できているか",
    scoringGuidelines: {
      excellent: "前提条件・不確実性・影響を整理して共有",
      good: "前提や不確実性に触れたが一部不足",
      needsImprovement: "前提の記述が断片的",
      poor: "前提や不確実性の共有がない",
    },
  },
  {
    id: "schedule-next",
    name: "次の判断ポイント",
    weight: 25,
    description: "次に決めるべき事項や確認事項が明確か",
    scoringGuidelines: {
      excellent: "判断ポイントと次アクションを担当・期日付きで提示",
      good: "判断ポイントを整理したが一部の詳細が不足",
      needsImprovement: "判断ポイントに触れたが具体性が不足",
      poor: "判断ポイントの整理がない",
    },
  },
];

// 4. challenge-project-rescue: 遅延プロジェクト立て直し
const projectRescueCriteria: RatingCriterion[] = [
  {
    id: "rescue-root-cause",
    name: "遅延要因の分析",
    weight: 25,
    description: "遅延の根本原因を構造的に分析し、事実ベースで整理できているか",
    scoringGuidelines: {
      excellent: "複数の遅延要因を特定し、技術・プロセス・人的要因を分類。優先度付け",
      good: "主要な遅延要因を特定。分析が一部表面的",
      needsImprovement: "遅延要因に言及したが構造的分析が不足",
      poor: "遅延要因の分析がない",
    },
  },
  {
    id: "rescue-scope-replan",
    name: "スコープ再構成",
    weight: 25,
    description: "優先度に基づきスコープを再定義し、トレードオフを明示できているか",
    scoringGuidelines: {
      excellent: "Must/Should/Could/Won'tで分類。各項目のインパクトと根拠を明示",
      good: "スコープを再検討。優先度の根拠が一部曖昧",
      needsImprovement: "スコープ調整に言及したが具体性に欠ける",
      poor: "スコープ再構成の検討がない",
    },
  },
  {
    id: "rescue-recovery-plan",
    name: "リカバリ計画の具体性",
    weight: 30,
    description: "実行可能なリカバリ計画を期日・担当・マイルストーン付きで作成できているか",
    scoringGuidelines: {
      excellent: "週次マイルストーン、担当、リスク対策を含む詳細計画",
      good: "リカバリ計画を作成。一部の詳細が不足",
      needsImprovement: "計画の方向性のみ。実行可能性が低い",
      poor: "リカバリ計画がない",
    },
  },
  {
    id: "rescue-stakeholder",
    name: "ステークホルダー対応",
    weight: 20,
    description: "関係者への説明・合意形成の計画を立てられているか",
    scoringGuidelines: {
      excellent: "関係者別のコミュニケーション計画。説明資料の構成まで検討",
      good: "ステークホルダー対応を検討。一部が抽象的",
      needsImprovement: "対応の必要性に言及したが計画がない",
      poor: "ステークホルダー対応の検討がない",
    },
  },
];

// 5. challenge-scope-negotiation: スコープ／リソース交渉
const scopeNegotiationCriteria: RatingCriterion[] = [
  {
    id: "negotiate-preparation",
    name: "交渉準備と分析",
    weight: 25,
    description: "譲れない条件、BATNA、相手の立場を事前に整理できているか",
    scoringGuidelines: {
      excellent: "BATNA・ZOPA・相手の利害を明確に整理。交渉戦略を立案",
      good: "主要な条件を整理。相手の立場の分析が一部不足",
      needsImprovement: "条件を列挙したが戦略的な整理がない",
      poor: "交渉準備がほぼない",
    },
  },
  {
    id: "negotiate-alternatives",
    name: "代替案の提示",
    weight: 30,
    description: "複数の選択肢をインパクト・リスク付きで提示できているか",
    scoringGuidelines: {
      excellent: "3案以上を提示。各案のメリット・デメリット・インパクトを定量化",
      good: "複数案を提示。インパクトの説明が一部定性的",
      needsImprovement: "代替案を出したが比較が不十分",
      poor: "代替案の提示がない",
    },
  },
  {
    id: "negotiate-persuasion",
    name: "説得力と論理性",
    weight: 25,
    description: "データや根拠に基づき、相手を納得させる説明ができているか",
    scoringGuidelines: {
      excellent: "データ・事例・論理で説得。相手の懸念に先回りして対応",
      good: "根拠を示して説明。一部の論点で深掘りが不足",
      needsImprovement: "説明はあるが根拠が弱い",
      poor: "説得力のある説明がない",
    },
  },
  {
    id: "negotiate-agreement",
    name: "合意形成と記録",
    weight: 20,
    description: "合意内容を明確化し、残リスクとフォローアップを記録できているか",
    scoringGuidelines: {
      excellent: "合意内容を文書化。残リスク・フォローアップ・次回確認日を明記",
      good: "合意を確認。一部の詳細が未定",
      needsImprovement: "合意に言及したが記録が曖昧",
      poor: "合意形成・記録がない",
    },
  },
];

// 9. challenge-stakeholder-alignment: 認識ズレ解消
const stakeholderAlignmentCriteria: RatingCriterion[] = [
  {
    id: "alignment-gaps",
    name: "ズレの特定と整理",
    weight: 25,
    description: "認識のズレや論点を整理できているか",
    scoringGuidelines: {
      excellent: "ズレのポイントを具体的に特定し、原因まで整理",
      good: "ズレを特定。一部の論点が曖昧",
      needsImprovement: "ズレに触れたが整理が不十分",
      poor: "ズレの特定がない",
    },
  },
  {
    id: "alignment-goals",
    name: "共通認識の再定義",
    weight: 25,
    description: "共通ゴールや成功条件を再整理できているか",
    scoringGuidelines: {
      excellent: "共通ゴールと成功条件を明文化し合意",
      good: "共通認識を整理。一部の合意が不足",
      needsImprovement: "共通認識の記述が曖昧",
      poor: "共通認識の再定義がない",
    },
  },
  {
    id: "alignment-process",
    name: "合意形成プロセス",
    weight: 25,
    description: "合意形成の進め方や確認プロセスが明確か",
    scoringGuidelines: {
      excellent: "合意形成の手順と確認タイミングを具体化",
      good: "合意形成に触れたが一部具体性が不足",
      needsImprovement: "合意形成の記述が弱い",
      poor: "合意形成が考慮されていない",
    },
  },
  {
    id: "alignment-prevention",
    name: "再発防止",
    weight: 25,
    description: "再発防止策やフォローアップを提示できているか",
    scoringGuidelines: {
      excellent: "再発防止策と定期確認プロセスを明確化",
      good: "再発防止に触れたが具体性が不足",
      needsImprovement: "再発防止の記述が曖昧",
      poor: "再発防止がない",
    },
  },
];

// 10. challenge-progress-visibility: 進捗が見えない状況への対応
const progressVisibilityCriteria: RatingCriterion[] = [
  {
    id: "progress-signal",
    name: "進捗可視化の設計",
    weight: 25,
    description: "最小限の進捗可視化手段を設計できているか",
    scoringGuidelines: {
      excellent: "指標・更新頻度・責任者を明確にし最小セットを提示",
      good: "可視化手段を提示。一部の詳細が不足",
      needsImprovement: "可視化に触れたが具体性が不足",
      poor: "可視化手段が提示されていない",
    },
  },
  {
    id: "progress-risk",
    name: "リスクと原因の整理",
    weight: 25,
    description: "遅延や不確実性の原因を整理できているか",
    scoringGuidelines: {
      excellent: "複数の原因を分類し、影響と優先度を整理",
      good: "原因を整理。一部の分析が不足",
      needsImprovement: "原因に触れたが整理が浅い",
      poor: "原因整理がない",
    },
  },
  {
    id: "progress-communication",
    name: "報告と合意形成",
    weight: 25,
    description: "報告のリズムと合意形成の進め方が明確か",
    scoringGuidelines: {
      excellent: "報告頻度・フォーマット・合意の場を具体化",
      good: "報告計画を示したが一部が曖昧",
      needsImprovement: "報告に触れたが具体性が不足",
      poor: "報告計画がない",
    },
  },
  {
    id: "progress-next",
    name: "次アクション",
    weight: 25,
    description: "短期的な打ち手と次アクションが明確か",
    scoringGuidelines: {
      excellent: "即時対応と次アクションを担当・期日付きで提示",
      good: "次アクションを提示したが詳細が不足",
      needsImprovement: "次アクションが曖昧",
      poor: "次アクションが整理されていない",
    },
  },
];

const sharedProduct: Scenario["product"] = {
  // Product/project details are managed in Prompt Settings (product_config).
  name: "",
  summary: "",
  audience: "",
  problems: [],
  goals: [],
  differentiators: [],
  scope: [],
  constraints: [],
  timeline: "",
  successCriteria: [],
  uniqueEdge: "",
  techStack: [],
  coreFeatures: [],
};



// ============================================================================
// Simplified Rating Criteria for Single Response Basic Scenarios
// ============================================================================

const simpleIntroCriteria: RatingCriterion[] = [
  {
    id: "intro-clarity",
    name: "内容の明確さ",
    weight: 50,
    description: "自分の役割や期待値を分かりやすく伝えられているか",
    scoringGuidelines: {
      excellent: "役割と期待値が具体的で明確",
      good: "概ね伝わるが一部曖昧",
      needsImprovement: "伝えようとしたが不十分",
      poor: "内容が不明確",
    },
  },
  {
    id: "intro-completeness",
    name: "回答の完成度",
    weight: 50,
    description: "必要な情報が含まれているか",
    scoringGuidelines: {
      excellent: "必要な情報が網羅されている",
      good: "主要な情報は含まれている",
      needsImprovement: "情報が不足している",
      poor: "ほとんど情報がない",
    },
  },
];

const featureRequirementCriteria: RatingCriterion[] = [
  {
    id: "requirement-story-clarity",
    name: "ユーザーストーリーの明確性",
    weight: 25,
    description: "対象ユーザー、実現したい行動、得られる価値が一貫して定義されているか",
    scoringGuidelines: {
      excellent: "As a / I want / So that が具体的で、ユーザー価値と課題が明確",
      good: "ストーリーは成立しているが、一部の要素が抽象的",
      needsImprovement: "形式はあるが、ユーザーや価値の記述が曖昧",
      poor: "ユーザーストーリーとして成立していない",
    },
  },
  {
    id: "requirement-acceptance-testability",
    name: "受入条件の検証可能性",
    weight: 25,
    description: "受入条件が観測可能かつ検証可能な形式で定義されているか",
    scoringGuidelines: {
      excellent: "Given/When/Then または同等の明確さで、判定基準が具体的",
      good: "受入条件はあるが、一部で判定方法が曖昧",
      needsImprovement: "受入条件に言及しているが、検証観点が不足",
      poor: "受入条件が定義されていない",
    },
  },
  {
    id: "requirement-scope-boundary",
    name: "スコープ境界の整理",
    weight: 25,
    description: "対象範囲と非対象、主要制約が整理されているか",
    scoringGuidelines: {
      excellent: "対象・非対象・制約を明確に分離し、優先度や判断理由も示している",
      good: "対象と非対象は整理されているが、制約や理由が一部不足",
      needsImprovement: "スコープに触れているが境界が曖昧",
      poor: "スコープ境界が整理されていない",
    },
  },
  {
    id: "requirement-risk-unknowns",
    name: "不明点・リスクの明示",
    weight: 25,
    description: "未確定事項やリスクを挙げ、確認計画につなげられているか",
    scoringGuidelines: {
      excellent: "不明点とリスクを具体化し、確認先・確認方法・次アクションまで明示",
      good: "不明点やリスクを列挙しているが、確認計画が一部不足",
      needsImprovement: "不明点やリスクはあるが抽象的で優先度が不明",
      poor: "不明点やリスクへの言及がない",
    },
  },
];

type MissionCriteriaMode =
  | "basic-communication"
  | "test-case-quality"
  | "requirement-definition"
  | "incident-response"
  | "business-execution"
  | "challenge";

const requirementDefinitionScenarioIds = new Set([
  "basic-requirement-definition-doc",
  "basic-requirement-hearing-plan",
  "basic-requirement-user-story",
  "basic-requirement-nfr",
  "basic-requirement-priority-matrix",
  "basic-requirement-risk-check",
  "basic-requirement-consensus",
]);

const incidentResponseScenarioIds = new Set([
  "coming-incident-response",
  "coming-incident-triage-escalation",
  "coming-postmortem-followup",
]);

const businessExecutionScenarioIds = new Set([
  "coming-priority-tradeoff-workshop",
  "coming-stakeholder-negotiation",
  "coming-decision-log-alignment",
]);

const missionCriteriaTemplates: Record<
  MissionCriteriaMode,
  {
    description: (missionTitle: string) => string;
    scoringGuidelines: RatingCriterion["scoringGuidelines"];
  }
> = {
  "basic-communication": {
    description: (missionTitle) =>
      `${missionTitle}について、基本的なコミュニケーション品質（明確さ・配慮・合意形成）が担保されているかを評価します。`,
    scoringGuidelines: {
      excellent: "要点を構造的に整理し、相手への配慮を示しつつ、合意すべき事項と次アクションまで具体化している",
      good: "主要な要点は明確で、実務に使える内容になっている。合意事項や次アクションに軽微な不足がある",
      needsImprovement: "方向性は概ね正しいが、説明の明確さ・配慮・具体性のいずれかが不足している",
      poor: "コミュニケーションが曖昧で、ミッションで必要な合意形成や具体化ができていない",
    },
  },
  "test-case-quality": {
    description: (missionTitle) =>
      `${missionTitle}について、再現可能で抜け漏れのないテスト観点を示せているかを評価します。`,
    scoringGuidelines: {
      excellent: "正常系・異常系・境界値・前提条件まで含め、再現可能なテスト観点を具体化している",
      good: "主要なテスト観点を網羅しているが、一部の観点や条件の詳細が不足している",
      needsImprovement: "観点の方向性はあるが、網羅性や再現性に不足がある",
      poor: "ミッションに対するテスト観点の整理が不十分で、抜け漏れが多い",
    },
  },
  "requirement-definition": {
    description: (missionTitle) =>
      `${missionTitle}について、要件の明確性・検証可能性・スコープ境界を定義できているかを評価します。`,
    scoringGuidelines: {
      excellent: "ユーザーストーリー、受入条件、非対象、制約・不明点が整合的に整理され、検証可能な要件として成立している",
      good: "主要な要件は整理されているが、受入条件の検証性または境界定義に一部不足がある",
      needsImprovement: "要件には触れているが、曖昧な表現や抜け漏れがあり、実装判断に不確実性が残る",
      poor: "要件定義として必要な構造（目的・条件・境界）が不足しており、実装可能な形になっていない",
    },
  },
  "incident-response": {
    description: (missionTitle) =>
      `${missionTitle}について、障害対応の初動品質（影響評価・優先度判断・連絡体制）が適切かを評価します。`,
    scoringGuidelines: {
      excellent: "影響範囲・重大度・初動アクション・エスカレーション・報告内容を一貫して整理し、実行可能な対応計画を示している",
      good: "主要な障害対応要素は整理されているが、判断根拠または報告・連絡の具体性に一部不足がある",
      needsImprovement: "対応方針は示しているが、影響評価・優先度・連絡体制のいずれかが曖昧で実行性が低い",
      poor: "障害対応に必要な初動整理が不足し、優先度判断や連絡方針が不明確",
    },
  },
  "business-execution": {
    description: (missionTitle) =>
      `${missionTitle}について、事業推進に必要な意思決定品質（トレードオフ整理・根拠・合意）が担保されているかを評価します。`,
    scoringGuidelines: {
      excellent: "選択肢の比較軸と判断根拠が明確で、合意事項・保留事項・次アクションまで実行可能な形で整理されている",
      good: "意思決定の方向性と合意内容は明確だが、比較根拠またはフォローアップの具体性に一部不足がある",
      needsImprovement: "意思決定には触れているが、比較軸や根拠が弱く、合意内容が曖昧",
      poor: "事業推進に必要なトレードオフ整理や合意形成が不十分で、実行計画につながらない",
    },
  },
  challenge: {
    description: (missionTitle) =>
      `${missionTitle}について、論点整理と合意形成まで一貫して実行できているかを評価します。`,
    scoringGuidelines: {
      excellent: "論点を構造化し、意思決定の根拠・合意内容・フォローアップまで具体的に示している",
      good: "論点整理と合意形成はできているが、根拠またはフォローアップの具体性が不足している",
      needsImprovement: "論点整理はあるが、意思決定の根拠や合意形成が弱い",
      poor: "論点整理や合意形成が不十分で、ミッションの達成が確認できない",
    },
  },
};

const distributeWeights = (count: number): number[] => {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const weights = Array(count).fill(base);
  let remainder = 100 - base * count;
  let index = 0;
  while (remainder > 0 && index < weights.length) {
    weights[index] += 1;
    remainder -= 1;
    index += 1;
  }
  return weights;
};

const resolveMissionCriteriaMode = (scenario: Scenario): MissionCriteriaMode => {
  if (scenario.scenarioType === "test-cases") return "test-case-quality";
  if (scenario.scenarioType === "requirement-definition") return "requirement-definition";
  if (scenario.scenarioType === "incident-response") return "incident-response";
  if (scenario.scenarioType === "business-execution") return "business-execution";
  return "basic-communication";
};

const buildMissionBasedCriteria = (scenario: Scenario): RatingCriterion[] => {
  const missions = [...(scenario.missions ?? [])].sort((a, b) => a.order - b.order);
  if (missions.length === 0) return [];

  const template = missionCriteriaTemplates[resolveMissionCriteriaMode(scenario)];
  const weights = distributeWeights(missions.length);

  return missions.map((mission, index) => {
    const missionDescription = mission.description?.trim();
    return {
      id: `${scenario.id}-mission-criterion-${mission.id}`,
      name: mission.title,
      weight: weights[index] ?? 100,
      description: missionDescription
        ? `${mission.title}: ${missionDescription}`
        : template.description(mission.title),
      scoringGuidelines: template.scoringGuidelines,
    };
  });
};

const scenarioSpecificCriteriaIds = new Set([
  "basic-intro-alignment",
  "basic-ticket-refine",
  "basic-testcase-design",
  "basic-meeting-minutes",
  "basic-docs-refine",
  "basic-test-viewpoints",
  "basic-unknowns-discovery",
  "basic-schedule-share",
]);

const applyMissionBasedCriteriaToScenarios = (list: Scenario[]) => {
  list.forEach((scenario) => {
    if (scenarioSpecificCriteriaIds.has(scenario.id)) return;
    const missionBasedCriteria = buildMissionBasedCriteria(scenario);
    if (missionBasedCriteria.length === 0) return;
    scenario.evaluationCriteria = missionBasedCriteria;
  });
};

const applyBasicPromptRoles = (list: Scenario[]) => {
  list.forEach((scenario) => {
    const existingOpening = scenario.agentOpeningMessage?.trim();

    // Always set agentOpeningMessage to kickoffPrompt if not already set
    if (!existingOpening) {
      scenario.agentOpeningMessage = scenario.kickoffPrompt;
    }
  });
};

const scenarioList: Scenario[] = [
  {
    id: "basic-product-understanding",
    title: "プロダクト理解",
    scenarioType: "soft-skills",
    description:
      "新しくプロジェクトに参加したPMとして、保険金請求サポートサービスのプロダクト概要を理解し、自分の言葉で整理する。",
    task: {
      instruction:
        "あなたは保険金請求サポートサービスのPMとして新しくプロジェクトに参加しました。\nプロダクトの概要を理解し、以下の観点で自分の言葉で整理してください。\nわからないことがあれば、遠慮なく質問してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: [
          "プロダクト概要（何を、誰に、なぜ提供しているか）",
          "対象ユーザーと主な課題（3つ）",
          "現在の主要機能と差別化ポイント",
          "自分が最初に深掘りしたいポイントと理由",
        ],
      },
      referenceInfo: `プロダクト情報は会話の中でエージェントに質問して確認してください。
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
■ 成功指標: 請求完了率の向上、差し戻し率の低下、初回支払いまでの日数短縮`,
      hints: [
        "プロダクト概要を書く際は「何を → 誰に → なぜ」の順で整理すると伝わりやすくなります。",
        "課題と機能を1対1で対応づけてみましょう。例: 「証跡が分かりづらい → ステップ形式のガイドで案内」",
        "「最初に深掘りしたいポイント」は正解がありません。ただし「なぜそこを深掘りしたいか」の理由を書くと、PMとしての思考が伝わります。例: 「差し戻し率30%の内訳を知りたい。原因が証跡の種類間違いなのか品質不足なのかで打ち手が変わるため。」",
      ],
    },
    product: sharedProduct,
    kickoffPrompt: "今回はプロダクト理解を練習します。提供された情報をもとに、プロダクトの全体像を自分の言葉で整理してみましょう。",
    evaluationCriteria: simpleIntroCriteria,
    passingScore: 60,
    missions: [
      {
        id: "product-m1",
        title: "プロダクトの目的と対象ユーザーを自分の言葉で説明する",
        order: 1,
      },
      {
        id: "product-m2",
        title: "ユーザーの課題とプロダクトの解決策を対応づけて整理する",
        order: 2,
      },
      {
        id: "product-m3",
        title: "自分がPMとして最初に深掘りしたいポイントを述べる",
        order: 3,
      },
    ],
  },
  {
    id: "basic-intro-alignment",
    title: "自己紹介",
    scenarioType: "soft-skills",
    description: "あなたは新しくプロジェクトに参加したPMです。チームの信頼を得るためにまずは自己紹介をしてみましょう。",
    task: {
      instruction: "新しくプロジェクトに参加したPMとして、チームに向けた自己紹介メッセージを作成してください。",
      deliverableFormat: "free-text",
      referenceInfo: "あなたは新しくプロジェクトに参加したPMです。自己紹介をしてください。",
    },
    assistanceMode: "on-request",
    behavior: { singleResponse: true, agentResponseEnabled: false },
    product: sharedProduct,
    kickoffPrompt: "今回はPMとしての自己紹介を練習します。チームに自分の役割と期待値を伝えてみましょう。",
    evaluationCriteria: introAlignmentCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-intro-m1", title: "自己紹介をする", order: 1 },
    ],
  },
  {
    id: "basic-schedule-share",
    title: "ミーティング調整",
    scenarioType: "soft-skills",
    description: "他のメンバーとミーティングを組む時に送るメッセージを作成してください。",
    task: {
      instruction: "要件詰めのミーティングを開催するため、関係者に送る調整メッセージを作成してください。",
      deliverableFormat: "free-text",
      template: {
        format: "free-text",
        checklist: ["目的", "議題", "日時候補", "参加者"],
      },
      referenceInfo: "要件詰めのミーティングを開催予定です。関係者のスケジュール調整をする時に送るメッセージを作成してください。",
    },
    assistanceMode: "on-request",
    behavior: { singleResponse: true, agentResponseEnabled: false },
    product: sharedProduct,
    kickoffPrompt: "今回はミーティング調整メッセージの作成を練習します。関係者が参加しやすい調整連絡を作りましょう。",
    evaluationCriteria: scheduleShareCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-schedule-m1", title: "ミーティング調整メッセージを作成する", order: 1 },
    ],
  },
  {
    id: "test-login",
    title: "ログイン機能",
    scenarioType: "test-cases",
    featureMockup: {
      component: "login",
      description: "メールアドレスとパスワードで認証するログインフォームです。",
    },
    description: "ログイン機能のテストケースを作成し、認証フローとセキュリティ観点を網羅する。",
    task: {
      instruction: "ログイン機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["正常系テストケース", "異常系テストケース", "前提条件とテストデータ"],
      },
      referenceInfo: `ログイン仕様:
- メールアドレス: 有効なメール形式のみ
- パスワード: 8文字以上
- ログイン試行: 5回失敗で15分ロック
- 「ログイン状態を保持」: 30日間有効
パスワード誤り、アカウントロック、セッション管理などの観点を意識してください。`,
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はログイン機能のテストケース作成に取り組みます。認証フローとセキュリティの観点を意識しましょう。",
    evaluationCriteria: testLoginCriteria,
    passingScore: 70,
    missions: [
      { id: "test-login-m1", title: "正常系ログインフローを列挙する", order: 1 },
      { id: "test-login-m2", title: "異常系・セキュリティ観点を洗い出す", order: 2 },
      { id: "test-login-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
  },
  {
    id: "test-form",
    title: "フォーム機能",
    scenarioType: "test-cases",
    featureMockup: {
      component: "form",
      description: "お問い合わせフォームです。入力検証とエラー表示を確認できます。",
    },
    description: "入力フォームのテストケースを作成し、バリデーションとUXを網羅する。",
    task: {
      instruction: "フォーム機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["入力バリデーションケース", "エラー表示と操作性", "前提条件とテストデータ"],
      },
      referenceInfo: `フォーム仕様:
- 必須項目: 名前、メール、カテゴリ、内容、同意
- メール: 有効な形式のみ
- 電話: 任意、10〜13桁の数字とハイフン
- 内容: 10〜1000文字
必須/任意、フォーマット、文字種、長さ制限などの観点を網羅してください。`,
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はフォーム機能のテストケース作成に取り組みます。入力バリデーションとUXの観点を意識しましょう。",
    evaluationCriteria: testFormCriteria,
    passingScore: 70,
    missions: [
      { id: "test-form-m1", title: "入力バリデーションケースを列挙する", order: 1 },
      { id: "test-form-m2", title: "エラー表示と操作性を検討する", order: 2 },
      { id: "test-form-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
  },
  {
    id: "test-file-upload",
    title: "ファイルアップロード機能",
    scenarioType: "test-cases",
    featureMockup: {
      component: "file-upload",
      description: "ドラッグ＆ドロップ対応のファイルアップロード機能です。",
    },
    description: "ファイルアップロード機能のテストケースを作成し、ファイル検証とセキュリティを網羅する。",
    task: {
      instruction: "ファイルアップロード機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["ファイル種別・サイズ検証ケース", "エラー処理とセキュリティ", "前提条件とテストデータ"],
      },
      referenceInfo: `アップロード仕様:
- 対応形式: JPEG, PNG, GIF, PDF
- 最大サイズ: 10MB/ファイル
- 最大ファイル数: 5
- ドラッグ＆ドロップ対応
- アップロード失敗時は再試行可能
拡張子偽装、ウイルスチェック、ストレージ容量などのセキュリティ観点を意識してください。`,
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はファイルアップロード機能のテストケース作成に取り組みます。ファイル検証とセキュリティの観点を意識しましょう。",
    evaluationCriteria: testFileUploadCriteria,
    passingScore: 70,
    missions: [
      { id: "test-upload-m1", title: "ファイル種別とサイズ検証ケースを列挙する", order: 1 },
      { id: "test-upload-m2", title: "エラー処理とセキュリティ観点を検討する", order: 2 },
      { id: "test-upload-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
  },
  {
    id: "basic-requirement-definition-doc",
    title: "ログイン機能",
    scenarioType: "requirement-definition",
    description: "ログイン機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "ログイン機能の要件定義を行ってください。『ログインできない』問い合わせが増えているため、最低限のログイン体験を安定化するための要件を整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "受入条件", "非対象と不明点の確認"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。目的・対象ユーザーの確認、受入条件と非対象の整理、不明点の確認先と期限の設定まで行ってください。",
    },
    product: sharedProduct,
    kickoffPrompt: "今回はログイン機能の要件定義を練習します。問い合わせ増加という課題に対して、要件を段階的に整理していきましょう。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqdoc-m2", title: "ログイン成功/失敗時の要件を定義する", order: 1 },
    ],
  },
  {
    id: "basic-requirement-hearing-plan",
    title: "問い合わせフォーム機能",
    scenarioType: "requirement-definition",
    description: "問い合わせフォーム機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "問い合わせフォーム機能の要件を整理してください。CSの入力項目削減要求と法務の同意取得厳格化の両立を検討し、要件定義を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "入力/送信/エラー時の受入条件", "非対象と不明点の確認アクション"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。入力バリデーション、送信失敗時の扱い、同意取得の境界を明確にし、不明点の確認計画まで整理してください。",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回は問い合わせフォーム機能の要件定義を練習します。CS側と法務側の対立する要求をどう両立させるかを考えましょう。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqhear-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqhear-m2", title: "入力/送信/エラー時の受入条件を定義する", order: 2 },
      { id: "basic-reqhear-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
  },
  {
    id: "basic-requirement-user-story",
    title: "ファイルアップロード機能",
    scenarioType: "requirement-definition",
    description: "ファイルアップロード機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "ファイルアップロード機能の要件を整理してください。営業の早期リリース要求とインフラのサイズ制限遵守の両立を検討し、要件定義を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "形式/サイズ/失敗時の受入条件", "非対象と不明点の確認アクション"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。許可形式、サイズ上限、失敗時リトライの期待挙動を明確化し、不明点の確認計画まで整理してください。",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はファイルアップロード機能の要件定義を練習します。早期リリースとサイズ制限の両立を考えましょう。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqstory-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqstory-m2", title: "形式/サイズ/失敗時の受入条件を定義する", order: 2 },
      { id: "basic-reqstory-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
  },
  {
    id: "coming-stakeholder-negotiation",
    scenarioType: "business-execution",
    title: "ステークホルダー優先度交渉",
    description: "営業の早期リリース要求と開発の品質要求が対立する状況で、優先度の合意形成を進める。",
    task: {
      instruction: "営業と開発の対立する要求を整理し、優先度の合意形成を進めてください。対立点と共通目的を明確にし、譲歩案と判断基準を示した上で合意事項をまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["対立点と共通目的", "譲歩案と判断基準", "合意事項・保留事項・次アクション"],
      },
      referenceInfo: "状況:\n- 営業は「今月中に新機能を出したい」と主張している\n- 開発は「品質基準を満たさない限りリリースできない」と主張している\n- 両者の視点にはそれぞれ合理的な根拠がある\n- PMとして対立点を整理し、合意形成に向けた交渉を進める必要がある",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はステークホルダー間の優先度交渉に取り組みます。営業と開発の対立する要求を整理し、合意形成を目指しましょう。",
    evaluationCriteria: scopeNegotiationCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-stakeholder-m1", title: "対立点と共通目的を明確化する", order: 1 },
      { id: "coming-stakeholder-m2", title: "譲歩案と判断基準を提示する", order: 2 },
      { id: "coming-stakeholder-m3", title: "合意事項・保留事項・次アクションを確定する", order: 3 },
    ],
  },
  {
    id: "coming-priority-tradeoff-workshop",
    scenarioType: "business-execution",
    title: "優先度トレードオフ",
    description: "複数要望を価値/工数/リスクで比較し、段階リリース方針を合意する。",
    task: {
      instruction: "次リリース候補の3案を価値・工数・リスクで比較し、段階リリースの合意案を作ってください。比較軸を定義し、採用案と却下案を整理した上で判断理由をまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["比較軸の定義と各案の評価", "採用案と却下案", "段階リリース計画と判断理由"],
      },
      referenceInfo: "状況:\n- 次リリース候補として「高速検索」「通知改善」「管理画面改修」の3案がある\n- 各案の価値・工数・リスクを比較する必要がある\n- PMとしてトレードオフを分析し、段階リリース方針の合意を導く必要がある",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回は優先度トレードオフの分析に取り組みます。3つのリリース候補を価値・工数・リスクで比較しましょう。",
    evaluationCriteria: scopeNegotiationCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-tradeoff-m1", title: "比較軸を定義して各案を評価する", order: 1 },
      { id: "coming-tradeoff-m2", title: "採用案と却下案を整理する", order: 2 },
      { id: "coming-tradeoff-m3", title: "段階リリース計画と判断理由を合意する", order: 3 },
    ],
  },

  {
    id: "coming-decision-log-alignment",
    scenarioType: "business-execution",
    title: "意思決定ログ共有と認識合わせ",
    description: "既存の意思決定ログをもとに、関係者間の認識ズレを解消する。",
    task: {
      instruction: "意思決定ログを整理し、関係者間の認識ズレを解消してください。ズレているポイントを特定し、背景と根拠を再整理した上で共有文面と確認ポイントをまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["ズレている認識ポイント", "意思決定の背景と根拠", "共有文面と確認ポイント"],
      },
      referenceInfo: "状況:\n- 先週決めた「段階リリース方針」について、営業と開発で認識にズレが出ている\n- 各関係者は過去の意思決定について微妙に異なる理解を持っている\n- PMとして意思決定ログを整理し、共有メッセージと確認ポイントを作成する必要がある",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回は意思決定ログの認識合わせに取り組みます。関係者間のズレを特定し、共通理解を形成しましょう。",
    evaluationCriteria: stakeholderAlignmentCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-decisionlog-m1", title: "ズレている認識ポイントを特定する", order: 1 },
      { id: "coming-decisionlog-m2", title: "意思決定の背景と根拠を再整理する", order: 2 },
      { id: "coming-decisionlog-m3", title: "共有文面と確認ポイントを確定する", order: 3 },
    ],
  },
  {
    id: "coming-incident-response",
    scenarioType: "incident-response",
    title: "P1障害: ログイン不能バグの緊急対応",
    description: "全ユーザーがログインできない致命的不具合に対し、初動対応と報告方針を整理する。",
    task: {
      instruction: "P1障害が発生しました。以下の状況を読み、PMとして初動対応計画を作成してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["影響範囲と緊急度", "初動対応アクション", "連絡先とエスカレーション", "初回報告文"],
      },
      referenceInfo: "状況:\n- 本番環境でログインAPIが500エラーを返し続けている\n- 全ユーザーがログイン不能\n- 発生時刻: 不明（最初のアラートから10分経過）\n- 影響範囲: 全ユーザー",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はP1障害の緊急対応チャレンジです。全ユーザーがログインできない状況への初動対応を考えましょう。",
    evaluationCriteria: projectRescueCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-incident-m1", title: "影響範囲と緊急度を確定する", order: 1 },
      { id: "coming-incident-m2", title: "初動対応と暫定復旧方針を決める", order: 2 },
      { id: "coming-incident-m3", title: "初回報告とエスカレーションを実行する", order: 3 },
    ],
  },
  {
    id: "coming-incident-triage-escalation",
    scenarioType: "incident-response",
    title: "P2障害: 決済遅延バグ",
    description: "一部ユーザーで決済完了通知が遅延する重大不具合について、トリアージとエスカレーション判断を行う。",
    task: {
      instruction: "P2障害が発生しています。以下の状況を読み、PMとして優先度判定とエスカレーション判断を整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["事象の再現条件と影響範囲", "優先度判定と根拠", "エスカレーション経路", "報告リズムと次回報告時刻"],
      },
      referenceInfo: "状況:\n- 決済処理自体は成功しているが、完了通知の反映が最大20分遅延\n- 一部ユーザーに影響\n- P2想定",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はP2障害のトリアージチャレンジです。決済通知遅延の優先度判定とエスカレーション判断を行いましょう。",
    evaluationCriteria: progressVisibilityCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-triage-m1", title: "事象の再現条件と影響ユーザーを特定する", order: 1 },
      { id: "coming-triage-m2", title: "優先度と対応期限を決定する", order: 2 },
      { id: "coming-triage-m3", title: "エスカレーション先と報告リズムを確定する", order: 3 },
    ],
  },
  {
    id: "coming-postmortem-followup",
    scenarioType: "incident-response",
    title: "P3障害: 表示崩れバグの再発防止",
    description: "特定端末で発生する軽微不具合について、原因分析と再発防止策を整理する。",
    task: {
      instruction: "P3不具合が報告されました。以下の状況を読み、PMとして原因分析と再発防止策を整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["事実と原因仮説", "暫定対応と恒久対応", "再発防止アクション（担当・期限）", "検証方法"],
      },
      referenceInfo: "状況:\n- Androidの一部端末でプロフィール画面のボタンが重なって表示崩れ\n- P3: 影響は限定的\n- 再発防止の仕組みづくりが求められている",
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はP3障害の再発防止チャレンジです。軽微な表示崩れの原因分析と再発防止策を整理しましょう。",
    evaluationCriteria: stakeholderAlignmentCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-postmortem-m1", title: "事実と原因仮説を切り分ける", order: 1 },
      { id: "coming-postmortem-m2", title: "恒久対応と暫定対応を決定する", order: 2 },
      { id: "coming-postmortem-m3", title: "再発防止アクションを担当・期限付きで合意する", order: 3 },
    ],
  },
  // ============================================================================
  // Advanced Scenarios: 事業推進・戦略
  // ============================================================================
  {
    id: "adv-data-roi",
    scenarioType: "business-execution",
    title: "ROI分析: AI証跡チェック機能の投資判断",
    description:
      "AI証跡チェック機能の開発投資について、3シナリオのROIモデルを作成し、投資判断の根拠を整理する。",
    task: {
      instruction:
        "AI証跡チェック機能の開発に必要な投資（エンジニア3名×3ヶ月 = 約1,500万円）に対するROIモデルを作成してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: [
          "インパクト計算式（各変数の定義と根拠）",
          "3シナリオ分析（悲観的 / 現実的 / 楽観的）",
          "投資判断の推奨と根拠",
        ],
      },
      referenceInfo: `前提データ:
- 月間請求件数: 10,000件
- 現在の差し戻し率: 30%（3,000件/月）
- 差し戻し1件あたりのコスト:
  - ユーザー側: 再提出に平均2時間（機会損失）
  - 運用チーム側: 確認・連絡に平均20分（人件費換算 約800円/件）
- 月間運用コスト: 3,000件 × 800円 = 240万円
- 開発コスト: エンジニア3名 × 3ヶ月 = 約1,500万円
- ユーザーLTV: 請求完了ユーザーの年間継続率80%、年間保険料平均12万円

ROI計算式:
Impact = 対象件数 × 現在の差し戻し率 × 期待改善率 × 1件あたり削減コスト`,
      hints: [
        "「対象件数」は月間10,000件ではなく、採用率を掛けた数字を使いましょう。悲観シナリオでは3,000件（30%採用）です。",
        "コスト削減だけでなく、請求完了率の改善によるLTV向上も収益インパクトに含めましょう。",
        "経営層への報告では「最悪でも○ヶ月で回収、現実的には○倍のROI」という形で伝えると判断しやすくなります。",
      ],
    },
    assistanceMode: "on-request",
    behavior: { singleResponse: true },
    product: sharedProduct,
    kickoffPrompt: "今回はAI証跡チェック機能のROI分析に取り組みます。投資判断に必要な3シナリオモデルを作成しましょう。",
    evaluationCriteria: simpleIntroCriteria,
    passingScore: 60,
    missions: [
      {
        id: "roi-m1",
        title: "インパクト計算の各変数を定義し根拠を示す",
        order: 1,
      },
      {
        id: "roi-m2",
        title: "3シナリオ（悲観/現実/楽観）を作成する",
        order: 2,
      },
      {
        id: "roi-m3",
        title: "投資判断の推奨を根拠付きで示す",
        order: 3,
      },
    ],
  },
  // ============================================================================
  // Advanced Scenarios: 戦略・方針
  // ============================================================================
  {
    id: "adv-strategy-diagnosis",
    scenarioType: "business-execution",
    title: "プロダクト戦略: 請求サービスの競争優位",
    description:
      "保険金請求サービスの戦略的課題を診断し、競争優位を確立するための方針と行動計画を策定する。",
    task: {
      instruction:
        "保険金請求サービスの戦略を、診断→方針→行動の3ステップで策定してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: [
          "診断（DIAGNOSIS）: 戦略的課題は何か",
          "方針（GUIDING POLICY）: どこで、どう戦うか",
          "行動計画（COHERENT ACTIONS）: 具体的に何をするか（Q1/Q2）",
          "前提条件と見直し条件",
        ],
      },
      referenceInfo: `現状:
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
- 「全部やる」は不可能 — 何を捨てるかの判断が必要`,
      hints: [
        "診断では「何が問題か」だけでなく「なぜそれが最も重要な問題か」を説明しましょう。",
        "方針には必ず「やらないこと」を書きましょう。やることだけでは方針になりません。",
        "行動計画のQ1施策がQ2施策の土台になっているか確認しましょう。施策が互いに強化し合う構成が理想です。",
      ],
    },
    assistanceMode: "guided",
    product: sharedProduct,
    kickoffPrompt: "今回はプロダクト戦略の策定チャレンジです。限られたリソースで競争優位を確立する方針を考えましょう。",
    evaluationCriteria: simpleIntroCriteria,
    passingScore: 60,
    missions: [
      {
        id: "strategy-m1",
        title: "戦略的課題を診断する（データと競合分析に基づく）",
        order: 1,
      },
      {
        id: "strategy-m2",
        title: "方針を策定する（トレードオフを明示する）",
        order: 2,
      },
      {
        id: "strategy-m3",
        title: "Q1/Q2の行動計画を策定する（方針と整合した具体的施策）",
        order: 3,
      },
    ],
  },
];

const scenarioGuideMessages: Record<string, string> = {
  "basic-intro-alignment":
    "あなたは新しくプロジェクトに参加したPMです。チームの信頼を得るため、まずは簡潔に自己紹介をしましょう。",
  "basic-meeting-minutes":
    "会議内容を振り返り、決定事項と次のアクションが伝わる議事メモを作成して共有しましょう。",
  "basic-schedule-share":
    "関係者が参加しやすいように、目的と候補日時を明確にしたミーティング調整メッセージを作成しましょう。",
  "basic-docs-refine":
    "既存資料の目的と読み手を意識して、伝わりにくい表現をわかりやすく修正しましょう。",
  "basic-ticket-refine":
    "実装前の認識をそろえるため、チケットの目的・受入条件・懸念点を整理しましょう。",
  "basic-ticket-splitting":
    "大きなチケットを実行しやすい単位に分割し、優先度の高い順に並べましょう。",
  "basic-acceptance-review":
    "要件の抜け漏れを防ぐため、受入条件をレビューして改善案を提示しましょう。",
  "basic-unknowns-discovery":
    "着手前の不確実性を減らすため、未確定事項と確認方法を明確にしましょう。",
  "basic-testcase-design":
    "品質を担保するため、正常系・異常系・境界値を含むテストケースを整理しましょう。",
  "test-login":
    "ログイン機能の挙動を確認し、必要なテストケースを作成して提出しましょう。",
  "test-form":
    "フォーム機能の入力検証とエラー表示を確認し、必要なテストケースを作成して提出しましょう。",
  "test-file-upload":
    "ファイルアップロード機能の制約とエラー動作を確認し、必要なテストケースを作成して提出しましょう。",
  "test-password-reset":
    "パスワード再設定フローを確認し、正常系と異常系のテストケースを作成して提出しましょう。",
  "test-search-filter":
    "検索・絞り込み機能の条件組み合わせを確認し、必要なテストケースを作成して提出しましょう。",
  "test-notification-settings":
    "通知設定機能の保存・反映・権限まわりを確認し、必要なテストケースを作成して提出しましょう。",
  "test-profile-edit":
    "プロフィール編集機能の入力制約と保存処理を確認し、必要なテストケースを作成して提出しましょう。",
  "basic-test-viewpoints":
    "漏れのない検証のため、テスト観点を洗い出して優先度を整理しましょう。",
  "basic-test-risk-review":
    "テスト計画の弱点を早期に見つけるため、リスク観点でレビューして改善案を示しましょう。",
  "basic-regression-smoke":
    "限られた時間で品質を守るため、回帰テストの最小セットを整理しましょう。",
  "basic-requirement-definition-doc":
    "ログイン機能の要件を明確にするため、ユーザーストーリーと受入条件を具体化しましょう。",
  "basic-requirement-hearing-plan":
    "問い合わせフォーム機能の要件を明確にするため、ユーザーストーリーと受入条件を整理しましょう。",
  "basic-requirement-user-story":
    "ファイルアップロード機能の要件を明確にするため、ユーザーストーリーと受入条件を定義しましょう。",
  "basic-requirement-nfr":
    "パスワード再設定機能に必要な品質要件も含めて、ユーザーストーリーと受入条件を定義しましょう。",
  "basic-requirement-priority-matrix":
    "検索・絞り込み機能の要件を優先度付きで整理し、受入条件まで明確にしましょう。",
  "basic-requirement-risk-check":
    "通知設定機能の要件を整理し、リスクを踏まえた受入条件を定義しましょう。",
  "basic-requirement-consensus":
    "プロフィール編集機能の要件について、関係者が合意できるユーザーストーリーと受入条件をまとめましょう。",
  "coming-stakeholder-negotiation":
    "営業と開発の要求が対立する状況で、優先度の根拠を示しながら合意形成を進めましょう。",
  "coming-priority-tradeoff-workshop":
    "複数要望を価値・工数・リスクで比較し、納得感のある段階リリース方針をまとめましょう。",
  "coming-decision-log-alignment":
    "過去の意思決定ログをもとに認識のズレを整理し、同じ理解で前進できる状態を作りましょう。",
  "coming-incident-response":
    "ログイン不能の重大障害に対して、初動対応・報告方針・次アクションを迅速に確定しましょう。",
  "coming-incident-triage-escalation":
    "決済遅延の重大不具合について、影響範囲を見極めて適切なトリアージとエスカレーションを行いましょう。",
  "coming-postmortem-followup":
    "軽微障害の再発を防ぐため、原因分析と実行可能な再発防止策を合意しましょう。",
  "coming-sprint-retrospective":
    "スプリントを振り返り、次回に効く改善アクションを具体的に決めましょう。",
  "coming-release-readiness-review":
    "リリース判断に必要な情報をそろえ、Go/No-Goの根拠を明確にしましょう。",
  "coming-kpi-review-action":
    "KPIの変化要因を整理し、次に実行する改善施策を定義しましょう。",
  "challenge-project-rescue":
    "遅延プロジェクトを立て直すため、スコープ再交渉とリカバリ計画を短時間でまとめましょう。",
  "challenge-deadline-advance":
    "期限前倒しの状況で影響を分析し、実現可能な打ち手を提案して合意を得ましょう。",
  "challenge-progress-visibility":
    "進捗が見えない状況を改善するため、可視化方法と具体的な打ち手を設計しましょう。",
  "challenge-quality-fire":
    "品質問題の緊急対応を進めつつ、優先度を再整理して実行計画を立てましょう。",
  "challenge-ambiguous-request":
    "曖昧な依頼を具体化し、合意できるスコープと次アクションを定めましょう。",
  "challenge-scope-addition":
    "追加スコープ要求に対して、制約を踏まえた調整案を示し合意形成を進めましょう。",
  "challenge-scope-negotiation":
    "スコープ削減かリソース増加かを比較し、関係者と現実的な合意を作りましょう。",
  "challenge-impossible-request":
    "技術的制約を丁寧に確認し、実現可能な代替案で合意を目指しましょう。",
  "challenge-conflict-mediation":
    "開発・QA・ビジネスの対立を整理し、全員が前進できる合意点を導きましょう。",
  "challenge-priority-conflict":
    "優先度対立の論点を可視化し、納得感のある優先順位に収束させましょう。",
  "challenge-stakeholder-misalignment":
    "ステークホルダー間の期待値のズレを解消し、再発防止まで含めて合意しましょう。",
  "challenge-user-perspective":
    "抜けているユーザー視点を取り戻し、価値に基づいた改善案を合意しましょう。",
  "basic-product-understanding":
    "プロダクトの全体像を掴み、ユーザー・課題・差別化を自分の言葉で整理しましょう。",
  "adv-data-roi":
    "AI証跡チェック機能の3シナリオROIモデルを作成し、投資判断の根拠を整理しましょう。",
  "adv-strategy-diagnosis":
    "請求サービスの戦略的課題を診断し、方針と行動計画をRumelt's Strategy Kernelで策定しましょう。",
};

const applyScenarioGuideMessages = (list: Scenario[]) => {
  // This function is kept for compatibility but guideMessage is no longer a property
};

export const getScenarioDiscipline = (scenario: Scenario): "BASIC" | "CHALLENGE" => {
  // Map scenarioType back to discipline for backward compatibility
  // soft-skills, test-cases, requirement-definition are BASIC
  // incident-response, business-execution are CHALLENGE
  if (scenario.scenarioType === "incident-response" || scenario.scenarioType === "business-execution") {
    return "CHALLENGE";
  }
  return "BASIC";
};

const requireScenarioSummary = (id: string): ScenarioSummary => {
  const scenario = scenarioList.find((item) => item.id === id);
  if (!scenario) {
    throw new Error(`Scenario summary not found: ${id}`);
  }
  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
  };
};

applyBasicPromptRoles(scenarioList);
applyMissionBasedCriteriaToScenarios(scenarioList);
applyScenarioGuideMessages(scenarioList);

export const homeScenarioCatalog: ScenarioCatalogCategory[] = [
  {
    id: "soft-skills",
    title: "",
    subcategories: [
      {
        id: "basic-soft-skills",
        title: "基礎ソフトスキル",
        scenarios: [
          requireScenarioSummary("basic-product-understanding"),
          requireScenarioSummary("basic-intro-alignment"),
          requireScenarioSummary("basic-schedule-share"),
        ],
      },
    ],
  },
  {
    id: "test-cases",
    title: "",
    subcategories: [
      {
        id: "test-case-creation",
        title: "テストケース作成",
        scenarios: [
          requireScenarioSummary("test-login"),
          requireScenarioSummary("test-form"),
          requireScenarioSummary("test-file-upload"),
        ],
      },
    ],
  },
  {
    id: "requirement-definition",
    title: "",
    subcategories: [
      {
        id: "requirement-definition-foundation",
        title: "要件定義",
        scenarios: [
          requireScenarioSummary("basic-requirement-definition-doc"),
          requireScenarioSummary("basic-requirement-hearing-plan"),
          requireScenarioSummary("basic-requirement-user-story"),
        ],
      },
    ],
  },
  {
    id: "incident-response",
    title: "",
    subcategories: [
      {
        id: "incident-response-management",
        title: "障害対応",
        scenarios: [
          requireScenarioSummary("coming-incident-response"),
          requireScenarioSummary("coming-incident-triage-escalation"),
          requireScenarioSummary("coming-postmortem-followup"),
        ],
      },
    ],
  },
  {
    id: "business-execution",
    title: "",
    subcategories: [
      {
        id: "business-execution-strategy",
        title: "事業推進・戦略",
        scenarios: [
          requireScenarioSummary("coming-priority-tradeoff-workshop"),
          requireScenarioSummary("coming-stakeholder-negotiation"),
          requireScenarioSummary("coming-decision-log-alignment"),
          requireScenarioSummary("adv-data-roi"),
          requireScenarioSummary("adv-strategy-diagnosis"),
        ],
      },
    ],
  },
];

export const comingSoonScenarioCatalog: ScenarioCatalogCategory[] = [];

export const comingSoonScenarios: ScenarioSummary[] = comingSoonScenarioCatalog.flatMap((category) =>
  category.subcategories.flatMap((subcategory) => subcategory.scenarios)
);

export const defaultScenario = scenarioList[0];

export function getScenarioById(id: string | null): Scenario | undefined {
  if (!id) return undefined;
  return scenarioList.find((s) => s.id === id);
}

export function getScenarioKickoff(id: string | null): string | undefined {
  return getScenarioById(id)?.kickoffPrompt;
}

export function getScenarioSummary(id: string | null): ScenarioSummary | undefined {
  const scenario = getScenarioById(id);
  if (!scenario) return undefined;
  const { description, title: scenarioTitle } = scenario;
  return { id: scenario.id, title: scenarioTitle, description };
}
