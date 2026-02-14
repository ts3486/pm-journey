import { useState } from "react";
import { Link } from "react-router-dom";
import { useEntitlements } from "@/queries/entitlements";
import { useCurrentOrganization, useCurrentOrganizationMembers } from "@/queries/organizations";
import { api } from "@/services/api";
import type { PlanCode } from "@/types";

const planLabel: Record<PlanCode, string> = {
  FREE: "Free",
  TEAM: "Team",
};

type BillingStatus = {
  label: string;
  description: string;
};

function billingStatusForPlan(planCode: PlanCode): BillingStatus {
  if (planCode === "TEAM") {
    return {
      label: "有効",
      description: "Teamプランの利用権が有効です。組織単位で月額3,000円の固定請求です。",
    };
  }

  return {
    label: "未契約",
    description: "現在はFreeプランです。必要に応じてTeamにアップグレードできます。",
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
  const {
    data: currentOrganization,
    error: currentOrganizationError,
  } = useCurrentOrganization();
  const {
    data: organizationMembers,
    error: membersError,
  } = useCurrentOrganizationMembers(Boolean(currentOrganization));

  const currentPlanCode = entitlements?.planCode ?? "FREE";
  const billingStatus = billingStatusForPlan(currentPlanCode);

  const [isPortalPending, setIsPortalPending] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const organizationId = currentOrganization?.organization.id ?? null;
  const organizationName = currentOrganization?.organization.name ?? null;
  const currentUserRole = currentOrganization?.membership.role ?? null;

  const seatLimit = organizationMembers?.seatLimit ?? currentOrganization?.seatLimit;
  const activeMemberCount =
    organizationMembers?.activeMemberCount ?? currentOrganization?.activeMemberCount ?? 0;
  const pendingInvitationCount =
    organizationMembers?.pendingInvitationCount ?? currentOrganization?.pendingInvitationCount ?? 0;
  const seatUsed = activeMemberCount + pendingInvitationCount;
  const seatUsageText =
    seatLimit != null
      ? `${seatUsed} / ${seatLimit}（active ${activeMemberCount} + pending ${pendingInvitationCount}）`
      : `${seatUsed}（active ${activeMemberCount} + pending ${pendingInvitationCount}）`;

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
        <p className="text-sm text-slate-600">現在のプランと請求状態を確認できます。</p>
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

            {organizationId ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                <p>
                  組織: <span className="font-semibold">{organizationName}</span> ({organizationId})
                </p>
                <p>
                  あなたのロール: <span className="font-semibold">{currentUserRole}</span>
                </p>
                <p>
                  メンバー利用: <span className="font-semibold">{seatUsageText}</span>
                </p>
              </div>
            ) : null}

            {currentOrganizationError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {currentOrganizationError instanceof Error
                  ? currentOrganizationError.message
                  : "組織情報の取得に失敗しました。"}
              </p>
            ) : null}

            {membersError ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {membersError instanceof Error ? membersError.message : "メンバー情報の取得に失敗しました。"}
              </p>
            ) : null}
          </div>

          {portalError ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {portalError}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/pricing" className="btn-secondary">
              {currentPlanCode === "FREE" ? "アップグレードする" : "料金ページを開く"}
            </Link>
            {currentPlanCode !== "FREE" ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void handleOpenBillingPortal()}
                disabled={isPortalPending}
              >
                {isPortalPending ? "請求ポータルを開いています..." : "請求情報を管理"}
              </button>
            ) : null}
            {currentPlanCode === "TEAM" ? (
              <Link to="/settings/team" className="btn-secondary">
                Team管理を開く
              </Link>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
