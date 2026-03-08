import { useMemo, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Content-block types – each renders differently for visual variety  */
/* ------------------------------------------------------------------ */

type ProseBlock = { kind: "prose"; text: string };
type LeadBlock = { kind: "lead"; text: string };
type HeadingBlock = { kind: "heading"; text: string };
type SubheadingBlock = { kind: "subheading"; text: string };
type PullQuoteBlock = { kind: "pullquote"; text: string; cite?: string };
type CalloutBlock = { kind: "callout"; label: string; text: string };
type DiagramBlock = { kind: "diagram"; component: () => ReactNode };
type ComparisonBlock = {
  kind: "comparison";
  items: { label: string; role: string; focus: string; color: string }[];
};
type TimelineBlock = {
  kind: "timeline";
  steps: { label: string; title: string; body: string }[];
};
type SkillCardBlock = {
  kind: "skillcards";
  cards: { step: string; title: string; skill: string; color: string }[];
};
type DividerBlock = { kind: "divider" };

type ContentBlock =
  | ProseBlock
  | LeadBlock
  | HeadingBlock
  | SubheadingBlock
  | PullQuoteBlock
  | CalloutBlock
  | DiagramBlock
  | ComparisonBlock
  | TimelineBlock
  | SkillCardBlock
  | DividerBlock;

type LectureDefinition = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  readingTime: string;
  heroAccent: string;
  blocks: ContentBlock[];
};

/* ------------------------------------------------------------------ */
/*  SVG Diagrams                                                       */
/* ------------------------------------------------------------------ */

function VennDiagram() {
  return (
    <figure className="flex flex-col items-center gap-4 py-2">
      <svg viewBox="0 0 360 280" className="w-full max-w-[22rem]" aria-label="ビジネス・テクノロジー・UXのベン図">
        {/* circles */}
        <circle cx="180" cy="100" r="88" fill="rgba(217,119,42,0.12)" stroke="rgba(217,119,42,0.5)" strokeWidth="1.5" />
        <circle cx="130" cy="190" r="88" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.45)" strokeWidth="1.5" />
        <circle cx="230" cy="190" r="88" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.45)" strokeWidth="1.5" />
        {/* labels */}
        <text x="180" y="52" textAnchor="middle" className="fill-[#a34f18] text-[13px] font-semibold">ビジネス</text>
        <text x="180" y="68" textAnchor="middle" className="fill-gray-500 text-[10px]">収益・成長・市場</text>
        <text x="68" y="228" textAnchor="middle" className="fill-blue-600 text-[13px] font-semibold">テクノロジー</text>
        <text x="68" y="244" textAnchor="middle" className="fill-gray-500 text-[10px]">技術的実現可能性</text>
        <text x="292" y="228" textAnchor="middle" className="fill-emerald-600 text-[13px] font-semibold">UX</text>
        <text x="292" y="244" textAnchor="middle" className="fill-gray-500 text-[10px]">ユーザー体験</text>
        {/* center label */}
        <text x="180" y="168" textAnchor="middle" className="fill-gray-900 text-[14px] font-bold">PdM</text>
        <text x="180" y="184" textAnchor="middle" className="fill-gray-600 text-[10px]">3領域の交差点</text>
      </svg>
      <figcaption className="text-center text-xs leading-relaxed text-[#7b6856]">
        PdMはビジネス・テクノロジー・UXが重なる領域で意思決定を行う
      </figcaption>
    </figure>
  );
}

function LifecycleDiagram() {
  const phases = [
    { label: "発見", sub: "Discovery", color: "#d9772a" },
    { label: "定義", sub: "Define", color: "#b75c1f" },
    { label: "開発", sub: "Develop", color: "#3b82f6" },
    { label: "リリース", sub: "Release", color: "#10b981" },
    { label: "成長", sub: "Grow", color: "#8b5cf6" },
  ];
  return (
    <figure className="flex flex-col items-center gap-4 py-2">
      <div className="flex w-full max-w-lg items-center justify-between gap-0">
        {phases.map((p, i) => (
          <div key={p.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-white text-xs font-bold shadow-md sm:h-14 sm:w-14 sm:text-sm"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </div>
              <span className="text-[10px] text-[#7b6856]">{p.sub}</span>
            </div>
            {i < phases.length - 1 && (
              <svg viewBox="0 0 28 12" className="mx-0.5 h-3 w-5 shrink-0 text-[#9b8a79] sm:mx-1 sm:w-7">
                <path d="M0 6h20l-4-4M20 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[#7b6856]">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#d9772a]">
          <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11z" fill="currentColor" fillRule="evenodd" />
          <path d="M10.5 5.5l-4 5M6.5 5.5l4 5" stroke="currentColor" strokeWidth="0" />
          <path d="M8 4v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>
        <span>PdMはこのサイクル全体に関与し続ける</span>
      </div>
    </figure>
  );
}

function SkillRadarDiagram() {
  // Simple radar/pentagon showing 5 skill areas
  const skills = [
    { label: "コミュニケーション", angle: -90 },
    { label: "品質管理", angle: -18 },
    { label: "仕様策定", angle: 54 },
    { label: "危機対応", angle: 126 },
    { label: "戦略思考", angle: 198 },
  ];
  const cx = 160, cy = 140, r = 100;
  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });
  const outerPoints = skills.map((s) => toXY(s.angle, r));
  const innerPoints = skills.map((s) => toXY(s.angle, r * 0.55));
  const polygon = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <figure className="flex flex-col items-center gap-3 py-2">
      <svg viewBox="0 0 320 280" className="w-full max-w-[20rem]" aria-label="PdMスキルレーダー">
        {/* grid lines */}
        {[0.33, 0.66, 1].map((scale) => (
          <polygon
            key={scale}
            points={polygon(skills.map((s) => toXY(s.angle, r * scale)))}
            fill="none"
            stroke="rgba(138,96,61,0.15)"
            strokeWidth="1"
          />
        ))}
        {/* axis lines */}
        {outerPoints.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(138,96,61,0.12)" strokeWidth="1" />
        ))}
        {/* filled area */}
        <polygon points={polygon(innerPoints)} fill="rgba(217,119,42,0.15)" stroke="rgba(217,119,42,0.6)" strokeWidth="1.5" />
        {/* dots */}
        {innerPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#d9772a" />
        ))}
        {/* labels */}
        {skills.map((s, i) => {
          const labelPos = toXY(s.angle, r + 24);
          return (
            <text key={i} x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-800 text-[11px] font-medium">
              {s.label}
            </text>
          );
        })}
      </svg>
      <figcaption className="text-center text-xs text-[#7b6856]">
        pm-journeyで鍛える5つのスキル領域
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/*  Lecture Data                                                        */
/* ------------------------------------------------------------------ */

const lectures: LectureDefinition[] = [
  {
    id: "what-is-pdm",
    number: 1,
    title: "プロダクトマネージャー（PdM）とは？",
    subtitle: "PdMの定義、プロジェクトマネージャーとの違い、プロダクト成功への責任範囲",
    readingTime: "5 min read",
    heroAccent: "rgba(217,119,42,0.08)",
    blocks: [
      {
        kind: "lead",
        text: "プロダクトマネージャー（PdM）は、ユーザーの課題とビジネス目標を結びつけ、「何を作るべきか」「なぜそれが重要か」を定義する人です。エンジニアが「どう作るか」を担うのに対し、PdMは「何を・なぜ」に責任を持ちます。",
      },
      { kind: "heading", text: "3つの領域の交差点に立つ" },
      {
        kind: "prose",
        text: "PdMの仕事は、ビジネス（収益・成長）、テクノロジー（技術的実現可能性）、UX（ユーザー体験）という3つの領域が重なる場所で行われます。どれか1つに偏ることなく、3つのバランスを保ちながら意思決定を行う——それがPdMの特徴であり、難しさでもあります。",
      },
      { kind: "diagram", component: VennDiagram },
      { kind: "divider" },
      { kind: "heading", text: "PdM・PjM・PMM の違い" },
      {
        kind: "prose",
        text: "「PM」と一括りに呼ばれがちですが、実は3つのまったく異なる職種があります。それぞれの守備範囲を理解しておくことで、自分の役割と他チームとの連携がクリアになります。",
      },
      {
        kind: "comparison",
        items: [
          {
            label: "PdM",
            role: "プロダクトマネージャー",
            focus: "何を作るか・なぜ作るかを決定。ユーザー課題の発見からリリース後の改善まで、プロダクトのライフサイクル全体に責任を持つ。",
            color: "#d9772a",
          },
          {
            label: "PjM",
            role: "プロジェクトマネージャー",
            focus: "いつまでに・誰が・何をするかを管理。スケジュール通りのデリバリーが主目標。PdMが決めた「何を」を期限内に届ける。",
            color: "#3b82f6",
          },
          {
            label: "PMM",
            role: "プロダクトマーケティング",
            focus: "市場ポジショニングとGo-to-Market戦略を設計。PdMが作ったプロダクトをどう市場に届けるかを担う。",
            color: "#10b981",
          },
        ],
      },
      { kind: "divider" },
      { kind: "heading", text: "プロダクトのライフサイクル" },
      {
        kind: "prose",
        text: "PdMはプロダクトの「一瞬」ではなく「一生」に関わります。ユーザーリサーチで課題を発見し、要件を定義し、開発チームと協力して形にし、リリース後はデータを見ながら改善を回し続ける。この一連のサイクルを理解することが、PdMの仕事の全体像を掴む第一歩です。",
      },
      { kind: "diagram", component: LifecycleDiagram },
      {
        kind: "callout",
        label: "pm-journeyでは",
        text: "このライフサイクルの各フェーズに必要なスキルを、対話型シナリオで体験できます。「発見」は基礎ソフトスキル、「定義」は要件定義、「開発」はテストケース作成、「リリース後」は障害対応や事業推進のカテゴリに対応しています。",
      },
    ],
  },
  {
    id: "core-skills",
    number: 2,
    title: "PdMに必要なコアスキル",
    subtitle: "6つのスキル領域と、それぞれの鍛え方",
    readingTime: "7 min read",
    heroAccent: "rgba(59,130,246,0.06)",
    blocks: [
      {
        kind: "lead",
        text: "「顧客が求めているのは速い馬ではなく、早く目的地に着くこと」——ヘンリー・フォードの言葉は、PdMの本質を的確に表しています。表面的な要望の裏にある本当の課題を見つけ出し、限られたリソースで最大のインパクトを出す。そのために必要な6つのスキル領域を見ていきます。",
      },
      { kind: "diagram", component: SkillRadarDiagram },
      { kind: "divider" },
      { kind: "heading", text: "課題発見と仮説構築" },
      {
        kind: "prose",
        text: "ユーザーが言葉にする要望の裏にある、根本的な課題を見つけ出す力です。インタビュー、行動データ分析、カスタマーサポートのログなど、複数のソースから仮説を立て、検証していきます。",
      },
      {
        kind: "pullquote",
        text: "ユーザーに「何が欲しいですか？」と聞くのではなく、行動を観察して「何に困っているか」を読み取る。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "「基礎ソフトスキル」カテゴリで、ステークホルダーとの対話を通じて課題を整理し、本質的なニーズを特定する練習を行います。",
      },
      { kind: "divider" },
      { kind: "heading", text: "優先順位付け" },
      {
        kind: "prose",
        text: "やりたいことは常にリソースを超えます。RICE（Reach, Impact, Confidence, Effort）やICE（Impact, Confidence, Ease）などのフレームワークを使い、客観的な基準で優先順位を決定します。「何をやらないか」を決める勇気もPdMに必要な資質です。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "「事業推進・戦略」カテゴリの優先度トレードオフシナリオで、競合する要求の中から最適な判断を下す経験を積みます。",
      },
      { kind: "divider" },
      { kind: "heading", text: "データ分析とKPI設計" },
      {
        kind: "prose",
        text: "直感に頼らず、定量データでプロダクトの状態を把握し、改善の方向を決める力です。DAU/MAU、コンバージョン率、リテンション率、NPSなど、プロダクトの健康状態を示す指標を設計・モニタリングします。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "「事業推進・戦略」カテゴリのデータROI分析シナリオで、実際のデータを読み解きながらビジネス判断を行う体験ができます。",
      },
      { kind: "divider" },
      { kind: "heading", text: "要件定義とユーザーストーリー" },
      {
        kind: "prose",
        text: "ステークホルダーの曖昧なニーズを「ユーザーストーリー」や「要件定義書」に落とし込み、開発チームが実装可能な形にする力です。関係者全員が同じゴールを共有できるドキュメントを作成します。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "「要件定義」カテゴリでは、ログイン機能・お問い合わせフォーム・ファイルアップロード機能の要件を実際に定義するシナリオを用意しています。",
      },
      { kind: "divider" },
      { kind: "heading", text: "品質保証の視点" },
      {
        kind: "prose",
        text: "PdMはQAエンジニアではありませんが、テスト観点を理解し、品質基準を設定する責任があります。ユーザーに届く前に致命的な問題を見つけるために、テストケースの考え方を知っておくことが重要です。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "「テストケース作成」カテゴリで、具体的な機能に対するテストケースを設計。正常系・異常系・境界値の考え方を身につけます。",
      },
      { kind: "divider" },
      { kind: "heading", text: "危機管理とコミュニケーション" },
      {
        kind: "prose",
        text: "プロダクト障害が起きた時、PdMはエンジニアリングチームとビジネスチーム・顧客の間に立ち、影響範囲の把握・優先度判定・ステークホルダーへの報告・再発防止策の策定を行います。パニックにならず、体系的に対処する力が求められます。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "「障害対応」カテゴリで、P1〜P3レベルのインシデント対応シナリオを用意。トリアージからポストモーテムまで、実際の障害対応フローを体験します。",
      },
    ],
  },
  {
    id: "daily-work",
    number: 3,
    title: "PdMの日常業務と意思決定",
    subtitle: "1週間のスケジュールとよくある判断シーン",
    readingTime: "6 min read",
    heroAccent: "rgba(16,185,129,0.06)",
    blocks: [
      {
        kind: "lead",
        text: "PdMの仕事には「典型的な1日」がありません。月曜は開発チームとスプリントプランニング、火曜はユーザーインタビュー、水曜は経営層へのプレゼン——コンテキストスイッチの連続です。ここでは1週間の流れと、頻出する意思決定パターンを見ていきます。",
      },
      { kind: "heading", text: "PdMの1週間" },
      {
        kind: "timeline",
        steps: [
          {
            label: "月",
            title: "スプリントプランニング",
            body: "開発チームとスプリントの目標を決定。バックログの優先順位を確認し、次の1〜2週間で何を達成するかを合意する。",
          },
          {
            label: "火・水",
            title: "ステークホルダーMTG & リサーチ",
            body: "営業・CS からの顧客フィードバック収集、経営層とのロードマップ議論。ユーザーインタビューや行動データの分析で次の課題を掘り下げる。",
          },
          {
            label: "木",
            title: "PRD作成 & デザインレビュー",
            body: "機能の目的・背景・要件・成功指標をPRDにまとめる。デザイナーと一緒にUI/UXをレビューし、体験がビジネスゴールと合致しているか確認。",
          },
          {
            label: "金",
            title: "レトロスペクティブ & 振り返り",
            body: "スプリントの振り返り。何がうまくいき、何が課題だったかをチームで議論。KPIの推移を確認し、翌週の準備へ。",
          },
        ],
      },
      { kind: "divider" },
      { kind: "heading", text: "よくある意思決定シーン" },
      { kind: "subheading", text: "Go / No-Go の判断" },
      {
        kind: "prose",
        text: "新機能をリリースするか延期するか。品質、ビジネスインパクト、リスクを総合的に評価し、明確な基準に基づいて決定します。「まだバグがあるがビジネス上のタイミングが重要」——こうしたトレードオフの判断が日常的に求められます。",
      },
      { kind: "subheading", text: "スコープの調整" },
      {
        kind: "prose",
        text: "「もう少しリッチにしたい」という要望と「このスプリントで出す」という制約の間で、MVP（Minimum Viable Product）として何を含めるかを決める場面。PdMは「ユーザーに最低限の価値を届ける」ラインを見極めます。",
      },
      { kind: "subheading", text: "技術的負債 vs 新機能" },
      {
        kind: "prose",
        text: "エンジニアチームからのリファクタリング要求と、ビジネスチームからの新機能要求。どちらも正当ですが、PdMは長期的なプロダクト健全性と短期的なビジネスニーズのバランスを取る判断を下します。",
      },
      { kind: "divider" },
      { kind: "heading", text: "「なぜ」を共有する力" },
      {
        kind: "pullquote",
        text: "PdMの最も重要なコミュニケーションスキルは、「なぜこれをやるのか」をチーム全員に明確に伝える力。背景と意図を共有することで、メンバーが自律的に判断できるようになる。",
      },
      {
        kind: "callout",
        label: "pm-journeyでの鍛え方",
        text: "議事録作成シナリオでは会議の要点を整理して伝えるスキルを、自己紹介シナリオでは自分の役割と責務を明確に伝える力を練習します。これらはチームとの日常的なコミュニケーションの基盤です。",
      },
    ],
  },
  {
    id: "skill-map",
    number: 4,
    title: "pm-journeyで鍛えるスキルマップ",
    subtitle: "5つのカテゴリと各カテゴリで伸ばせるスキルの対応",
    readingTime: "4 min read",
    heroAccent: "rgba(139,92,246,0.06)",
    blocks: [
      {
        kind: "lead",
        text: "pm-journeyでは5つのカテゴリを段階的に進めることで、PdMに必要なスキルを基礎から実践まで身につけられます。各シナリオはリアルな業務状況を模擬した対話型の体験です。ここでは全体の構成と、各ステップで何が身につくかを確認しましょう。",
      },
      {
        kind: "skillcards",
        cards: [
          { step: "Step 1", title: "基礎ソフトスキル", skill: "自己紹介でのポジショニング、プロダクト理解のヒアリング、会議の議事録作成。すべてのカテゴリの土台となるコミュニケーション力を鍛える。", color: "#d9772a" },
          { step: "Step 2", title: "テストケース作成", skill: "ログイン・フォーム・ファイルアップロードなど具体的な機能に対するテストケース設計。正常系・異常系・境界値テストの考え方を学ぶ。", color: "#3b82f6" },
          { step: "Step 3", title: "要件定義", skill: "要件定義書の作成、ヒアリング計画の策定、ユーザーストーリーの作成。ステークホルダーのニーズを開発可能な形に変換するスキル。", color: "#e11d48" },
          { step: "Step 4", title: "障害対応", skill: "P1重大インシデントの初動対応、P2障害のトリアージ・エスカレーション、P3障害のポストモーテム。プレッシャー下での判断力を磨く。", color: "#10b981" },
          { step: "Step 5", title: "事業推進・戦略", skill: "優先度トレードオフ、データに基づくROI分析、プロダクト戦略の診断。ビジネスレベルの意思決定スキルを総合的に鍛える。", color: "#8b5cf6" },
        ],
      },
      { kind: "divider" },
      { kind: "heading", text: "修了証" },
      {
        kind: "prose",
        text: "5つのカテゴリすべてのシナリオに合格すると、pm-journeyの修了証が発行されます。対話型シナリオによる客観的な評価を通じて、PdMとしての基礎力が身についたことを確認できます。",
      },
      {
        kind: "callout",
        label: "ヒント",
        text: "各シナリオは何度でも再挑戦できます。フィードバックを参考に改善を重ね、合格を目指してみてください。",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Exports for HomePage                                               */
/* ------------------------------------------------------------------ */

export const lectureSummaries = lectures.map((l) => ({
  id: l.id,
  title: l.title,
  subtitle: l.subtitle,
  readingTime: l.readingTime,
}));

/* ------------------------------------------------------------------ */
/*  Block renderers                                                    */
/* ------------------------------------------------------------------ */

function renderBlock(block: ContentBlock, index: number) {
  const key = index;
  switch (block.kind) {
    case "lead":
      return (
        <p key={key} className="text-base leading-[1.95] text-gray-800 sm:text-lg sm:leading-[2]">
          {block.text}
        </p>
      );
    case "heading":
      return (
        <h2
          key={key}
          className="font-display text-xl text-gray-900 sm:text-2xl"
        >
          {block.text}
        </h2>
      );
    case "subheading":
      return (
        <h3
          key={key}
          className="text-[15px] font-semibold text-gray-800 sm:text-base"
        >
          {block.text}
        </h3>
      );
    case "prose":
      return (
        <p key={key} className="text-[14.5px] leading-[1.9] text-gray-700 sm:text-[15px] sm:leading-[2]">
          {block.text}
        </p>
      );
    case "pullquote":
      return (
        <blockquote
          key={key}
          className="relative my-2 border-l-[3px] border-[#d9772a] py-1 pl-5 sm:pl-6"
        >
          <p className="text-[15px] font-medium leading-[1.85] text-gray-800 sm:text-base">
            {block.text}
          </p>
          {block.cite ? (
            <cite className="mt-2 block text-xs not-italic text-gray-500">— {block.cite}</cite>
          ) : null}
        </blockquote>
      );
    case "callout":
      return (
        <aside
          key={key}
          className="rounded-xl border border-[rgba(217,119,42,0.2)] bg-orange-50/60 px-4 py-3.5 sm:px-5"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a34f18]">
            {block.label}
          </p>
          <p className="mt-1.5 text-[14px] leading-[1.85] text-gray-700">
            {block.text}
          </p>
        </aside>
      );
    case "diagram":
      return <div key={key}>{block.component()}</div>;
    case "comparison":
      return (
        <div key={key} className="grid gap-3 sm:grid-cols-3">
          {block.items.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 bg-gray-50/80 p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.label}
                </span>
                <span className="text-xs font-medium text-gray-500">{item.role}</span>
              </div>
              <p className="mt-3 text-[13px] leading-[1.8] text-gray-700">{item.focus}</p>
            </div>
          ))}
        </div>
      );
    case "timeline":
      return (
        <div key={key} className="relative space-y-0 pl-8 sm:pl-10">
          {/* vertical line */}
          <div
            className="absolute bottom-2 left-3 top-2 w-px bg-gradient-to-b from-[#d9772a]/50 to-[#d9772a]/10 sm:left-4"
          />
          {block.steps.map((step, i) => (
            <div key={i} className="relative pb-5">
              {/* dot */}
              <div className="absolute -left-5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#d9772a] text-[9px] font-bold text-white shadow-sm sm:-left-6 sm:h-6 sm:w-6 sm:text-[10px]">
                {step.label}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-gray-900">{step.title}</p>
                <p className="mt-1 text-[13.5px] leading-[1.8] text-gray-600">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "skillcards":
      return (
        <div key={key} className="space-y-3">
          {block.cards.map((card, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5"
            >
              <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: card.color }}
                >
                  {card.step.replace("Step ", "")}
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-gray-900">{card.title}</p>
                <p className="mt-1 text-[13.5px] leading-[1.8] text-gray-600">{card.skill}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "divider":
      return (
        <div key={key} className="flex items-center justify-center py-1">
          <div className="h-px w-12 bg-gray-200" />
          <div className="mx-3 h-1 w-1 rounded-full bg-gray-300" />
          <div className="h-px w-12 bg-gray-200" />
        </div>
      );
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

function findLecture(id: string | null): LectureDefinition | undefined {
  if (!id) return undefined;
  return lectures.find((l) => l.id === id);
}

export function LecturePage() {
  const [searchParams] = useSearchParams();
  const lectureId = searchParams.get("id");
  const lecture = useMemo(() => findLecture(lectureId), [lectureId]);

  const currentIndex = lectures.findIndex((l) => l.id === lectureId);
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : undefined;
  const nextLecture =
    currentIndex >= 0 && currentIndex < lectures.length - 1
      ? lectures[currentIndex + 1]
      : undefined;

  if (!lecture) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500">指定されたレクチャーが見つかりません。</p>
          <Link to="/" className="btn-secondary mt-4 inline-block">
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-4xl pb-8">
      {/* ---- Single white card: hero + content ---- */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="px-6 pb-6 pt-6 sm:px-10 sm:pt-8">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#d9772a] text-xs font-bold text-white shadow-sm">
              {lecture.number}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              {lecture.readingTime}
            </span>
          </div>
          <h1 className="font-display mt-4 text-[1.55rem] leading-tight text-gray-900 sm:text-[1.85rem]">
            {lecture.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {lecture.subtitle}
          </p>
        </header>

        <div className="mx-6 border-t border-gray-100 sm:mx-10" />

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="space-y-5">
            {lecture.blocks.map((block, i) => renderBlock(block, i))}
          </div>
        </div>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="mt-6 flex items-stretch gap-3">
        {prevLecture ? (
          <Link
            to={`/lecture?id=${prevLecture.id}`}
            className="group flex flex-1 flex-col rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition hover:border-[#d9772a]/40 hover:shadow-sm"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">前のレクチャー</span>
            <span className="mt-1 text-sm font-medium text-gray-700 group-hover:text-[#d9772a]">{prevLecture.title}</span>
          </Link>
        ) : (
          <Link
            to="/"
            className="group flex flex-1 flex-col rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition hover:border-[#d9772a]/40 hover:shadow-sm"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">戻る</span>
            <span className="mt-1 text-sm font-medium text-gray-700 group-hover:text-[#d9772a]">ホーム</span>
          </Link>
        )}
        {nextLecture ? (
          <Link
            to={`/lecture?id=${nextLecture.id}`}
            className="group flex flex-1 flex-col items-end rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-right transition hover:border-[#d9772a]/40 hover:shadow-sm"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">次のレクチャー</span>
            <span className="mt-1 text-sm font-medium text-gray-700 group-hover:text-[#d9772a]">{nextLecture.title}</span>
          </Link>
        ) : (
          <Link
            to="/"
            className="group flex flex-1 flex-col items-end rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-right transition hover:border-[#d9772a]/40 hover:shadow-sm"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">完了</span>
            <span className="mt-1 text-sm font-medium text-gray-700 group-hover:text-[#d9772a]">ロードマップへ進む</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
