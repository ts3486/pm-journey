import type {
  RatingCriterion,
  Scenario,
  ScenarioCatalogCategory,
  ScenarioCatalogSection,
  ScenarioDiscipline,
  ScenarioBehavior,
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

// 2. basic-ticket-refine: チケット要件整理
const ticketRefineCriteria: RatingCriterion[] = [
  {
    id: "ticket-goal-clarity",
    name: "目的・ゴールの明確化",
    weight: 25,
    description: "チケットの目的とユーザー価値を明確に定義できているか",
    scoringGuidelines: {
      excellent: "ユーザーストーリー形式で目的を明文化。ビジネス価値と技術要件を紐付け",
      good: "目的を説明。ユーザー価値の記述が一部抽象的",
      needsImprovement: "目的に言及したが、ゴールが曖昧",
      poor: "目的・ゴールの定義がない",
    },
  },
  {
    id: "ticket-acceptance",
    name: "受入条件(AC)の定義",
    weight: 30,
    description: "観測可能で検証可能な受入条件を設定できているか",
    scoringGuidelines: {
      excellent: "3件以上の具体的AC。Given-When-Then形式または同等の明確さ",
      good: "ACを定義。一部が主観的または曖昧",
      needsImprovement: "ACを試みたが、検証可能性が低い",
      poor: "ACが定義されていない",
    },
  },
  {
    id: "ticket-dependency",
    name: "依存関係の整理",
    weight: 25,
    description: "技術的・チーム間の依存を特定し、担当と期日を明記できているか",
    scoringGuidelines: {
      excellent: "依存先を特定し、担当者・期日・確認方法を明記",
      good: "依存を特定。担当または期日が一部未定",
      needsImprovement: "依存に言及したが詳細が不足",
      poor: "依存関係の整理がない",
    },
  },
  {
    id: "ticket-risk",
    name: "リスクの特定",
    weight: 20,
    description: "実装上のリスクや不確実性を洗い出し、対策を検討できているか",
    scoringGuidelines: {
      excellent: "2件以上のリスクを特定し、影響と対策を記載",
      good: "リスクを特定。対策が一部曖昧",
      needsImprovement: "リスクに言及したが分析が浅い",
      poor: "リスクの検討がない",
    },
  },
];

// 3. basic-testcase-design: テストケース作成
const testcaseDesignCriteria: RatingCriterion[] = [
  {
    id: "test-normal-flow",
    name: "正常系の網羅性",
    weight: 30,
    description: "主要なユーザーフローと正常系パスを漏れなくカバーしているか",
    scoringGuidelines: {
      excellent: "主要フローを網羅。ユーザーシナリオに基づき論理的に構成",
      good: "正常系をカバー。一部のフローが欠落",
      needsImprovement: "基本的なケースのみ。網羅性が不足",
      poor: "正常系の洗い出しが不十分",
    },
  },
  {
    id: "test-edge-cases",
    name: "異常系・境界値の考慮",
    weight: 30,
    description: "エラーケース、境界値、エッジケースを適切に洗い出しているか",
    scoringGuidelines: {
      excellent: "境界値・エラー・権限・並行処理など多角的に検討",
      good: "主要な異常系をカバー。一部のエッジケースが欠落",
      needsImprovement: "異常系に言及したが体系的でない",
      poor: "異常系の検討がほぼない",
    },
  },
  {
    id: "test-precondition",
    name: "前提条件の明確化",
    weight: 20,
    description: "テストデータ、環境、前提条件を明記しているか",
    scoringGuidelines: {
      excellent: "各ケースにテストデータ・環境・初期状態を明記",
      good: "前提条件を記載。一部のケースで不足",
      needsImprovement: "前提条件の記述が断片的",
      poor: "前提条件の記載がない",
    },
  },
  {
    id: "test-priority",
    name: "優先度と効率性",
    weight: 20,
    description: "時間制約を考慮し、リスクベースで優先順位付けできているか",
    scoringGuidelines: {
      excellent: "リスク・頻度・影響度で優先順位付け。最小セットを意識",
      good: "優先度を設定。根拠が一部曖昧",
      needsImprovement: "優先度に言及したが基準が不明確",
      poor: "優先順位付けがない",
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

// 3b. basic-agenda-facilitation: アジェンダ設定と進行
const agendaFacilitationCriteria: RatingCriterion[] = [
  {
    id: "agenda-goal",
    name: "目的の明確化",
    weight: 25,
    description: "ミーティングの目的とゴールを一文で定義できているか",
    scoringGuidelines: {
      excellent: "目的・ゴール・期待アウトプットを簡潔に定義し、参加者と合意",
      good: "目的を定義。アウトプットの合意が一部不足",
      needsImprovement: "目的に触れたが曖昧",
      poor: "目的が定義されていない",
    },
  },
  {
    id: "agenda-structure",
    name: "アジェンダと時間設計",
    weight: 25,
    description: "議題と時間配分を設計できているか",
    scoringGuidelines: {
      excellent: "議題ごとに時間配分を設定し、議論の流れが明確",
      good: "議題と時間配分を提示。一部の粒度が粗い",
      needsImprovement: "議題はあるが時間設計が不足",
      poor: "アジェンダが設定されていない",
    },
  },
  {
    id: "agenda-facilitation",
    name: "進行と巻き込み",
    weight: 25,
    description: "脱線を防ぎつつ参加者の発言を引き出せているか",
    scoringGuidelines: {
      excellent: "論点を整理し、参加者の意見を引き出しながら進行",
      good: "進行はできているが、巻き込みが一部不足",
      needsImprovement: "進行に言及したが具体性が弱い",
      poor: "進行の意識がない",
    },
  },
  {
    id: "agenda-next-action",
    name: "次アクションの合意",
    weight: 25,
    description: "決定事項と次アクションを合意できているか",
    scoringGuidelines: {
      excellent: "決定事項と担当・期日付きアクションを合意",
      good: "決定事項と次アクションを整理。一部の詳細が不足",
      needsImprovement: "次アクションに触れたが具体性が不足",
      poor: "次アクションが合意されていない",
    },
  },
];

// 3c. basic-meeting-minutes: 議事メモ作成
const meetingMinutesCriteria: RatingCriterion[] = [
  {
    id: "minutes-decisions",
    name: "決定事項と未決事項の整理",
    weight: 30,
    description: "会議の結論と未決事項を明確に整理できているか",
    scoringGuidelines: {
      excellent: "決定事項と未決事項を明確に区分し、背景も簡潔に記載",
      good: "決定事項と未決事項を整理。一部の分類が曖昧",
      needsImprovement: "整理を試みたが情報が不足",
      poor: "決定事項/未決事項が不明確",
    },
  },
  {
    id: "minutes-actions",
    name: "アクションと担当・期日",
    weight: 30,
    description: "次アクションに担当と期日を付けて記載できているか",
    scoringGuidelines: {
      excellent: "全アクションに担当・期日・成果物を明記",
      good: "担当と期日を付けるが一部抜けがある",
      needsImprovement: "アクションはあるが担当/期日が曖昧",
      poor: "アクションが整理されていない",
    },
  },
  {
    id: "minutes-clarity",
    name: "要点の簡潔さ",
    weight: 20,
    description: "要点を簡潔にまとめ、読みやすい構成になっているか",
    scoringGuidelines: {
      excellent: "要点を短く整理し、誰が読んでも理解できる構成",
      good: "概ね簡潔だが一部冗長",
      needsImprovement: "要点が散漫で読みづらい",
      poor: "整理されておらず理解が難しい",
    },
  },
  {
    id: "minutes-share",
    name: "共有と確認",
    weight: 20,
    description: "共有方法と確認ポイントを明確にできているか",
    scoringGuidelines: {
      excellent: "共有方法と確認期限を明記し、フィードバック導線も提示",
      good: "共有方法を明記。一部の確認事項が不足",
      needsImprovement: "共有に触れたが具体性が不足",
      poor: "共有・確認の記載がない",
    },
  },
];

// 3d. basic-docs-refine: 資料の軽微修正
const docsRefineCriteria: RatingCriterion[] = [
  {
    id: "docs-goal",
    name: "目的と対象の整理",
    weight: 25,
    description: "資料の目的と対象読者を明確にできているか",
    scoringGuidelines: {
      excellent: "目的と対象読者を明確化し、期待アウトカムまで整理",
      good: "目的と対象を整理。一部が曖昧",
      needsImprovement: "目的に触れたが整理が不足",
      poor: "目的と対象が不明確",
    },
  },
  {
    id: "docs-clarity",
    name: "分かりやすさの改善",
    weight: 25,
    description: "表現や構成を改善し、理解しやすくできているか",
    scoringGuidelines: {
      excellent: "構成を再整理し、表現も簡潔に修正",
      good: "表現を修正。構成の改善が一部不足",
      needsImprovement: "改善はあるが効果が限定的",
      poor: "改善が行われていない",
    },
  },
  {
    id: "docs-key-message",
    name: "要点の強調",
    weight: 25,
    description: "伝えるべき要点が明確になっているか",
    scoringGuidelines: {
      excellent: "要点が明確で、読み手に伝わる構成",
      good: "要点はあるが一部散漫",
      needsImprovement: "要点が埋もれている",
      poor: "要点が不明確",
    },
  },
  {
    id: "docs-review",
    name: "レビュー観点",
    weight: 25,
    description: "見直し観点と次の改善点が整理されているか",
    scoringGuidelines: {
      excellent: "改善観点と次の修正方針を明確化",
      good: "改善観点を整理。一部の具体性が不足",
      needsImprovement: "改善観点が曖昧",
      poor: "改善観点が整理されていない",
    },
  },
];

// 3e. basic-test-viewpoints: テスト観点洗い出し
const testViewpointCriteria: RatingCriterion[] = [
  {
    id: "test-viewpoint-coverage",
    name: "観点の網羅性",
    weight: 25,
    description: "主要なテスト観点を漏れなく洗い出せているか",
    scoringGuidelines: {
      excellent: "機能・権限・データ・UIなど複数観点を体系的に列挙",
      good: "主要観点を列挙。一部抜けがある",
      needsImprovement: "観点が少なく偏りがある",
      poor: "観点の洗い出しが不十分",
    },
  },
  {
    id: "test-viewpoint-priority",
    name: "優先度付け",
    weight: 25,
    description: "リスクや影響度に基づいて優先順位付けできているか",
    scoringGuidelines: {
      excellent: "リスク・頻度・影響度で優先度を明確化",
      good: "優先度は付けたが根拠が一部曖昧",
      needsImprovement: "優先度に触れたが基準が不明",
      poor: "優先度付けがない",
    },
  },
  {
    id: "test-viewpoint-preconditions",
    name: "前提条件の整理",
    weight: 25,
    description: "テスト前提データや環境条件を整理できているか",
    scoringGuidelines: {
      excellent: "前提データ・環境・制約条件を具体的に記載",
      good: "前提条件を整理。一部不足がある",
      needsImprovement: "前提条件が曖昧",
      poor: "前提条件の記載がない",
    },
  },
  {
    id: "test-viewpoint-traceability",
    name: "要件との整合",
    weight: 25,
    description: "要件/仕様との対応関係を意識できているか",
    scoringGuidelines: {
      excellent: "要件と観点を対応付けて整理",
      good: "要件に紐づけているが一部不足",
      needsImprovement: "要件との関係が不明確",
      poor: "要件との整合を意識していない",
    },
  },
];

// 3f. basic-unknowns-discovery: 不明点の洗い出し
const unknownsClarificationCriteria: RatingCriterion[] = [
  {
    id: "unknowns-list",
    name: "不明点の洗い出し",
    weight: 25,
    description: "曖昧な前提や未決事項を十分に列挙できているか",
    scoringGuidelines: {
      excellent: "不明点を体系的に列挙し、背景まで補足",
      good: "不明点を列挙。一部の抜けがある",
      needsImprovement: "不明点の列挙が断片的",
      poor: "不明点の洗い出しがない",
    },
  },
  {
    id: "unknowns-stakeholders",
    name: "確認先の特定",
    weight: 25,
    description: "確認すべき相手や情報源を特定できているか",
    scoringGuidelines: {
      excellent: "確認先・役割・取得すべき情報を明確化",
      good: "確認先を特定。一部の情報が不足",
      needsImprovement: "確認先に触れたが曖昧",
      poor: "確認先が特定されていない",
    },
  },
  {
    id: "unknowns-priority",
    name: "優先度と影響度",
    weight: 25,
    description: "影響度や緊急度に基づき優先度を付けられているか",
    scoringGuidelines: {
      excellent: "影響度と緊急度で優先順位を明確化",
      good: "優先度はあるが根拠が一部不足",
      needsImprovement: "優先度付けが曖昧",
      poor: "優先度付けがない",
    },
  },
  {
    id: "unknowns-plan",
    name: "解消計画",
    weight: 25,
    description: "確認手段と次のアクションを計画できているか",
    scoringGuidelines: {
      excellent: "確認手段・期日・担当まで具体化",
      good: "解消手段を整理。一部詳細が不足",
      needsImprovement: "解消に触れたが具体性が不足",
      poor: "解消計画がない",
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

// 6. challenge-conflict-mediation: コンフリクト調整
const conflictMediationCriteria: RatingCriterion[] = [
  {
    id: "conflict-fact-opinion",
    name: "事実と解釈の分離",
    weight: 30,
    description: "対立の論点を事実と解釈に分けて整理できているか",
    scoringGuidelines: {
      excellent: "論点を列挙し、各々について事実・解釈・感情を明確に分類",
      good: "事実と意見を分けて整理。一部の論点で混在",
      needsImprovement: "分離を試みたが体系的でない",
      poor: "事実と解釈の分離がない",
    },
  },
  {
    id: "conflict-neutrality",
    name: "中立性の維持",
    weight: 25,
    description: "特定の立場に偏らず、公平なファシリテーションができているか",
    scoringGuidelines: {
      excellent: "全員の意見を引き出し、公平に扱う。感情的な発言も受け止めつつ論点に戻す",
      good: "概ね中立的。一部で特定の立場に寄った場面あり",
      needsImprovement: "中立を意識したが偏りが目立つ",
      poor: "特定の立場に偏った進行",
    },
  },
  {
    id: "conflict-consensus",
    name: "合意形成力",
    weight: 25,
    description: "対立を解消し、全員が納得できる着地点を導けているか",
    scoringGuidelines: {
      excellent: "Win-Winの解決策を導出。各者の懸念を解消し、全員がコミット",
      good: "合意を形成。一部に不満が残る可能性",
      needsImprovement: "妥協点を探したが合意が不安定",
      poor: "合意に至っていない",
    },
  },
  {
    id: "conflict-followup",
    name: "フォローアップ計画",
    weight: 20,
    description: "合意後のタスク・担当・確認方法を明確にできているか",
    scoringGuidelines: {
      excellent: "タスク・担当・期日・次回確認日を明記。再発防止策も検討",
      good: "フォローアップを設定。一部詳細が不足",
      needsImprovement: "フォローアップに言及したが曖昧",
      poor: "フォローアップ計画がない",
    },
  },
];

// 7. challenge-deadline-advance: リリース期限前倒し
const deadlineAdvanceCriteria: RatingCriterion[] = [
  {
    id: "deadline-impact",
    name: "影響範囲の把握",
    weight: 25,
    description: "前倒しによる影響範囲を整理できているか",
    scoringGuidelines: {
      excellent: "スコープ・品質・リソース・リスクの影響を網羅的に整理",
      good: "主要な影響範囲を整理。一部の観点が不足",
      needsImprovement: "影響に触れたが分析が浅い",
      poor: "影響分析がない",
    },
  },
  {
    id: "deadline-options",
    name: "打ち手と選択肢",
    weight: 25,
    description: "複数の打ち手とトレードオフを提示できているか",
    scoringGuidelines: {
      excellent: "3案以上の選択肢を提示し、トレードオフを明示",
      good: "選択肢を提示。一部の比較が不足",
      needsImprovement: "打ち手はあるが比較が不十分",
      poor: "選択肢の提示がない",
    },
  },
  {
    id: "deadline-replan",
    name: "再計画の具体性",
    weight: 25,
    description: "再計画を期日・担当・マイルストーン付きで示せているか",
    scoringGuidelines: {
      excellent: "マイルストーンと担当を明記し実行可能な計画",
      good: "再計画はあるが一部詳細が不足",
      needsImprovement: "方向性のみで具体性が低い",
      poor: "再計画がない",
    },
  },
  {
    id: "deadline-agreement",
    name: "合意形成と説明",
    weight: 25,
    description: "関係者への説明と合意形成の方針が明確か",
    scoringGuidelines: {
      excellent: "関係者ごとの説明方針と合意手順を明確化",
      good: "合意形成に触れたが一部具体性が不足",
      needsImprovement: "合意形成の記述が曖昧",
      poor: "合意形成が考慮されていない",
    },
  },
];

// 8. challenge-impossible-request: 実現困難な要求への対応
const impossibleRequestCriteria: RatingCriterion[] = [
  {
    id: "impossible-constraints",
    name: "制約・根拠の理解",
    weight: 25,
    description: "実現困難の理由や制約を整理できているか",
    scoringGuidelines: {
      excellent: "技術・リソース・品質の制約を整理し根拠を明確化",
      good: "主要な制約を整理。一部の根拠が不足",
      needsImprovement: "制約に触れたが整理が不十分",
      poor: "制約の理解がない",
    },
  },
  {
    id: "impossible-alternatives",
    name: "代替案とトレードオフ",
    weight: 25,
    description: "代替案とトレードオフを提示できているか",
    scoringGuidelines: {
      excellent: "複数の代替案を提示し、影響とリスクを比較",
      good: "代替案はあるが比較が一部不足",
      needsImprovement: "代替案に触れたが具体性が低い",
      poor: "代替案がない",
    },
  },
  {
    id: "impossible-decision",
    name: "意思決定と合意形成",
    weight: 25,
    description: "判断基準と合意形成の進め方が明確か",
    scoringGuidelines: {
      excellent: "判断基準を示し、合意の進め方を合意",
      good: "合意形成に触れたが基準が一部曖昧",
      needsImprovement: "合意形成の記述が弱い",
      poor: "合意形成がない",
    },
  },
  {
    id: "impossible-next",
    name: "次アクションとリスク管理",
    weight: 25,
    description: "次アクションと残リスクを整理できているか",
    scoringGuidelines: {
      excellent: "次アクション・担当・期日・残リスクを明確化",
      good: "次アクションはあるが詳細が不足",
      needsImprovement: "次アクションが曖昧",
      poor: "次アクションが整理されていない",
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

// 11. challenge-ambiguous-request: 要件が曖昧な依頼への対応
const ambiguousRequestCriteria: RatingCriterion[] = [
  {
    id: "ambiguous-success",
    name: "成功条件の明確化",
    weight: 25,
    description: "成功条件や期待アウトカムを明確にできているか",
    scoringGuidelines: {
      excellent: "成功条件を具体的に定義し合意を得ている",
      good: "成功条件を定義したが一部曖昧",
      needsImprovement: "成功条件に触れたが具体性が不足",
      poor: "成功条件が定義されていない",
    },
  },
  {
    id: "ambiguous-scope",
    name: "仮スコープと非対象",
    weight: 25,
    description: "仮のスコープと非対象を示せているか",
    scoringGuidelines: {
      excellent: "スコープと非対象を明示し、影響を説明",
      good: "スコープを示したが非対象が一部不足",
      needsImprovement: "スコープが曖昧",
      poor: "スコープ整理がない",
    },
  },
  {
    id: "ambiguous-questions",
    name: "確認事項と前提",
    weight: 25,
    description: "確認事項や前提条件を整理できているか",
    scoringGuidelines: {
      excellent: "確認事項を体系的に列挙し、前提を明示",
      good: "確認事項を整理したが一部不足",
      needsImprovement: "確認事項が断片的",
      poor: "確認事項の整理がない",
    },
  },
  {
    id: "ambiguous-next",
    name: "次の進め方",
    weight: 25,
    description: "次のアクションと合意形成の進め方が明確か",
    scoringGuidelines: {
      excellent: "次アクションを担当・期日付きで合意",
      good: "次アクションを提示したが詳細が不足",
      needsImprovement: "次アクションが曖昧",
      poor: "次アクションが整理されていない",
    },
  },
];

// 12. challenge-user-perspective: ユーザー視点の回復
const userPerspectiveCriteria: RatingCriterion[] = [
  {
    id: "user-journey",
    name: "ユーザー行動の整理",
    weight: 25,
    description: "ユーザー行動フローを整理できているか",
    scoringGuidelines: {
      excellent: "ユーザーの行動フローと課題を具体的に整理",
      good: "行動フローを整理したが一部が曖昧",
      needsImprovement: "行動フローの整理が浅い",
      poor: "ユーザー行動の整理がない",
    },
  },
  {
    id: "user-value",
    name: "価値と影響の明確化",
    weight: 25,
    description: "ユーザー価値と影響を説明できているか",
    scoringGuidelines: {
      excellent: "ユーザー価値とビジネス影響を明確に説明",
      good: "価値に触れたが一部が曖昧",
      needsImprovement: "価値の説明が弱い",
      poor: "価値の説明がない",
    },
  },
  {
    id: "user-minimal",
    name: "最小改善案",
    weight: 25,
    description: "最小限の改善案を提示できているか",
    scoringGuidelines: {
      excellent: "最小改善案と検証方法を具体的に提示",
      good: "改善案はあるが検証が一部不足",
      needsImprovement: "改善案が抽象的",
      poor: "改善案がない",
    },
  },
  {
    id: "user-alignment",
    name: "合意形成",
    weight: 25,
    description: "関係者と合意形成できているか",
    scoringGuidelines: {
      excellent: "合意プロセスと次アクションを明確化",
      good: "合意形成に触れたが具体性が不足",
      needsImprovement: "合意形成の記述が弱い",
      poor: "合意形成がない",
    },
  },
];

const sharedProduct: Scenario["product"] = {
  name: "在庫最適化ダッシュボード",
  summary:
    "多店舗小売向けに、在庫・発注・売上を一画面で可視化し、欠品と過剰在庫を減らすSaaS。",
  audience: "店舗マネージャー、在庫管理担当、エリア統括",
  problems: ["欠品と過剰在庫が併発", "発注が属人化", "売上予測が粗い"],
  goals: ["欠品率の低下", "在庫回転率の改善", "発注作業時間の削減"],
  differentiators: ["需要予測ベースの発注提案", "店舗別の優先度表示", "モバイル棚卸対応"],
  scope: ["在庫ダッシュボード", "発注提案", "低在庫アラート", "POS連携(読み取り)"],
  constraints: ["既存POSとの連携が必須", "3か月でβリリース"],
  timeline: "今四半期にβ、次四半期に正式版",
  successCriteria: ["β導入5社", "欠品率10%削減", "発注作業時間を30%削減"],
  uniqueEdge: "現場が5分で意思決定できるシンプルUIに特化",
  techStack: ["Next.js", "Tailwind CSS", "Axum", "PostgreSQL", "Redis"],
  coreFeatures: ["在庫ダッシュボード", "自動発注提案", "低在庫アラート", "POS連携"],
};

const introBehavior: ScenarioBehavior = {
  userLed: true,
  allowProactive: false,
  maxQuestions: 0,
  responseStyle: "acknowledge_then_wait",
  phase: "intro",
};

const guidedBehavior: ScenarioBehavior = {
  userLed: false,
  allowProactive: true,
  maxQuestions: 1,
  responseStyle: "guide_lightly",
};

const challengeBehavior: ScenarioBehavior = {
  userLed: false,
  allowProactive: true,
  maxQuestions: 1,
  responseStyle: "advisor",
};

// Test-case scenario behavior: user-led, agent answers questions but doesn't provide test cases
const testCaseBehavior: ScenarioBehavior = {
  userLed: true,
  allowProactive: false,
  maxQuestions: 0,
  responseStyle: "acknowledge_then_wait",
};

// Single response behavior for basic scenarios
const singleResponseBehavior: ScenarioBehavior = {
  userLed: true,
  allowProactive: false,
  maxQuestions: 0,
  responseStyle: "acknowledge_then_wait",
  singleResponse: true,
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

const simpleAgendaCriteria: RatingCriterion[] = [
  {
    id: "agenda-purpose",
    name: "目的の明確さ",
    weight: 50,
    description: "ミーティングの目的を明確に定義できているか",
    scoringGuidelines: {
      excellent: "目的が具体的で明確",
      good: "概ね伝わるが一部曖昧",
      needsImprovement: "目的に触れたが不十分",
      poor: "目的が不明確",
    },
  },
  {
    id: "agenda-structure",
    name: "構成の適切さ",
    weight: 50,
    description: "アジェンダや進め方が整理されているか",
    scoringGuidelines: {
      excellent: "論理的に構成されている",
      good: "概ね整理されている",
      needsImprovement: "構成が弱い",
      poor: "構成がない",
    },
  },
];

const simpleMinutesCriteria: RatingCriterion[] = [
  {
    id: "minutes-decisions",
    name: "決定事項の整理",
    weight: 50,
    description: "決定事項やアクションが明確に整理されているか",
    scoringGuidelines: {
      excellent: "決定事項とアクションが明確",
      good: "概ね整理されている",
      needsImprovement: "整理が不十分",
      poor: "整理されていない",
    },
  },
  {
    id: "minutes-clarity",
    name: "読みやすさ",
    weight: 50,
    description: "簡潔で読みやすい形式か",
    scoringGuidelines: {
      excellent: "簡潔で読みやすい",
      good: "概ね読みやすい",
      needsImprovement: "読みにくい部分がある",
      poor: "読みにくい",
    },
  },
];

const simpleScheduleCriteria: RatingCriterion[] = [
  {
    id: "schedule-overview",
    name: "全体像の共有",
    weight: 50,
    description: "スケジュールの全体像が伝わるか",
    scoringGuidelines: {
      excellent: "全体像が明確に伝わる",
      good: "概ね伝わる",
      needsImprovement: "一部不明確",
      poor: "全体像が不明",
    },
  },
  {
    id: "schedule-milestones",
    name: "重要ポイントの明示",
    weight: 50,
    description: "マイルストーンや判断ポイントが明確か",
    scoringGuidelines: {
      excellent: "重要ポイントが明確",
      good: "主要なポイントは示されている",
      needsImprovement: "ポイントが曖昧",
      poor: "ポイントがない",
    },
  },
];

const simpleDocsCriteria: RatingCriterion[] = [
  {
    id: "docs-purpose",
    name: "目的の整理",
    weight: 50,
    description: "資料の目的と対象が整理されているか",
    scoringGuidelines: {
      excellent: "目的と対象が明確",
      good: "概ね整理されている",
      needsImprovement: "整理が不十分",
      poor: "整理されていない",
    },
  },
  {
    id: "docs-improvement",
    name: "改善の提案",
    weight: 50,
    description: "具体的な改善点が示されているか",
    scoringGuidelines: {
      excellent: "具体的な改善点がある",
      good: "改善点が示されている",
      needsImprovement: "改善点が曖昧",
      poor: "改善点がない",
    },
  },
];

const simpleTicketCriteria: RatingCriterion[] = [
  {
    id: "ticket-goal",
    name: "目的・ゴールの明確化",
    weight: 50,
    description: "チケットの目的やゴールが明確か",
    scoringGuidelines: {
      excellent: "目的とゴールが明確",
      good: "概ね明確",
      needsImprovement: "一部曖昧",
      poor: "不明確",
    },
  },
  {
    id: "ticket-conditions",
    name: "条件・依存の整理",
    weight: 50,
    description: "受入条件や依存関係が整理されているか",
    scoringGuidelines: {
      excellent: "条件と依存が整理されている",
      good: "主要な点は整理されている",
      needsImprovement: "整理が不十分",
      poor: "整理されていない",
    },
  },
];

const simpleUnknownsCriteria: RatingCriterion[] = [
  {
    id: "unknowns-list",
    name: "不明点の洗い出し",
    weight: 50,
    description: "不明点が具体的に列挙されているか",
    scoringGuidelines: {
      excellent: "不明点が具体的に列挙されている",
      good: "主要な不明点が挙げられている",
      needsImprovement: "不明点が少ない",
      poor: "不明点がない",
    },
  },
  {
    id: "unknowns-plan",
    name: "解消方針",
    weight: 50,
    description: "確認先や解消方法が示されているか",
    scoringGuidelines: {
      excellent: "確認先と方法が明確",
      good: "概ね示されている",
      needsImprovement: "方針が曖昧",
      poor: "方針がない",
    },
  },
];

const simpleTestCriteria: RatingCriterion[] = [
  {
    id: "test-coverage",
    name: "テスト観点の網羅性",
    weight: 50,
    description: "正常系と異常系の観点が含まれているか",
    scoringGuidelines: {
      excellent: "正常系・異常系を網羅",
      good: "主要な観点は含まれている",
      needsImprovement: "観点が不足",
      poor: "観点がほぼない",
    },
  },
  {
    id: "test-clarity",
    name: "ケースの明確さ",
    weight: 50,
    description: "テストケースが具体的で分かりやすいか",
    scoringGuidelines: {
      excellent: "具体的で分かりやすい",
      good: "概ね明確",
      needsImprovement: "一部曖昧",
      poor: "不明確",
    },
  },
];

const relaxedCommentGuidelines: RatingCriterion["scoringGuidelines"] = {
  excellent: "ミッションの狙いがはっきり伝わり、必要な背景や意図も補足されている",
  good: "主要なポイントには触れられており、実務で十分参考になる",
  needsImprovement: "方向性は合っているが、具体性や抜けが目立つ",
  poor: "ミッションで求められた内容に十分に答えていない",
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

const applyRelaxedCriteriaToBasicScenarios = (list: Scenario[]) => {
  list.forEach((scenario) => {
    if (scenario.scenarioType !== "basic" || !scenario.missions || scenario.missions.length === 0) {
      return;
    }
    const missions = [...scenario.missions].sort((a, b) => a.order - b.order);
    const weights = distributeWeights(missions.length);
    scenario.evaluationCriteria = missions.map((mission, index) => ({
      id: `${scenario.id}-mission-${index + 1}`,
      name: mission.title,
      weight: weights[index] ?? 100,
      description: `${mission.title}の内容が具体的に伝わっているかをコメントで評価します。`,
      scoringGuidelines: relaxedCommentGuidelines,
    }));
  });
};

const scenarioList: Scenario[] = [
  {
    id: "basic-intro-alignment",
    title: "自己紹介＆期待値合わせ",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "新規プロジェクトに合流し、役割と期待値を擦り合わせる。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt: "こんにちは！エンジニア兼デザイナーの鈴木です。よろしくお願いします！",
    evaluationCriteria: simpleIntroCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-intro-m1", title: "自己紹介と期待値を伝える", order: 1 },
    ],
    supplementalInfo: "自分の役割と期待値を1回の回答で伝えてください。",
  },
  {
    id: "basic-agenda-facilitation",
    title: "アジェンダ設定",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "ミーティングの目的とアジェンダを定義する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "来週のスプリントプランニングのアジェンダを作成してください。目的と議題を教えてください。",
    evaluationCriteria: simpleAgendaCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-agenda-m1", title: "アジェンダを作成する", order: 1 },
    ],
    supplementalInfo: "目的を一文で定義し、アジェンダを整理してください。",
  },
  {
    id: "basic-meeting-minutes",
    title: "議事メモの作成と共有",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "会議の決定事項とアクションを整理する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "先ほどのミーティングの議事メモを作成してください。決定事項と次のアクションを整理してください。",
    evaluationCriteria: simpleMinutesCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-minutes-m1", title: "議事メモを作成する", order: 1 },
    ],
    supplementalInfo: "決定事項・未決事項・次アクションを簡潔に整理してください。",
  },
  {
    id: "basic-schedule-share",
    title: "スケジュール調整",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "プロジェクトのスケジュール感を共有する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "プロジェクトのスケジュール感を教えてください。主要なマイルストーンと見通しを共有してください。",
    evaluationCriteria: simpleScheduleCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-schedule-m1", title: "スケジュールを共有する", order: 1 },
    ],
    supplementalInfo: "全体像とマイルストーンを簡潔に伝えてください。",
  },
  {
    id: "basic-docs-refine",
    title: "既存資料の軽微な修正",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "資料の目的を整理し改善点を提案する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "この資料の目的と対象読者を整理し、改善点を教えてください。",
    evaluationCriteria: simpleDocsCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-docs-m1", title: "改善点を提案する", order: 1 },
    ],
    supplementalInfo: "目的・対象・改善点を簡潔に整理してください。",
  },
  {
    id: "basic-ticket-refine",
    title: "チケット要件整理",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "チケットの目的と受入条件を整理する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt: "このチケットの目的と受入条件を整理してください。",
    evaluationCriteria: simpleTicketCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-ticket-m1", title: "チケットを整理する", order: 1 },
    ],
    supplementalInfo: "目的・受入条件・依存関係を簡潔に整理してください。",
  },
  {
    id: "basic-ticket-splitting",
    title: "チケット分割と優先度付け",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "大きなチケットを分割し優先度を付ける。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "この大きなチケットを分割し、優先度を付けてください。",
    evaluationCriteria: simpleTicketCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-split-m1", title: "チケットを分割する", order: 1 },
    ],
    supplementalInfo: "実行可能な単位に分割し、優先度を付けてください。",
  },
  {
    id: "basic-acceptance-review",
    title: "受入条件のレビュー",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "受入条件をレビューし改善する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "この受入条件をレビューし、改善点を教えてください。",
    evaluationCriteria: simpleTicketCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-acceptance-m1", title: "受入条件をレビューする", order: 1 },
    ],
    supplementalInfo: "曖昧な表現を修正し、検証可能な形に整えてください。",
  },
  {
    id: "basic-unknowns-discovery",
    title: "不明点の洗い出し",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "不明点を洗い出し確認方法を整理する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "要件の不明点を洗い出し、確認方法を教えてください。",
    evaluationCriteria: simpleUnknownsCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-unknowns-m1", title: "不明点を洗い出す", order: 1 },
    ],
    supplementalInfo: "不明点と確認先を簡潔に整理してください。",
  },
  {
    id: "basic-testcase-design",
    title: "テストケース作成",
    discipline: "BASIC",
    description: "テストケースを洗い出す。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt: "この機能のテストケースを洗い出してください。",
    evaluationCriteria: simpleTestCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-test-m1", title: "テストケースを作成する", order: 1 },
    ],
    supplementalInfo: "正常系と異常系を簡潔に整理してください。",
  },
  {
    id: "test-login",
    title: "ログイン機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "login",
      description: "メールアドレスとパスワードで認証するログインフォームです。",
    },
    description: "ログイン機能のテストケースを作成し、認証フローとセキュリティ観点を網羅する。",
    behavior: guidedBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "ログイン機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testLoginCriteria,
    passingScore: 70,
    missions: [
      { id: "test-login-m1", title: "正常系ログインフローを列挙する", order: 1 },
      { id: "test-login-m2", title: "異常系・セキュリティ観点を洗い出す", order: 2 },
      { id: "test-login-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
    supplementalInfo: `ログイン仕様:
- メールアドレス: 有効なメール形式のみ
- パスワード: 8文字以上
- ログイン試行: 5回失敗で15分ロック
- 「ログイン状態を保持」: 30日間有効
パスワード誤り、アカウントロック、セッション管理などの観点を意識してください。`,
  },
  {
    id: "test-form",
    title: "フォーム機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "form",
      description: "お問い合わせフォームです。入力検証とエラー表示を確認できます。",
    },
    description: "入力フォームのテストケースを作成し、バリデーションとUXを網羅する。",
    behavior: guidedBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "フォーム機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testFormCriteria,
    passingScore: 70,
    missions: [
      { id: "test-form-m1", title: "入力バリデーションケースを列挙する", order: 1 },
      { id: "test-form-m2", title: "エラー表示と操作性を検討する", order: 2 },
      { id: "test-form-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
    supplementalInfo: `フォーム仕様:
- 必須項目: 名前、メール、カテゴリ、内容、同意
- メール: 有効な形式のみ
- 電話: 任意、10〜13桁の数字とハイフン
- 内容: 10〜1000文字
必須/任意、フォーマット、文字種、長さ制限などの観点を網羅してください。`,
  },
  {
    id: "test-file-upload",
    title: "ファイルアップロード機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "file-upload",
      description: "ドラッグ＆ドロップ対応のファイルアップロード機能です。",
    },
    description: "ファイルアップロード機能のテストケースを作成し、ファイル検証とセキュリティを網羅する。",
    behavior: guidedBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "ファイルアップロード機能のテストケースのテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testFileUploadCriteria,
    passingScore: 70,
    missions: [
      { id: "test-upload-m1", title: "ファイル種別とサイズ検証ケースを列挙する", order: 1 },
      { id: "test-upload-m2", title: "エラー処理とセキュリティ観点を検討する", order: 2 },
      { id: "test-upload-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
    supplementalInfo: `アップロード仕様:
- 対応形式: JPEG, PNG, GIF, PDF
- 最大サイズ: 10MB/ファイル
- 最大ファイル数: 5
- ドラッグ＆ドロップ対応
- アップロード失敗時は再試行可能
拡張子偽装、ウイルスチェック、ストレージ容量などのセキュリティ観点を意識してください。`,
  },
  {
    id: "basic-test-viewpoints",
    title: "テスト観点の洗い出しと優先度付け",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "テスト観点を洗い出す。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "この機能のテスト観点を洗い出し、優先順位を付けてください。",
    evaluationCriteria: simpleTestCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-viewpoints-m1", title: "テスト観点を洗い出す", order: 1 },
    ],
    supplementalInfo: "観点と優先順位を簡潔に整理してください。",
  },
  {
    id: "basic-test-risk-review",
    title: "テスト計画のリスクレビュー",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "テスト計画をリスク観点でレビューする。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "このテスト計画をレビューし、高リスク領域と優先度を教えてください。",
    evaluationCriteria: simpleTestCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-riskreview-m1", title: "テスト計画をレビューする", order: 1 },
    ],
    supplementalInfo: "高リスク領域と優先度を簡潔に整理してください。",
  },
  {
    id: "basic-regression-smoke",
    title: "回帰テストの最小セット整理",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "回帰テストの最小セットを整理する。1回の回答でシナリオが終了します。",
    behavior: singleResponseBehavior,
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "回帰テストの最小セットを整理してください。必須ケースと優先度を教えてください。",
    evaluationCriteria: simpleTestCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-regression-m1", title: "回帰テストを整理する", order: 1 },
    ],
    supplementalInfo: "必須フローと優先度を簡潔に整理してください。",
  },
  {
    id: "challenge-project-rescue",
    title: "遅延プロジェクト立て直し (チャレンジ)",
    discipline: "CHALLENGE",
    description: "遅延しているプロジェクトでスコープ再交渉とリカバリ計画を短時間でまとめる。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt: "あなたは遅延しているプロジェクトのPM/PMOです。遅延要因を整理し、スコープ再交渉とリカバリ計画をまとめてください。",
    evaluationCriteria: projectRescueCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-rescue-m1", title: "遅延要因とリスクを特定する", order: 1 },
      { id: "challenge-rescue-m2", title: "スコープ再構成と優先度を決める", order: 2 },
      { id: "challenge-rescue-m3", title: "リカバリ計画とコミュニケーション案を作る", order: 3 },
    ],
    supplementalInfo: "品質バーを下げずに間に合わせる打ち手（並行作業・カット案・リソース振替）を検討してください。",
  },
  {
    id: "challenge-deadline-advance",
    title: "リリース期限の突然の前倒し (チャレンジ)",
    discipline: "CHALLENGE",
    description: "外部要因で期限が前倒しになり、影響分析と打ち手を提案する。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとしてリリース期限が突然前倒しになった状況に対応します。影響範囲を整理し、複数の打ち手と合意形成を進めてください。",
    evaluationCriteria: deadlineAdvanceCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-deadline-m1", title: "影響範囲を洗い出す", order: 1 },
      { id: "challenge-deadline-m2", title: "選択肢とトレードオフを提示する", order: 2 },
      { id: "challenge-deadline-m3", title: "合意した方針と次アクションを決める", order: 3 },
    ],
    supplementalInfo: "品質・スコープ・リソースのトレードオフを明確にしてください。",
  },
  {
    id: "challenge-progress-visibility",
    title: "進捗が見えない状況への対応 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "進捗が見えない状況で可視化と打ち手を設計する。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとして進捗が見えない状況に対応します。最小限の可視化手段と報告リズムを設計し、次アクションを決めてください。",
    evaluationCriteria: progressVisibilityCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-visibility-m1", title: "進捗可視化の指標と方法を決める", order: 1 },
      { id: "challenge-visibility-m2", title: "リスク要因を整理する", order: 2 },
      { id: "challenge-visibility-m3", title: "報告と次アクションを合意する", order: 3 },
    ],
    supplementalInfo: "最小限の指標で現状を把握できるようにしてください。",
  },
  {
    id: "challenge-quality-fire",
    title: "品質問題の緊急対応と優先度調整 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "品質問題が発生し、緊急対応と優先度を再調整する。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとして品質問題に緊急対応します。原因と影響を整理し、優先度と対応方針を合意してください。",
    evaluationCriteria: projectRescueCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-quality-m1", title: "品質問題の原因と影響を整理する", order: 1 },
      { id: "challenge-quality-m2", title: "緊急対応と優先度を決める", order: 2 },
      { id: "challenge-quality-m3", title: "関係者への説明と合意を行う", order: 3 },
    ],
    supplementalInfo: "ユーザー影響とリリース計画のトレードオフを明確にしてください。",
  },
  {
    id: "challenge-ambiguous-request",
    title: "要件が曖昧な依頼への対応 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "曖昧な要求を具体化し、合意できるスコープを作る。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとして曖昧な依頼に対応します。成功条件と仮スコープを整理し、確認事項と次アクションを合意してください。",
    evaluationCriteria: ambiguousRequestCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-ambiguous-m1", title: "成功条件を明確化する", order: 1 },
      { id: "challenge-ambiguous-m2", title: "仮スコープと非対象を整理する", order: 2 },
      { id: "challenge-ambiguous-m3", title: "確認事項と次アクションを決める", order: 3 },
    ],
    supplementalInfo: "曖昧さを放置せず、仮置きでも合意を取って進めてください。",
  },
  {
    id: "challenge-scope-addition",
    title: "追加スコープ要求の交渉 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "追加要求に対してスコープ調整と合意形成を行う。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとして追加スコープ要求の交渉を行います。代替案と影響を提示し、合意内容をまとめてください。",
    evaluationCriteria: scopeNegotiationCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-scopeadd-m1", title: "追加要求の背景と目的を整理する", order: 1 },
      { id: "challenge-scopeadd-m2", title: "代替案と影響を提示する", order: 2 },
      { id: "challenge-scopeadd-m3", title: "合意内容と次アクションを決める", order: 3 },
    ],
    supplementalInfo: "期限・品質・リソースのトレードオフを明確にしてください。",
  },
  {
    id: "challenge-scope-negotiation",
    title: "スコープ／リソース交渉 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "顧客や上長とスコープ削減かリソース増加を交渉し、合意形成する。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt: "あなたはPM/PMOとしてスコープまたはリソースの交渉を行います。代替案とインパクトを提示し、短時間で合意を得てください。",
    evaluationCriteria: scopeNegotiationCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-negotiation-m1", title: "譲れない条件とBATNAを整理する", order: 1 },
      { id: "challenge-negotiation-m2", title: "スコープ/リソースの代替案とインパクトをまとめる", order: 2 },
      { id: "challenge-negotiation-m3", title: "合意プロセスとステークホルダー調整を計画する", order: 3 },
    ],
    supplementalInfo: "合意後に残るリスクとフォローアップを必ず記録してください。",
  },
  {
    id: "challenge-impossible-request",
    title: "エンジニアから「無理です」と言われる (チャレンジ)",
    discipline: "CHALLENGE",
    description: "技術的制約を理解し、代替案と合意を作る。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPMとしてエンジニアから実現困難と指摘された状況に対応します。制約を整理し、代替案と合意形成を進めてください。",
    evaluationCriteria: impossibleRequestCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-impossible-m1", title: "制約・根拠を明確化する", order: 1 },
      { id: "challenge-impossible-m2", title: "代替案と影響を比較する", order: 2 },
      { id: "challenge-impossible-m3", title: "合意した対応と次アクションを決める", order: 3 },
    ],
    supplementalInfo: "無理の理由を尊重しつつ、実現可能な落とし所を探してください。",
  },
  {
    id: "challenge-conflict-mediation",
    title: "コンフリクト調整 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "開発とQA・ビジネスの対立をファシリテートし、合意に導く。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt: "あなたはPM/PMOとして対立が発生している会議をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。",
    evaluationCriteria: conflictMediationCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-conflict-m1", title: "論点と事実/解釈を分けて整理する", order: 1 },
      { id: "challenge-conflict-m2", title: "合意の選択肢と条件を提示する", order: 2 },
      { id: "challenge-conflict-m3", title: "フォロータスクと担当を決める", order: 3 },
    ],
    supplementalInfo: "感情的な対立を避けるため、事実と解釈を分けて提示してください。",
  },
  {
    id: "challenge-priority-conflict",
    title: "優先度対立のファシリテーション (チャレンジ)",
    discipline: "CHALLENGE",
    description: "関係者間の優先度対立を整理し、合意に導く。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとして優先度対立をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。",
    evaluationCriteria: conflictMediationCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-priority-m1", title: "対立の論点を整理する", order: 1 },
      { id: "challenge-priority-m2", title: "合意の選択肢と条件を提示する", order: 2 },
      { id: "challenge-priority-m3", title: "フォロータスクと担当を決める", order: 3 },
    ],
    supplementalInfo: "事実と解釈を分け、公平なファシリテーションを心がけてください。",
  },
  {
    id: "challenge-stakeholder-misalignment",
    title: "ステークホルダーとの認識ズレ解消 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "期待値のズレを解消し、共通認識と再発防止を作る。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとしてステークホルダー間の認識ズレを解消します。ズレの原因を整理し、共通認識と再発防止プロセスを合意してください。",
    evaluationCriteria: stakeholderAlignmentCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-alignment-m1", title: "ズレているポイントを特定する", order: 1 },
      { id: "challenge-alignment-m2", title: "共通認識を再整理する", order: 2 },
      { id: "challenge-alignment-m3", title: "再発防止の確認プロセスを決める", order: 3 },
    ],
    supplementalInfo: "合意後の確認プロセス（定例やチェックポイント）まで設計してください。",
  },
  {
    id: "challenge-user-perspective",
    title: "ユーザー視点が抜けていることへの気づき (チャレンジ)",
    discipline: "CHALLENGE",
    description: "ユーザー視点の欠落に気づき、価値に立ち返る。",
    behavior: challengeBehavior,
    product: sharedProduct,
    mode: "freeform",
    kickoffPrompt:
      "あなたはPM/PMOとしてユーザー視点が抜けていることに気づきます。ユーザー行動を整理し、最小限の改善案と合意を作ってください。",
    evaluationCriteria: userPerspectiveCriteria,
    passingScore: 70,
    missions: [
      { id: "challenge-user-m1", title: "ユーザー行動フローを整理する", order: 1 },
      { id: "challenge-user-m2", title: "価値と影響を説明する", order: 2 },
      { id: "challenge-user-m3", title: "最小改善案と合意をまとめる", order: 3 },
    ],
    supplementalInfo: "機能ではなく価値に立ち返り、最小の打ち手を提案してください。",
  },
];

const requireScenarioSummary = (id: string): ScenarioSummary => {
  const scenario = scenarioList.find((item) => item.id === id);
  if (!scenario) {
    throw new Error(`Scenario summary not found: ${id}`);
  }
  return {
    id: scenario.id,
    title: scenario.title,
    description: scenario.description,
    discipline: scenario.discipline,
  };
};

export const scenarioCatalog: ScenarioCatalogSection[] = [
  {
    discipline: "BASIC",
    title: "基礎シナリオ",
    scenarios: scenarioList
      .filter((s) => s.discipline === "BASIC")
      .map<ScenarioSummary>(({ id, title, description, discipline }) => ({
        id,
        title,
        description,
        discipline,
      })),
  },
  {
    discipline: "CHALLENGE",
    title: "チャレンジシナリオ",
    scenarios: scenarioList
      .filter((s) => s.discipline === "CHALLENGE")
      .map<ScenarioSummary>(({ id, title, description, discipline }) => ({
        id,
        title,
        description,
        discipline,
      })),
  },
];

applyRelaxedCriteriaToBasicScenarios(scenarioList);

export const homeScenarioCatalog: ScenarioCatalogCategory[] = [
  {
    id: "soft-skills",
    title: "",
    subcategories: [
      {
        id: "basic-soft-skills",
        title: "基礎ソフトスキル",
        scenarios: [
          requireScenarioSummary("basic-intro-alignment"),
          requireScenarioSummary("basic-agenda-facilitation"),
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
];

export const comingSoonScenarios: ScenarioSummary[] = [
  {
    id: "coming-risk-management",
    title: "リスク管理と対応計画",
    description: "プロジェクトのリスクを洗い出し、優先度を判断して対応計画を策定するシナリオ",
    discipline: "BASIC",
  },
  {
    id: "coming-stakeholder-negotiation",
    title: "ステークホルダー交渉",
    description: "要件の優先度について意見が対立するステークホルダーとの合意形成を実践するシナリオ",
    discipline: "BASIC",
  },
  {
    id: "coming-sprint-retrospective",
    title: "スプリント振り返り",
    description: "チームのふりかえり会をファシリテートし、改善アクションを導き出すシナリオ",
    discipline: "BASIC",
  },
  {
    id: "coming-incident-response",
    title: "障害対応と報告",
    description: "本番障害発生時の初動対応、影響範囲の特定、ステークホルダーへの報告を実践するシナリオ",
    discipline: "CHALLENGE",
  },
  {
    id: "coming-requirement-definition",
    title: "要件定義ドキュメント作成",
    description: "ヒアリング内容をもとに要件定義書を作成し、レビューを受けるシナリオ",
    discipline: "CHALLENGE",
  },
  {
    id: "coming-cross-team-coordination",
    title: "チーム間連携調整",
    description: "複数チームにまたがる機能開発の依存関係を整理し、リリース計画を調整するシナリオ",
    discipline: "CHALLENGE",
  },
];

export const defaultScenario = scenarioList[0];

export function getScenarioById(id: string | null): Scenario | undefined {
  if (!id) return undefined;
  return scenarioList.find((s) => s.id === id);
}

export function getScenarioDiscipline(id: string | null): ScenarioDiscipline | undefined {
  return getScenarioById(id)?.discipline;
}

export function getScenarioKickoff(id: string | null): string | undefined {
  return getScenarioById(id)?.kickoffPrompt;
}

export function getScenarioSummary(id: string | null): ScenarioSummary | undefined {
  const scenario = getScenarioById(id);
  if (!scenario) return undefined;
  const { discipline, description, title: scenarioTitle } = scenario;
  return { id: scenario.id, title: scenarioTitle, description, discipline };
}
