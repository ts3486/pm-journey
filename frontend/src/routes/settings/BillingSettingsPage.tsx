import { useState } from "react";
import { Link } from "react-router-dom";
import { useEntitlements } from "@/queries/entitlements";
import type { PlanCode } from "@/types";
import { api } from "@/services/api";

const planLabel: Record<PlanCode, string> = {
  FREE: "Free",
  INDIVIDUAL: "Individual",
  TEAM: "Team",
};

type BillingStatus = {
  label: string;
  description: string;
};

function billingStatusForPlan(planCode: PlanCode): BillingStatus {
  if (planCode === "INDIVIDUAL") {
    return {
      label: "有効",
      description: "Individualプランの利用権が有効です。",
    };
  }

  if (planCode === "TEAM") {
    return {
      label: "準備中",
      description: "Team請求機能は次フェーズで公開予定です。",
    };
  }

  return {
    label: "未契約",
    description: "現在はFreeプランです。必要に応じてIndividualにアップグレードできます。",
  };
}

export const billingPortalNavigator = {
  assign(url: string) {
    window.location.assign(url);
  },
};

export function BillingSettingsPage() {
  const {
    data: entitlements,
    isLoading: isEntitlementsLoading,
    isError: isEntitlementsError,
    error: entitlementsError,
  } = useEntitlements();
  const currentPlanCode = entitlements?.planCode ?? "FREE";
  const billingStatus = billingStatusForPlan(currentPlanCode);
  const [isPortalPending, setIsPortalPending] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleOpenBillingPortal = async () => {
    setPortalError(null);
    setIsPortalPending(true);
    try {
      const response = await api.createBillingPortalSession({
        returnUrl: `${window.location.origin}/settings/billing`,
      });
      const url = response.url?.trim();
      if (!url) {
        setPortalError("請求ポータルURLを取得できませんでした。");
        return;
      }
      billingPortalNavigator.assign(url);
    } catch (error) {
      setPortalError(error instanceof Error ? error.message : "請求ポータルを開けませんでした。");
    } finally {
      setIsPortalPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">請求設定</p>
        <h1 className="font-display text-2xl text-slate-900">Billing Settings</h1>
        <p className="text-sm text-slate-600">
          現在のプランと請求ステータスを確認できます。支払い情報の詳細管理は次フェーズで追加予定です。
        </p>
      </header>

      {isEntitlementsLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          請求情報を読み込み中...
        </section>
      ) : isEntitlementsError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {entitlementsError instanceof Error ? entitlementsError.message : "請求情報の取得に失敗しました"}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">現在のプラン: {planLabel[currentPlanCode]}</p>
            <p className="text-sm text-slate-700">
              支払い状態: <span className="font-semibold">{billingStatus.label}</span>
            </p>
            <p className="text-sm text-slate-600">{billingStatus.description}</p>
          </div>

          {portalError ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {portalError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/pricing" className="btn-secondary">
              {currentPlanCode === "FREE" ? "Individualを開始" : "料金ページを開く"}
            </Link>
            {currentPlanCode === "INDIVIDUAL" ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void handleOpenBillingPortal()}
                disabled={isPortalPending}
              >
                {isPortalPending ? "請求ポータルを開いています..." : "請求情報を管理"}
              </button>
            ) : null}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg text-slate-900">次フェーズで追加予定</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>・ 支払い方法の変更</li>
          <li>・ 領収書 / 請求書のダウンロード</li>
          <li>・ Teamプランの契約・メンバー管理</li>
        </ul>
      </section>
    </div>
  );
}
