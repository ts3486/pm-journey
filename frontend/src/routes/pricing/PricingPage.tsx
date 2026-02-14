import { useMemo } from "react";
import { Link } from "react-router-dom";
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

const canManageTeamCheckoutRole = (role?: string | null): boolean => {
  return role === "owner" || role === "admin" || role === "manager";
};

const teamRegistrationPath = "/team/onboarding?flow=register";

export function PricingPage() {
  const { data: entitlements, isLoading: isEntitlementsLoading } = useEntitlements();
  const { data: currentOrganization, isLoading: isOrganizationLoading } = useCurrentOrganization();

  const currentPlanCode = entitlements?.planCode ?? "FREE";
  const currentOrganizationId = currentOrganization?.organization.id ?? null;
  const currentOrganizationRole = currentOrganization?.membership.role ?? null;

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

  const teamRegistrationDisabledReason = useMemo(() => {
    if (isOrganizationLoading) {
      return "組織情報を確認中です。";
    }
    if (currentOrganizationId && !canManageTeamCheckoutRole(currentOrganizationRole)) {
      return "Teamチェックアウトは owner / admin / manager のみ実行できます。";
    }
    return null;
  }, [currentOrganizationId, currentOrganizationRole, isOrganizationLoading]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pricing</p>
        <h1 className="font-display text-2xl text-slate-900">料金プラン</h1>
        <p className="text-sm text-slate-600">Team設定は登録フロー内で入力・確認してから決済へ進みます。</p>
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
          const canStartTeamRegistration =
            plan.code === "TEAM" &&
            !isCurrent &&
            !isLowerTier &&
            !isEntitlementsLoading &&
            !teamRegistrationDisabledReason;

          const actionLabel = isCurrent
            ? "利用中"
            : plan.code === "TEAM"
              ? "Team登録を開始"
              : "Freeを利用中";

          const isActionDisabled = plan.code === "TEAM" ? !canStartTeamRegistration : true;

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
                      {currentOrganizationId ? `${currentOrganizationId}（参加済み）` : "未所属（登録フローで作成可能）"}
                    </span>
                  </p>
                  <p>
                    あなたのロール:{" "}
                    <span className="font-semibold">{currentOrganizationRole ?? "未所属"}</span>
                  </p>
                  <p>Team設定（チーム名・メンバー数）は次の登録フローで入力して確認します。</p>
                  {teamRegistrationDisabledReason ? (
                    <p className="text-amber-700">{teamRegistrationDisabledReason}</p>
                  ) : null}
                  {!currentOrganizationId ? (
                    <Link to="/team/onboarding" className="btn-secondary mt-1 w-full">
                      招待で既存チームに参加する場合はこちら
                    </Link>
                  ) : null}
                </section>
              ) : null}

              <div className="mt-5">
                {plan.code === "TEAM" && !isActionDisabled ? (
                  <Link to={teamRegistrationPath} className="btn-secondary block w-full text-center">
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
