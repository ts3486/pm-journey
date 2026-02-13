import { useMemo, useState } from "react";
import { useEntitlements } from "@/queries/entitlements";
import type { PlanCode } from "@/types";
import { api } from "@/services/api";

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
    features: ["対象シナリオを体験", "日次フェアユース上限あり", "基本履歴機能"],
  },
  {
    code: "INDIVIDUAL",
    name: "Individual",
    price: "¥1,280",
    period: "/ 月",
    description: "継続的に個人練習したい方向け。",
    features: [
      "全シナリオ利用可能（カテゴリ制限なし）",
      "クレジット制なし（フェアユース日次上限あり）",
      "Gemini Free Tier相当の利用帯域（アプリ側追加課金なし）",
      "個人向け深掘り学習",
    ],
  },
];

const planSortRank: Record<PlanCode, number> = {
  FREE: 0,
  INDIVIDUAL: 1,
  TEAM: 2,
};

export const checkoutNavigator = {
  assign(url: string) {
    window.location.assign(url);
  },
};

export function PricingPage() {
  const { data: entitlements, isLoading: isEntitlementsLoading } = useEntitlements();
  const currentPlanCode = entitlements?.planCode ?? "FREE";
  const isStatusLoading = isEntitlementsLoading;
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);

  const recommendedPlan = useMemo(() => {
    if (currentPlanCode === "FREE") return "INDIVIDUAL" as PlanCode;
    return "INDIVIDUAL" as PlanCode;
  }, [currentPlanCode]);

  const checkoutStatusMessage = useMemo(() => {
    const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");
    if (checkoutStatus === "success") {
      return "チェックアウトが完了しました。プラン反映まで少し時間がかかる場合があります。";
    }
    if (checkoutStatus === "cancel") {
      return "チェックアウトをキャンセルしました。";
    }
    return null;
  }, []);

  const handleStartIndividualCheckout = async () => {
    setCheckoutError(null);
    setCheckoutMessage(null);
    setIsCheckoutPending(true);

    try {
      const origin = window.location.origin;
      const response = await api.createIndividualCheckout({
        successUrl: `${origin}/pricing?checkout=success`,
        cancelUrl: `${origin}/pricing?checkout=cancel`,
      });

      if (response.alreadyEntitled) {
        setCheckoutMessage("すでにIndividual以上のプランが有効です。");
        return;
      }

      const checkoutUrl = response.checkoutUrl?.trim();
      if (!checkoutUrl) {
        setCheckoutError("チェックアウトURLを取得できませんでした。時間をおいて再試行してください。");
        return;
      }

      checkoutNavigator.assign(checkoutUrl);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "チェックアウトの開始に失敗しました。");
    } finally {
      setIsCheckoutPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Pricing</p>
        <h1 className="font-display text-2xl text-slate-900">料金プラン</h1>
        <p className="text-sm text-slate-600">
          Free / Individual の決済導線を有効化しています。Teamは次フェーズで公開予定です。
        </p>
      </header>

      {checkoutStatusMessage ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {checkoutStatusMessage}
        </section>
      ) : null}

      {checkoutMessage ? (
        <section className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          {checkoutMessage}
        </section>
      ) : null}

      {checkoutError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {checkoutError}
        </section>
      ) : null}

      <section className="card p-5">
        {isStatusLoading ? (
          <p className="text-sm text-slate-600">プラン情報を読み込み中...</p>
        ) : (
          <div className="flex flex-col gap-2 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">現在のプラン: {currentPlanCode}</p>
              {currentPlanCode === "INDIVIDUAL" ? (
                <p>AI利用: クレジット制ではなく、日次フェアユース上限で制御されます。</p>
              ) : currentPlanCode === "TEAM" ? (
                <p>TEAM機能は準備中です。現在は管理者向けプレビューとして扱われます。</p>
              ) : (
                <p>AI利用: 日次フェアユース上限で制御されます。</p>
              )}
            </div>
            <p className="text-xs text-slate-500">まずは Free / Individual の最短導線で公開します。</p>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {pricingPlans.map((plan) => {
          const isCurrent = currentPlanCode === plan.code;
          const isRecommended = recommendedPlan === plan.code && !isCurrent;
          const isLowerTier =
            currentPlanCode != null && planSortRank[plan.code] < planSortRank[currentPlanCode];
          const canStartCheckout =
            plan.code === "INDIVIDUAL" && !isCurrent && !isLowerTier && !isStatusLoading;
          const actionLabel = isCurrent
            ? "利用中"
            : canStartCheckout
              ? isCheckoutPending
                ? "チェックアウトへ移動中..."
                : "Individualを開始"
              : "準備中";

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
              <div className="mt-5">
                <button
                  type="button"
                  className="btn-secondary w-full"
                  disabled={!canStartCheckout || isCheckoutPending}
                  onClick={canStartCheckout ? () => void handleStartIndividualCheckout() : undefined}
                >
                  {actionLabel}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card p-5">
        <h2 className="font-display text-lg text-slate-900">Team（近日公開）</h2>
        <p className="mt-1 text-sm text-slate-600">
          チームプランは次フェーズで公開予定です。目安価格は <span className="font-semibold">¥3,000 / 月</span> です。
        </p>
      </section>
    </div>
  );
}
