import { useMemo } from "react";
import { Link } from "react-router-dom";
import { env } from "@/config/env";
import { canViewTeamManagement } from "@/lib/teamAccess";
import { useEntitlements } from "@/queries/entitlements";
import { useCurrentOrganization } from "@/queries/organizations";
import type { PlanCode } from "@/types";

type PricingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
};

const pricingPlans: PricingPlan[] = [
  {
    code: "FREE",
    name: "Free",
    price: "¥0",
    period: "無料",
    description: "まずは試したい個人学習者向け。",
    features: ["一部シナリオを体験", "日次チャット数上限あり", "基本履歴機能"],
  },
  {
    code: "TEAM",
    name: "Team",
    price: "¥3,000",
    period: "/ 月（組織固定）",
    description: "マネージャー主導で学習品質を高めるチーム向け。",
    features: [
      "組織単位の契約とメンバー管理",
      "全シナリオアクセス",
      "シナリオレビュー機能",
      "メンバーダッシュボード機能",
      "プロンプト調整機能",
      "チーム利用向けチャット数上限",
      "メンバー上限は最大10名まで設定可能",
    ],
  },
];

const planSortRank: Record<PlanCode, number> = {
  FREE: 0,
  TEAM: 1,
};

export function PricingPage() {
  const { data: entitlements, isLoading: isEntitlementsLoading } = useEntitlements();
  const { data: currentOrganization, isLoading: isOrganizationLoading } = useCurrentOrganization();

  const currentPlanCode = entitlements?.planCode ?? "FREE";
  const currentOrganizationId = currentOrganization?.organization.id ?? null;
  const currentOrganizationRole = currentOrganization?.membership.role ?? null;
  const canAccessTeamManagement = canViewTeamManagement(currentOrganizationRole);

  const recommendedPlan = useMemo<PlanCode | null>(() => {
    if (currentPlanCode === "FREE") return "TEAM";
    return null;
  }, [currentPlanCode]);

  const checkoutStatusMessage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    const checkoutPlan = params.get("plan");
    if (checkoutPlan !== "team") return null;
    if (checkoutStatus === "success") {
      return "Teamチェックアウトが完了しました。プラン反映まで少し時間がかかる場合があります。";
    }
    if (checkoutStatus === "cancel") {
      return "Teamチェックアウトをキャンセルしました。";
    }
    return null;
  }, []);

  if (!env.billingEnabled) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pricing</p>
          <h1 className="font-display text-2xl text-slate-900">課金機能を一時停止中</h1>
          <p className="text-sm text-slate-600">
            現在は課金なしで動作確認できるモードです。Team設定や組織管理はそのままテストできます。
          </p>
        </header>

        <section className="card p-5">
          {isEntitlementsLoading ? (
            <p className="text-sm text-slate-600">プラン情報を読み込み中...</p>
          ) : (
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                現在のプラン: <span className="font-semibold text-slate-900">{currentPlanCode}</span>
              </p>
              <p>
                組織:{" "}
                <span className="font-semibold text-slate-900">
                  {currentOrganizationId ? `${currentOrganizationId}（参加済み）` : "未所属"}
                </span>
              </p>
              <p>
                あなたのロール:{" "}
                <span className="font-semibold text-slate-900">{currentOrganizationRole ?? "未所属"}</span>
              </p>
            </div>
          )}
        </section>

        <section className="flex flex-wrap gap-3">
          <Link to="/team/onboarding" className="btn-secondary">
            チーム設定を開始
          </Link>
          {canAccessTeamManagement ? (
            <Link to="/settings/team" className="btn-secondary">
              Team管理を開く
            </Link>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pricing</p>
        <h1 className="font-display text-2xl text-slate-900">料金プラン</h1>
        <p className="text-sm text-slate-600">チーム作成・参加はチームオンボーディングから行えます。</p>
      </header>

      {checkoutStatusMessage ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {checkoutStatusMessage}
        </section>
      ) : null}

      <section className="card p-5">
        {isEntitlementsLoading ? (
          <p className="text-sm text-slate-600">プラン情報を読み込み中...</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">現在のプラン: {currentPlanCode}</p>
              {currentPlanCode === "TEAM" ? (
                <p>
                  AI利用: 組織単位の日次フェアユース上限で制御されます。
                  {entitlements?.organizationId ? `（組織ID: ${entitlements.organizationId}）` : ""}
                </p>
              ) : (
                <p>AI利用: 日次フェアユース上限で制御されます。</p>
              )}
            </div>
            <p className="text-xs text-slate-500">チーム運用が必要な場合は Team を利用してください。</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {pricingPlans.map((plan) => {
          const isCurrent = currentPlanCode === plan.code;
          const isRecommended = recommendedPlan === plan.code && !isCurrent;
          const isLowerTier = planSortRank[plan.code] < planSortRank[currentPlanCode];
          const canStartTeamOnboarding =
            plan.code === "TEAM" &&
            !isCurrent &&
            !isLowerTier &&
            !isEntitlementsLoading &&
            !isOrganizationLoading;

          const actionLabel = isCurrent
            ? "利用中"
            : plan.code === "TEAM"
              ? "チーム設定へ進む"
              : "Freeを利用中";

          const isActionDisabled = plan.code === "TEAM" ? !canStartTeamOnboarding : true;

          return (
            <article
              key={plan.code}
              className={`card p-5 ${isCurrent ? "border-orange-400" : ""} ${
                isRecommended ? "shadow-[0_18px_36px_rgba(176,95,35,0.18)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl text-slate-900">{plan.name}</h2>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>
                {isCurrent ? <span className="badge-accent">Current</span> : null}
                {!isCurrent && isRecommended ? <span className="badge">Recommended</span> : null}
              </div>

              <div className="mt-4">
                <p className="text-2xl font-semibold text-slate-900">{plan.price}</p>
                <p className="text-xs text-slate-500">{plan.period}</p>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>・ {feature}</li>
                ))}
              </ul>

              {plan.code === "TEAM" ? (
                <section className="mt-5 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <p>
                    組織:{" "}
                    <span className="font-semibold">
                      {currentOrganizationId ? `${currentOrganizationId}（参加済み）` : "未所属（オンボーディングで作成可能）"}
                    </span>
                  </p>
                  <p>
                    あなたのロール:{" "}
                    <span className="font-semibold">{currentOrganizationRole ?? "未所属"}</span>
                  </p>
                  <p>チーム作成または招待参加はチームオンボーディングで実行します。</p>
                  {!currentOrganizationId ? (
                    <Link to="/team/onboarding" className="btn-secondary mt-1 w-full">
                      招待で既存チームに参加する場合はこちら
                    </Link>
                  ) : null}
                </section>
              ) : null}

              <div className="mt-5">
                {plan.code === "TEAM" && !isActionDisabled ? (
                  <Link to="/team/onboarding" className="btn-secondary block w-full text-center">
                    {actionLabel}
                  </Link>
                ) : (
                  <button type="button" className="btn-secondary w-full" disabled>
                    {actionLabel}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
