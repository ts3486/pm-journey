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

// 3a-4. test-password-reset: パスワード再設定機能テストケース作成
const testPasswordResetCriteria: RatingCriterion[] = [
  {
    id: "reset-request-flow",
    name: "再設定フローの網羅性",
    weight: 30,
    description: "メール送信、コード検証、パスワード更新までのフローをカバーしているか",
    scoringGuidelines: {
      excellent: "再設定要求から更新完了までの正常系を段階ごとに網羅",
      good: "主要な正常系をカバー。一部の遷移が不足",
      needsImprovement: "一部のフローのみで全体像が不足",
      poor: "再設定フローの整理が不十分",
    },
  },
  {
    id: "reset-token-security",
    name: "トークン・セキュリティ観点",
    weight: 25,
    description: "トークン有効期限、使い回し防止、不正アクセス対策を検討しているか",
    scoringGuidelines: {
      excellent: "有効期限、再利用不可、試行回数制限、漏えい時対策を網羅",
      good: "主要なセキュリティ観点をカバー。一部欠落",
      needsImprovement: "基本的な有効期限のみ",
      poor: "セキュリティ観点の検討がない",
    },
  },
  {
    id: "reset-error-handling",
    name: "異常系・エラーハンドリング",
    weight: 25,
    description: "無効コード、期限切れ、ネットワーク障害時の挙動を検討しているか",
    scoringGuidelines: {
      excellent: "入力エラー、期限切れ、サーバーエラー、連続失敗時挙動まで網羅",
      good: "主要な異常系をカバー。一部不足",
      needsImprovement: "基本的なエラー表示のみ",
      poor: "異常系の検討がほぼない",
    },
  },
  {
    id: "reset-data-session",
    name: "データ整合・セッション管理",
    weight: 20,
    description: "更新後のログイン状態や既存セッション無効化を検討しているか",
    scoringGuidelines: {
      excellent: "更新後再ログイン、既存セッション無効化、通知送信まで検証",
      good: "主要なセッション処理をカバー。一部欠落",
      needsImprovement: "更新成功の確認のみ",
      poor: "更新後の整合性を検討していない",
    },
  },
];

// 3a-5. test-search-filter: 検索・絞り込み機能テストケース作成
const testSearchFilterCriteria: RatingCriterion[] = [
  {
    id: "search-query-behavior",
    name: "検索クエリ挙動の網羅性",
    weight: 30,
    description: "部分一致、完全一致、空文字、特殊文字などの検索挙動を検討しているか",
    scoringGuidelines: {
      excellent: "キーワード条件を体系的に網羅し、期待結果が明確",
      good: "主要な検索条件をカバー。一部の境界が不足",
      needsImprovement: "単純な検索条件のみ",
      poor: "検索条件の検討が不十分",
    },
  },
  {
    id: "search-filter-sort-combination",
    name: "絞り込み・並び替えの組み合わせ",
    weight: 30,
    description: "フィルターとソートの組み合わせ時の結果整合性を検討しているか",
    scoringGuidelines: {
      excellent: "複合条件、条件解除、ページング連動まで網羅",
      good: "主要な組み合わせをカバー。一部不足",
      needsImprovement: "単独条件のみの検証",
      poor: "組み合わせ観点がない",
    },
  },
  {
    id: "search-empty-error-performance",
    name: "0件・エラー・性能観点",
    weight: 20,
    description: "0件表示、APIエラー、レスポンス遅延時の挙動を検討しているか",
    scoringGuidelines: {
      excellent: "0件表示、エラー再試行、遅延時UIまで具体的に検証",
      good: "主要な例外ケースをカバー。一部不足",
      needsImprovement: "0件表示のみ",
      poor: "例外ケースの検討がない",
    },
  },
  {
    id: "search-usability-state",
    name: "操作性・状態保持",
    weight: 20,
    description: "検索条件の保持、戻る操作、キーボード操作を検討しているか",
    scoringGuidelines: {
      excellent: "条件保持、戻る復元、フォーカス制御まで網羅",
      good: "主要な操作性をカバー。一部不足",
      needsImprovement: "基本操作のみ",
      poor: "操作性の検討がない",
    },
  },
];

// 3a-6. test-notification-settings: 通知設定機能テストケース作成
const testNotificationSettingsCriteria: RatingCriterion[] = [
  {
    id: "notify-channel-coverage",
    name: "通知チャネル設定の網羅性",
    weight: 25,
    description: "メール、プッシュ、外部連携などチャネル別設定を網羅しているか",
    scoringGuidelines: {
      excellent: "各チャネルのON/OFF、依存設定、反映条件まで網羅",
      good: "主要なチャネル設定をカバー。一部不足",
      needsImprovement: "単一チャネル中心の検証",
      poor: "チャネル設定の検討が不十分",
    },
  },
  {
    id: "notify-event-frequency",
    name: "通知種別・頻度制御",
    weight: 25,
    description: "通知イベントごとの受信設定や頻度制限を検討しているか",
    scoringGuidelines: {
      excellent: "イベント別設定、サマリー、Do Not Disturbまで網羅",
      good: "主要な通知種別をカバー。一部不足",
      needsImprovement: "イベント別設定が浅い",
      poor: "通知種別の検討がない",
    },
  },
  {
    id: "notify-save-consistency",
    name: "保存・反映の整合性",
    weight: 25,
    description: "保存成功、再ログイン後保持、複数端末反映を検討しているか",
    scoringGuidelines: {
      excellent: "保存成功/失敗、再読み込み、複数端末同期まで網羅",
      good: "主要な保存挙動をカバー。一部不足",
      needsImprovement: "保存成功のみの検証",
      poor: "保存整合性の検討がない",
    },
  },
  {
    id: "notify-error-permission",
    name: "権限・エラーケース",
    weight: 25,
    description: "通知権限拒否、外部連携失敗、APIエラー時の挙動を検討しているか",
    scoringGuidelines: {
      excellent: "権限拒否、連携切断、API障害時の復旧導線まで網羅",
      good: "主要なエラーケースをカバー。一部不足",
      needsImprovement: "基本的なエラー表示のみ",
      poor: "エラーケースの検討がない",
    },
  },
];

// 3a-7. test-profile-edit: プロフィール編集機能テストケース作成
const testProfileEditCriteria: RatingCriterion[] = [
  {
    id: "profile-field-validation",
    name: "入力項目バリデーション",
    weight: 30,
    description: "表示名、自己紹介、連絡先などの入力制約を検証しているか",
    scoringGuidelines: {
      excellent: "必須/任意、文字数、文字種、禁止語を体系的に網羅",
      good: "主要なバリデーションをカバー。一部不足",
      needsImprovement: "基本的な必須チェックのみ",
      poor: "入力制約の検討が不十分",
    },
  },
  {
    id: "profile-image-upload",
    name: "画像アップロード・加工",
    weight: 20,
    description: "対応形式、サイズ上限、トリミング、削除操作を検証しているか",
    scoringGuidelines: {
      excellent: "画像形式、サイズ、トリミング、削除、失敗時再試行を網羅",
      good: "主要な画像操作をカバー。一部不足",
      needsImprovement: "基本的なアップロードのみ",
      poor: "画像操作の検討がない",
    },
  },
  {
    id: "profile-save-concurrency",
    name: "保存処理・同時編集整合性",
    weight: 25,
    description: "保存成功/失敗、二重送信防止、同時編集時の競合を検討しているか",
    scoringGuidelines: {
      excellent: "二重送信防止、競合検知、リトライ導線まで網羅",
      good: "主要な保存挙動をカバー。一部不足",
      needsImprovement: "保存成功のみの検証",
      poor: "保存処理の検討がない",
    },
  },
  {
    id: "profile-privacy-permission",
    name: "公開範囲・権限管理",
    weight: 25,
    description: "公開範囲設定、閲覧権限、監査観点を検討しているか",
    scoringGuidelines: {
      excellent: "公開範囲、閲覧権限、更新履歴、監査観点まで網羅",
      good: "主要な権限観点をカバー。一部不足",
      needsImprovement: "公開設定のみの検証",
      poor: "権限・公開範囲の検討がない",
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

const requirementDialogueBehavior: ScenarioBehavior = {
  userLed: false,
  allowProactive: true,
  maxQuestions: 2,
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
  if (scenario.scenarioType === "test-case") return "test-case-quality";
  if (requirementDefinitionScenarioIds.has(scenario.id)) return "requirement-definition";
  if (incidentResponseScenarioIds.has(scenario.id)) return "incident-response";
  if (businessExecutionScenarioIds.has(scenario.id)) return "business-execution";
  if (scenario.discipline === "CHALLENGE") return "challenge";
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

const applyMissionBasedCriteriaToScenarios = (list: Scenario[]) => {
  list.forEach((scenario) => {
    const missionBasedCriteria = buildMissionBasedCriteria(scenario);
    if (missionBasedCriteria.length === 0) return;
    scenario.evaluationCriteria = missionBasedCriteria;
  });
};

const buildBasicKickoffPrompt = (scenario: Scenario) => {
  const supplementalInstruction = scenario.supplementalInfo?.trim();
  const primaryMission = scenario.missions
    ?.slice()
    .sort((a, b) => a.order - b.order)[0];
  const callToAction = supplementalInstruction
    ? supplementalInstruction
    : primaryMission
      ? `「${primaryMission.title}」を実施してください。`
      : "このシナリオに回答してください。";
  const normalizedCallToAction = callToAction.replace(/。?$/, "。");
  return `シナリオ「${scenario.title}」を開始します。${normalizedCallToAction}`;
};

const applyBasicPromptRoles = (list: Scenario[]) => {
  list.forEach((scenario) => {
    if (scenario.scenarioType !== "basic") return;
    const agentResponseEnabled = scenario.behavior?.agentResponseEnabled ?? true;

    const existingKickoff = scenario.kickoffPrompt?.trim();
    if (agentResponseEnabled && existingKickoff && !scenario.agentOpeningMessage) {
      scenario.agentOpeningMessage = existingKickoff;
    }
    if (!agentResponseEnabled) {
      scenario.agentOpeningMessage = undefined;
    }
    scenario.kickoffPrompt = buildBasicKickoffPrompt(scenario);
  });
};

const scenarioList: Scenario[] = [
  {
    id: "basic-intro-alignment",
    title: "自己紹介",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "あなたは新しくプロジェクトに参加したPMです。チームの信頼を得るためにまずは自己紹介をしてみましょう。",
    task: {
      instruction: "新しくプロジェクトに参加したPMとして、チームに向けた自己紹介メッセージを作成してください。",
      deliverableFormat: "free-text",
      referenceInfo: "あなたは新しくプロジェクトに参加したPMです。自己紹介をしてください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt: "こんにちは！エンジニア兼デザイナーの鈴木です。よろしくお願いします！",
    evaluationCriteria: simpleIntroCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-intro-m1", title: "自己紹介をする", order: 1 },
    ],
    supplementalInfo: "あなたは新しくプロジェクトに参加したPMです。自己紹介をしてください。",
  },
  {
    id: "basic-meeting-minutes",
    title: "議事メモの作成と共有",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "会議の決定事項とアクションを整理する。",
    task: {
      instruction: "先ほどのミーティングの議事メモを作成してください。決定事項と次のアクションを整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["決定事項", "未決事項", "次のアクション（担当・期限）"],
      },
      referenceInfo: "決定事項・未決事項・次アクションを簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    title: "ミーティング調整",
    discipline: "BASIC",
    scenarioType: "basic",
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
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "",
    evaluationCriteria: simpleScheduleCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-schedule-m1", title: "ミーティング調整メッセージを作成する", order: 1 },
    ],
    supplementalInfo: "要件詰めのミーティングを開催予定です。関係者のスケジュール調整をする時に送るメッセージを作成してください。",
  },
  {
    id: "basic-docs-refine",
    title: "既存資料の軽微な修正",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "資料の目的を整理し改善点を提案する。",
    task: {
      instruction: "この資料の目的と対象読者を整理し、改善点を提案してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的", "対象読者", "改善点"],
      },
      referenceInfo: "目的・対象・改善点を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    description: "チケットの目的と受入条件を整理する。",
    task: {
      instruction: "以下のチケットについて、目的・受入条件・依存関係を整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的（ユーザーストーリー形式）", "受入条件（AC）", "依存関係", "リスク"],
        example: `## 目的
「ユーザーとして、〇〇できるようにしたい。なぜなら〇〇だから。」

## 受入条件
- [ ] 〇〇の場合、〇〇が表示される
- [ ] 〇〇が〇〇以内に完了する

## 依存関係
- API設計: 担当〇〇、期日〇〇

## リスク
- 〇〇の場合、〇〇が発生する可能性がある → 対策: 〇〇`,
      },
      referenceInfo: "目的・受入条件・依存関係を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    description: "大きなチケットを分割し優先度を付ける。",
    task: {
      instruction: "この大きなチケットを実行可能な単位に分割し、優先度を付けてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["分割チケット一覧", "優先度（理由付き）", "依存関係"],
      },
      referenceInfo: "実行可能な単位に分割し、優先度を付けてください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    task: {
      instruction: "この受入条件をレビューし、改善点を提案してください。曖昧な表現を修正し、検証可能な形に整えてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["レビュー対象の受入条件", "改善点", "修正後の受入条件"],
      },
      referenceInfo: "曖昧な表現を修正し、検証可能な形に整えてください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    task: {
      instruction: "要件の不明点を洗い出し、確認方法を整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["不明点一覧", "確認先", "確認方法・期限"],
      },
      referenceInfo: "不明点と確認先を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    scenarioType: "basic",
    description: "テストケースを洗い出す。1回の回答でシナリオが終了します。",
    task: {
      instruction: "この機能のテストケースを洗い出してください。正常系と異常系を網羅してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["正常系テストケース", "異常系テストケース", "境界値テスト"],
      },
      referenceInfo: "正常系と異常系を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
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
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
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
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "ファイルアップロード機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
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
    id: "test-password-reset",
    title: "パスワード再設定機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "password-reset",
      description: "メール認証コードでパスワードを再設定するフローです。",
    },
    description: "パスワード再設定機能のテストケースを作成し、再設定フローとセキュリティ観点を網羅する。",
    task: {
      instruction: "パスワード再設定機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["再設定フロー正常系", "セキュリティ・異常系", "前提条件とテストデータ"],
      },
      referenceInfo: `再設定仕様:
- 再設定メールは登録済みアドレスにのみ送信
- 確認コード有効期限: 10分
- コード入力失敗: 3回で無効化
- 新しいパスワード: 8文字以上、英数字を含む
トークン有効期限、再利用防止、既存セッション無効化の観点を意識してください。`,
    },
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "パスワード再設定機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testPasswordResetCriteria,
    passingScore: 70,
    missions: [
      { id: "test-reset-m1", title: "再設定フローの正常系を列挙する", order: 1 },
      { id: "test-reset-m2", title: "セキュリティ・異常系観点を洗い出す", order: 2 },
      { id: "test-reset-m3", title: "前提条件とテストデータを整理する", order: 3 },
    ],
    supplementalInfo: `再設定仕様:
- 再設定メールは登録済みアドレスにのみ送信
- 確認コード有効期限: 10分
- コード入力失敗: 3回で無効化
- 新しいパスワード: 8文字以上、英数字を含む
トークン有効期限、再利用防止、既存セッション無効化の観点を意識してください。`,
  },
  {
    id: "test-search-filter",
    title: "検索・絞り込み機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "search-filter",
      description: "一覧画面で検索・絞り込み・並び替えができる機能です。",
    },
    description: "検索・絞り込み機能のテストケースを作成し、検索精度と操作性を網羅する。",
    task: {
      instruction: "検索・絞り込み機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["検索クエリ正常系・境界値", "絞り込みと並び替えの組み合わせ", "0件・エラー・操作性"],
      },
      referenceInfo: `検索仕様:
- キーワード検索: 部分一致（2文字以上で検索）
- 絞り込み: カテゴリ、ステータス、担当者
- 並び替え: 更新日、作成日、名前
- 検索条件は画面遷移後も保持
複合条件、0件表示、APIエラー、条件保持の観点を意識してください。`,
    },
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "検索・絞り込み機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testSearchFilterCriteria,
    passingScore: 70,
    missions: [
      { id: "test-search-m1", title: "検索クエリの正常系・境界値を列挙する", order: 1 },
      { id: "test-search-m2", title: "絞り込みと並び替えの組み合わせを検討する", order: 2 },
      { id: "test-search-m3", title: "0件・エラー・操作性観点を整理する", order: 3 },
    ],
    supplementalInfo: `検索仕様:
- キーワード検索: 部分一致（2文字以上で検索）
- 絞り込み: カテゴリ、ステータス、担当者
- 並び替え: 更新日、作成日、名前
- 検索条件は画面遷移後も保持
複合条件、0件表示、APIエラー、条件保持の観点を意識してください。`,
  },
  {
    id: "test-notification-settings",
    title: "通知設定機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "notification-settings",
      description: "チャネル別・イベント別に通知受信設定を変更できる機能です。",
    },
    description: "通知設定機能のテストケースを作成し、設定反映と権限観点を網羅する。",
    task: {
      instruction: "通知設定機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["チャネル別・イベント別設定ケース", "保存反映と権限エラー", "前提条件と優先度"],
      },
      referenceInfo: `通知設定仕様:
- チャネル: メール、プッシュ、Slack
- 通知種別: 週次サマリー、メンション、障害アラート
- Do Not Disturb: 22:00〜07:00
- 設定変更は保存ボタン押下で反映
権限拒否、連携失敗、再ログイン後保持、複数端末反映の観点を意識してください。`,
    },
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "通知設定機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testNotificationSettingsCriteria,
    passingScore: 70,
    missions: [
      { id: "test-notify-m1", title: "チャネル別・イベント別設定を列挙する", order: 1 },
      { id: "test-notify-m2", title: "保存反映と権限エラー観点を洗い出す", order: 2 },
      { id: "test-notify-m3", title: "前提条件と優先度を整理する", order: 3 },
    ],
    supplementalInfo: `通知設定仕様:
- チャネル: メール、プッシュ、Slack
- 通知種別: 週次サマリー、メンション、障害アラート
- Do Not Disturb: 22:00〜07:00
- 設定変更は保存ボタン押下で反映
権限拒否、連携失敗、再ログイン後保持、複数端末反映の観点を意識してください。`,
  },
  {
    id: "test-profile-edit",
    title: "プロフィール編集機能",
    discipline: "BASIC",
    scenarioType: "test-case",
    featureMockup: {
      component: "profile-edit",
      description: "プロフィール情報と画像を更新できる編集画面です。",
    },
    description: "プロフィール編集機能のテストケースを作成し、入力検証と保存整合性を網羅する。",
    task: {
      instruction: "プロフィール編集機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["入力項目バリデーション", "画像アップロードと保存処理", "権限・公開範囲"],
      },
      referenceInfo: `プロフィール仕様:
- 表示名: 必須、最大50文字
- 自己紹介: 任意、最大160文字
- 画像: PNG/JPEG/WEBP、最大5MB
- 保存時に最終更新日時をチェックし、競合時は再編集を促す
入力制約、競合検知、公開範囲、権限観点を意識してください。`,
    },
    assistanceMode: "guided" as const,
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "プロフィール編集機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！",
    evaluationCriteria: testProfileEditCriteria,
    passingScore: 70,
    missions: [
      { id: "test-profile-m1", title: "入力項目バリデーションを列挙する", order: 1 },
      { id: "test-profile-m2", title: "画像アップロードと保存処理を検討する", order: 2 },
      { id: "test-profile-m3", title: "権限・公開範囲観点を整理する", order: 3 },
    ],
    supplementalInfo: `プロフィール仕様:
- 表示名: 必須、最大50文字
- 自己紹介: 任意、最大160文字
- 画像: PNG/JPEG/WEBP、最大5MB
- 保存時に最終更新日時をチェックし、競合時は再編集を促す
入力制約、競合検知、公開範囲、権限観点を意識してください。`,
  },
  {
    id: "basic-test-viewpoints",
    title: "テスト観点の洗い出しと優先度付け",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "テスト観点を洗い出す。1回の回答でシナリオが終了します。",
    task: {
      instruction: "この機能のテスト観点を洗い出し、優先順位を付けてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["テスト観点一覧", "優先度と理由"],
      },
      referenceInfo: "観点と優先順位を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    task: {
      instruction: "このテスト計画をレビューし、高リスク領域と優先度を整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["高リスク領域", "優先度と根拠", "追加テスト提案"],
      },
      referenceInfo: "高リスク領域と優先度を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    task: {
      instruction: "回帰テストの最小セットを整理してください。必須ケースと優先度を明確にしてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["必須テストケース", "優先度", "スモークテスト候補"],
      },
      referenceInfo: "必須フローと優先度を簡潔に整理してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
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
    id: "basic-requirement-definition-doc",
    title: "ログイン機能",
    discipline: "BASIC",
    scenarioType: "basic",
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
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "お疲れ様です、POの鈴木です！ログイン機能で『ログインできない』問い合わせが増えているので、最低限のログイン体験を安定化したいです。要件定義をお願いできますか？",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqdoc-m2", title: "ログイン成功/失敗時の要件を定義する", order: 1 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。目的・対象ユーザーの確認、受入条件と非対象の整理、不明点の確認先と期限の設定まで行ってください。",
  },
  {
    id: "basic-requirement-hearing-plan",
    title: "問い合わせフォーム機能",
    discipline: "BASIC",
    scenarioType: "basic",
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
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "問い合わせフォームの離脱が増えています。CSは入力項目を減らしたい一方で、法務は同意取得を厳密にしたいと言っています。要件を整理してもらえますか？",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqhear-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqhear-m2", title: "入力/送信/エラー時の受入条件を定義する", order: 2 },
      { id: "basic-reqhear-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。入力バリデーション、送信失敗時の扱い、同意取得の境界を明確にし、不明点の確認計画まで整理してください。",
  },
  {
    id: "basic-requirement-user-story",
    title: "ファイルアップロード機能",
    discipline: "BASIC",
    scenarioType: "basic",
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
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "サポート向けに添付ファイルアップロードを追加したいです。営業は早期リリースを求めていますが、インフラはサイズ制限を厳守してほしいと言っています。要件を整理してください。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqstory-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqstory-m2", title: "形式/サイズ/失敗時の受入条件を定義する", order: 2 },
      { id: "basic-reqstory-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。許可形式、サイズ上限、失敗時リトライの期待挙動を明確化し、不明点の確認計画まで整理してください。",
  },
  {
    id: "basic-requirement-nfr",
    title: "パスワード再設定機能",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "パスワード再設定機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "パスワード再設定機能の要件を整理してください。UXの簡便性とセキュリティの厳格性の両立を検討し、問い合わせ急増に対処するための要件定義を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "本人確認/期限/完了条件の受入条件", "非対象と不明点の確認アクション"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。トークン有効期限と不正利用防止を含む受入条件を明確化し、不明点の確認計画まで整理してください。",
    },
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "パスワード再設定の問い合わせが急増しています。UXは簡単な導線を求めていますが、セキュリティは厳格な本人確認を求めています。要件を整理してもらえますか？",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqnfr-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqnfr-m2", title: "本人確認/期限/完了条件の受入条件を定義する", order: 2 },
      { id: "basic-reqnfr-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。トークン有効期限と不正利用防止を含む受入条件を明確化し、不明点の確認計画まで整理してください。",
  },
  {
    id: "basic-requirement-priority-matrix",
    title: "検索・絞り込み機能",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "検索・絞り込み機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "検索・絞り込み機能の要件を整理してください。多条件検索の要求と開発の性能懸念の両立を検討し、要件定義を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "検索条件/ソート/0件表示の受入条件", "非対象と不明点の確認アクション"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。複合条件検索と0件表示の期待挙動を明確化し、性能懸念に関する確認計画まで整理してください。",
    },
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "検索・絞り込み機能の改善依頼があります。PMは多条件検索を求めていますが、開発からは性能劣化の懸念が出ています。要件を整理しましょう。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqprio-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqprio-m2", title: "検索条件/ソート/0件表示の受入条件を定義する", order: 2 },
      { id: "basic-reqprio-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。複合条件検索と0件表示の期待挙動を明確化し、性能懸念に関する確認計画まで整理してください。",
  },
  {
    id: "basic-requirement-risk-check",
    title: "通知設定機能",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "通知設定機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "通知設定機能の要件を整理してください。マーケティングの通知頻度増加要求とユーザーの通知過多不満の両立を検討し、要件定義を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "チャネル/頻度/保存反映の受入条件", "非対象と不明点の確認アクション"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。保存後の反映と権限拒否時の挙動を含む受入条件を定義し、不明点の確認計画まで整理してください。",
    },
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "通知設定を見直したいです。マーケは通知頻度を上げたい一方で、ユーザーからは通知過多の不満が来ています。要件定義を手伝ってください。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqrisk-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqrisk-m2", title: "チャネル/頻度/保存反映の受入条件を定義する", order: 2 },
      { id: "basic-reqrisk-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。保存後の反映と権限拒否時の挙動を含む受入条件を定義し、不明点の確認計画まで整理してください。",
  },
  {
    id: "basic-requirement-consensus",
    title: "プロフィール編集機能",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "プロフィール編集機能のユーザーストーリーと受入条件を定義する。",
    task: {
      instruction: "プロフィール編集機能の要件を整理してください。即時保存の期待と同時編集時の競合懸念の両立を検討し、要件定義を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["目的・対象ユーザー", "入力制約/保存/競合時の受入条件", "非対象と不明点の確認アクション"],
      },
      referenceInfo: "会話で段階的に要件を合意してください。保存失敗時と競合時の期待挙動を含む受入条件を明確化し、不明点の確認計画まで整理してください。",
    },
    assistanceMode: "guided" as const,
    behavior: { ...requirementDialogueBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "プロフィール編集を改善したいです。利用者は即時保存を期待していますが、開発は同時編集時の競合を懸念しています。要件を整理してください。",
    evaluationCriteria: featureRequirementCriteria,
    passingScore: 60,
    missions: [
      { id: "basic-reqconsensus-m1", title: "目的・対象ユーザーを確認する", order: 1 },
      { id: "basic-reqconsensus-m2", title: "入力制約/保存/競合時の受入条件を定義する", order: 2 },
      { id: "basic-reqconsensus-m3", title: "非対象と不明点の確認アクションを整理する", order: 3 },
    ],
    supplementalInfo:
      "会話で段階的に要件を合意してください。保存失敗時と競合時の期待挙動を含む受入条件を明確化し、不明点の確認計画まで整理してください。",
  },
  {
    id: "coming-stakeholder-negotiation",
    title: "ステークホルダー優先度交渉",
    discipline: "BASIC",
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
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "営業は『今月中に新機能を出したい』、開発は『品質基準を満たさない限りリリースできない』と主張しています。対立点を整理し、合意形成に向けた交渉を進めてください。",
    evaluationCriteria: scopeNegotiationCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-stakeholder-m1", title: "対立点と共通目的を明確化する", order: 1 },
      { id: "coming-stakeholder-m2", title: "譲歩案と判断基準を提示する", order: 2 },
      { id: "coming-stakeholder-m3", title: "合意事項・保留事項・次アクションを確定する", order: 3 },
    ],
    supplementalInfo: "会話の最後に、合意事項・保留事項・次アクション（担当/期限）を明文化してください。",
  },
  {
    id: "coming-priority-tradeoff-workshop",
    title: "優先度トレードオフ",
    discipline: "BASIC",
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
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "次リリース候補として『高速検索』『通知改善』『管理画面改修』の3案があります。価値・工数・リスクを比較し、段階リリースの合意案を作ってください。",
    evaluationCriteria: scopeNegotiationCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-tradeoff-m1", title: "比較軸を定義して各案を評価する", order: 1 },
      { id: "coming-tradeoff-m2", title: "採用案と却下案を整理する", order: 2 },
      { id: "coming-tradeoff-m3", title: "段階リリース計画と判断理由を合意する", order: 3 },
    ],
    supplementalInfo: "会話の最後に、採用案・却下案・判断理由を明文化してください。",
  },

  {
    id: "coming-decision-log-alignment",
    title: "意思決定ログ共有と認識合わせ",
    discipline: "BASIC",
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
    behavior: { ...guidedBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "先週決めた『段階リリース方針』について、営業と開発で認識にズレが出ています。意思決定ログを整理し、共有メッセージと確認ポイントを作成してください。",
    evaluationCriteria: stakeholderAlignmentCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-decisionlog-m1", title: "ズレている認識ポイントを特定する", order: 1 },
      { id: "coming-decisionlog-m2", title: "意思決定の背景と根拠を再整理する", order: 2 },
      { id: "coming-decisionlog-m3", title: "共有文面と確認ポイントを確定する", order: 3 },
    ],
    supplementalInfo: "会話の最後に、共有文面（要点）と確認ポイント（3項目）を提示してください。",
  },
  {
    id: "coming-incident-response",
    title: "P1障害: ログイン不能バグの緊急対応",
    discipline: "CHALLENGE",
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
    behavior: { ...challengeBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "本番環境で『ログインAPIが500エラーを返し続け、全ユーザーがログイン不能』というP1障害が発生しました。初動対応、影響範囲、社内外への初回報告を会話で整理してください。",
    evaluationCriteria: projectRescueCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-incident-m1", title: "影響範囲と緊急度を確定する", order: 1 },
      { id: "coming-incident-m2", title: "初動対応と暫定復旧方針を決める", order: 2 },
      { id: "coming-incident-m3", title: "初回報告とエスカレーションを実行する", order: 3 },
    ],
    supplementalInfo: "終了条件: 影響範囲、初動アクション、連絡先、初回報告文が確定していること。",
  },
  {
    id: "coming-incident-triage-escalation",
    title: "P2障害: 決済遅延バグ",
    discipline: "CHALLENGE",
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
    behavior: { ...challengeBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "本番環境で『決済は成功しているが完了通知反映が最大20分遅延する』不具合が発生しています。P2想定で、優先度判定とエスカレーション判断を会話で進めてください。",
    evaluationCriteria: progressVisibilityCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-triage-m1", title: "事象の再現条件と影響ユーザーを特定する", order: 1 },
      { id: "coming-triage-m2", title: "優先度と対応期限を決定する", order: 2 },
      { id: "coming-triage-m3", title: "エスカレーション先と報告リズムを確定する", order: 3 },
    ],
    supplementalInfo: "終了条件: 重大度、判断根拠、エスカレーション経路、次回報告時刻が確定していること。",
  },
  {
    id: "coming-postmortem-followup",
    title: "P3障害: 表示崩れバグの再発防止",
    discipline: "CHALLENGE",
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
    behavior: { ...challengeBehavior, forbidRolePlay: true },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "Androidの一部端末でプロフィール画面のボタンが重なって表示崩れするP3不具合が報告されました。原因分析、優先度判断、再発防止策を会話で整理してください。",
    evaluationCriteria: stakeholderAlignmentCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-postmortem-m1", title: "事実と原因仮説を切り分ける", order: 1 },
      { id: "coming-postmortem-m2", title: "恒久対応と暫定対応を決定する", order: 2 },
      { id: "coming-postmortem-m3", title: "再発防止アクションを担当・期限付きで合意する", order: 3 },
    ],
    supplementalInfo: "終了条件: 再発防止アクション（担当/期限）と検証方法が明文化されていること。",
  },
  {
    id: "coming-sprint-retrospective",
    title: "スプリント振り返り",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "ふりかえり会を設計し、改善アクションを導き出す。",
    task: {
      instruction: "スプリント振り返りの進め方と改善アクションを整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["Keep（継続すること）", "Problem（課題）", "Try（改善アクション）"],
      },
      referenceInfo: "Keep/Problem/Try を使って、具体的な改善アクションを示してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "スプリントふりかえりの進め方と改善アクションを整理してください。",
    evaluationCriteria: simpleMinutesCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-retro-m1", title: "改善アクションを整理する", order: 1 },
    ],
    supplementalInfo: "Keep/Problem/Try を使って、具体的な改善アクションを示してください。",
  },
  {
    id: "coming-release-readiness-review",
    title: "リリース準備レビュー",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "リリース直前の準備状況を確認し、Go/No-Go判断材料を整理する。",
    task: {
      instruction: "リリース準備レビューのチェック項目と判断基準を整理してください。",
      deliverableFormat: "checklist",
      template: {
        format: "checklist",
        checklist: ["品質チェック", "運用準備", "告知・ドキュメント", "ロールバック計画"],
      },
      referenceInfo: "品質、運用、告知、ロールバック観点のチェック項目を示してください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "リリース準備レビューのチェック項目と判断基準を整理してください。",
    evaluationCriteria: simpleTicketCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-release-m1", title: "Go/No-Go判断材料を整理する", order: 1 },
    ],
    supplementalInfo: "品質、運用、告知、ロールバック観点のチェック項目を示してください。",
  },
  {
    id: "coming-kpi-review-action",
    title: "KPIレビューと改善アクション",
    discipline: "BASIC",
    scenarioType: "basic",
    description: "事業KPIの振り返りを行い、次の改善施策を定義する。",
    task: {
      instruction: "主要KPIの振り返りと次スプリントの改善アクションを整理してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["KPIの現状", "課題仮説", "改善施策", "検証方法"],
      },
      referenceInfo: "KPIの現状、課題仮説、施策、検証方法を明確にしてください。",
    },
    assistanceMode: "on-request",
    behavior: {
      ...singleResponseBehavior,
      forbidRolePlay: true,
    },
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt:
      "主要KPIの振り返りと次スプリントの改善アクションを整理してください。",
    evaluationCriteria: simpleTicketCriteria,
    passingScore: 60,
    missions: [
      { id: "coming-kpi-m1", title: "改善施策を整理する", order: 1 },
    ],
    supplementalInfo: "KPIの現状、課題仮説、施策、検証方法を明確にしてください。",
  },
  {
    id: "challenge-project-rescue",
    title: "遅延プロジェクト立て直し (チャレンジ)",
    discipline: "CHALLENGE",
    description: "遅延しているプロジェクトでスコープ再交渉とリカバリ計画を短時間でまとめる。",
    task: {
      instruction: "遅延しているプロジェクトのPM/PMOとして、遅延要因を整理し、スコープ再交渉とリカバリ計画をまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["遅延要因とリスク", "スコープ再構成と優先度", "リカバリ計画", "関係者コミュニケーション案"],
      },
      referenceInfo: "状況:\n- プロジェクトが遅延しており、チームは疲弊している\n- 品質バーを下げずに間に合わせる打ち手が求められている\n- 並行作業・カット案・リソース振替を検討可能",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとしてリリース期限が突然前倒しになった状況に対応します。影響範囲を整理し、複数の打ち手と合意形成を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["影響範囲", "選択肢とトレードオフ", "合意した方針", "次アクション"],
      },
      referenceInfo: "状況:\n- 外部要因でリリース期限が前倒しになった\n- チームは不安を感じている\n- 品質・スコープ・リソースのトレードオフ判断が必要",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとして進捗が見えない状況に対応します。最小限の可視化手段と報告リズムを設計し、次アクションを決めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["進捗可視化の指標と方法", "リスク要因", "報告リズム", "次アクション"],
      },
      referenceInfo: "状況:\n- プロジェクトの進捗が不透明\n- チームメンバーは方向性を求めている\n- 最小限の指標で現状把握が必要",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとして品質問題に緊急対応します。原因と影響を整理し、優先度と対応方針を合意してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["品質問題の原因と影響", "緊急対応と優先度", "関係者への説明", "合意事項"],
      },
      referenceInfo: "状況:\n- 品質問題が発生し、緊急対応が必要\n- ユーザー影響とリリース計画のトレードオフ判断が求められている",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとして曖昧な依頼に対応します。成功条件と仮スコープを整理し、確認事項と次アクションを合意してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["成功条件", "仮スコープと非対象", "確認事項", "次アクション"],
      },
      referenceInfo: "状況:\n- ステークホルダーから曖昧な要件の依頼が来ている\n- 何が欲しいのか依頼者自身も明確ではない\n- 曖昧さを放置せず、仮置きでも合意を取って進める必要がある",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとして追加スコープ要求の交渉を行います。代替案と影響を提示し、合意内容をまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["追加要求の背景と目的", "代替案と影響", "合意内容", "次アクション"],
      },
      referenceInfo: "状況:\n- ステークホルダーから追加スコープの要求が来ている\n- ビジネス上の必要性が主張されている\n- 期限・品質・リソースのトレードオフ判断が必要",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとしてスコープまたはリソースの交渉を行います。代替案とインパクトを提示し、短時間で合意を得てください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["譲れない条件とBATNA", "スコープ/リソースの代替案とインパクト", "合意プロセス", "残存リスクとフォローアップ"],
      },
      referenceInfo: "状況:\n- 顧客や上長とスコープ削減またはリソース増加の交渉が必要\n- 各ステークホルダーはそれぞれの制約を持っている\n- 合意後に残るリスクとフォローアップの記録が求められる",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PMとしてエンジニアから実現困難と指摘された状況に対応します。制約を整理し、代替案と合意形成を進めてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["制約・根拠の整理", "代替案と影響の比較", "合意した対応", "次アクション"],
      },
      referenceInfo: "状況:\n- エンジニアから技術的に実現困難だと指摘された\n- 明確な根拠がある\n- 無理の理由を尊重しつつ、実現可能な落とし所を探す必要がある",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとして対立が発生している会議をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["論点と事実/解釈の整理", "合意の選択肢と条件", "フォロータスクと担当"],
      },
      referenceInfo: "状況:\n- 開発・QA・ビジネスの間で対立が発生している\n- それぞれ異なる主張を持っており、感情的になりやすい\n- PMとして事実と解釈を分けて整理し、全員が前進できる合意点を導く必要がある",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとして優先度対立をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["対立の論点整理", "合意の選択肢と条件", "フォロータスクと担当"],
      },
      referenceInfo: "状況:\n- 関係者間で優先度について異なる見解が存在している\n- それぞれの立場に合理的な根拠がある\n- PMとして事実と解釈を分け、公平にファシリテーションする必要がある",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとしてステークホルダー間の認識ズレを解消します。ズレの原因を整理し、共通認識と再発防止プロセスを合意してください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["ズレているポイントの特定", "共通認識の再整理", "再発防止の確認プロセス"],
      },
      referenceInfo: "状況:\n- ステークホルダー間で期待値にズレが発生している\n- 各自が自分の理解が正しいと思い込んでいる\n- PMとしてズレの原因を整理し、合意後の確認プロセス（定例やチェックポイント）まで設計する必要がある",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
    task: {
      instruction: "PM/PMOとしてユーザー視点が抜けていることに気づきます。ユーザー行動を整理し、最小限の改善案と合意を作ってください。",
      deliverableFormat: "structured",
      template: {
        format: "structured",
        sections: ["ユーザー行動フローの整理", "価値と影響の説明", "最小改善案と合意"],
      },
      referenceInfo: "状況:\n- チームが技術実装に集中し、ユーザー視点が薄れている\n- 機能は作られているが、ユーザーにとっての価値が見えにくくなっている\n- PMとして機能ではなく価値に立ち返り、最小の打ち手を提案する必要がある",
    },
    assistanceMode: "guided",
    behavior: { ...challengeBehavior, forbidRolePlay: true },
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
};

const applyScenarioGuideMessages = (list: Scenario[]) => {
  list.forEach((scenario) => {
    const guideMessage = scenarioGuideMessages[scenario.id];
    scenario.guideMessage = guideMessage ?? `${scenario.description}このシナリオに取り組みましょう。`;
  });
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
        id: "business-execution-delivery",
        title: "事業推進",
        scenarios: [
          requireScenarioSummary("coming-priority-tradeoff-workshop"),
          requireScenarioSummary("coming-stakeholder-negotiation"),
          requireScenarioSummary("coming-decision-log-alignment"),
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
