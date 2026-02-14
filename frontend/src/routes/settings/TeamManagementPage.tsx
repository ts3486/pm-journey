import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useEntitlements } from "@/queries/entitlements";
import {
  useCurrentOrganization,
  useCurrentOrganizationMembers,
  useCurrentOrganizationProgress,
} from "@/queries/organizations";
import { api } from "@/services/api";
import type {
  CreateOrganizationInvitationRequest,
  OrganizationMember,
  OrganizationMemberProgress,
  UpdateOrganizationMemberRequest,
} from "@/types";

const memberRoleOptions: Array<CreateOrganizationInvitationRequest["role"]> = [
  "admin",
  "manager",
  "member",
  "reviewer",
];

const memberStatusOptions: Array<NonNullable<UpdateOrganizationMemberRequest["status"]>> = [
  "active",
  "invited",
  "deactivated",
];

const canManageMembers = (role?: string | null): boolean => {
  return role === "owner" || role === "admin" || role === "manager";
};

const roleLabel = (role: OrganizationMember["role"]) => {
  const labels: Record<OrganizationMember["role"], string> = {
    owner: "owner",
    admin: "admin",
    manager: "manager",
    member: "member",
    reviewer: "reviewer",
  };
  return labels[role];
};

const statusLabel = (status: OrganizationMember["status"]) => {
  const labels: Record<OrganizationMember["status"], string> = {
    active: "active",
    invited: "invited",
    deactivated: "deactivated",
  };
  return labels[status];
};

const progressCompletionLabel = (progress: OrganizationMemberProgress) => {
  if (progress.totalSessions <= 0) {
    return "未開始";
  }
  const rawRate = (progress.completedSessions / progress.totalSessions) * 100;
  const roundedRate = Math.round(rawRate);
  return `${roundedRate}% (${progress.completedSessions}/${progress.totalSessions})`;
};

const cleanupDraft = <T extends string>(drafts: Record<string, T>, memberId: string): Record<string, T> => {
  const { [memberId]: _removed, ...rest } = drafts;
  return rest;
};

export function TeamManagementPage() {
  const {
    data: entitlements,
    isLoading: isEntitlementsLoading,
    isError: isEntitlementsError,
    error: entitlementsError,
  } = useEntitlements();
  const {
    data: currentOrganization,
    isLoading: isCurrentOrganizationLoading,
    error: currentOrganizationError,
    refetch: refetchCurrentOrganization,
  } = useCurrentOrganization();

  const currentPlanCode = entitlements?.planCode ?? "FREE";
  const isTeamPlan = currentPlanCode === "TEAM";

  const {
    data: organizationMembers,
    isLoading: isMembersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useCurrentOrganizationMembers(isTeamPlan && Boolean(currentOrganization));

  const {
    data: organizationProgress,
    isLoading: isProgressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useCurrentOrganizationProgress(
    isTeamPlan &&
      Boolean(currentOrganization) &&
      canManageMembers(currentOrganization?.membership.role ?? null),
  );

  const [teamActionError, setTeamActionError] = useState<string | null>(null);
  const [teamActionMessage, setTeamActionMessage] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CreateOrganizationInvitationRequest["role"]>("member");
  const [isInvitePending, setIsInvitePending] = useState(false);
  const [pendingMemberActionId, setPendingMemberActionId] = useState<string | null>(null);
  const [roleDraftByMemberId, setRoleDraftByMemberId] = useState<
    Record<string, OrganizationMember["role"]>
  >({});
  const [statusDraftByMemberId, setStatusDraftByMemberId] = useState<
    Record<string, OrganizationMember["status"]>
  >({});

  const currentUserRole = currentOrganization?.membership.role ?? null;
  const canManageTeam = canManageMembers(currentUserRole);

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

  const teamSummaryMessage = useMemo(() => {
    if (isCurrentOrganizationLoading) {
      return "組織情報を読み込み中...";
    }
    if (!currentOrganization) {
      return "組織に未参加のため、Team管理は利用できません。";
    }
    if (!canManageTeam) {
      return "閲覧のみ可能です。Team管理操作は owner / admin / manager に限定されています。";
    }
    return null;
  }, [canManageTeam, currentOrganization, isCurrentOrganizationLoading]);

  const refreshTeamData = async () => {
    await Promise.all([refetchCurrentOrganization(), refetchMembers(), refetchProgress()]);
  };

  const handleCreateInvitation = async () => {
    setTeamActionError(null);
    setTeamActionMessage(null);

    const email = inviteEmail.trim();
    if (!email) {
      setTeamActionError("招待メールアドレスを入力してください。");
      return;
    }
    if (!canManageTeam) {
      setTeamActionError("招待操作は owner / admin / manager のみ実行できます。");
      return;
    }

    setIsInvitePending(true);
    try {
      const response = await api.createOrganizationInvitation({
        email,
        role: inviteRole,
      });
      const inviteLink =
        response.inviteLink?.trim() ||
        `${window.location.origin}/team/onboarding?invite=${encodeURIComponent(
          response.inviteToken,
        )}`;
      const deliveryStatus = response.emailDelivery?.status ?? "skipped";
      const deliveryMessage =
        deliveryStatus === "sent"
          ? "招待メールを送信しました。"
          : deliveryStatus === "failed"
            ? `招待メール送信に失敗しました（${response.emailDelivery?.message ?? "unknown error"}）。`
            : "メール送信は未設定のため、招待リンクを手動で共有してください。";
      setInviteEmail("");
      setTeamActionMessage(`招待を作成しました。${deliveryMessage} 招待リンク: ${inviteLink}`);
      await refreshTeamData();
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : "招待の作成に失敗しました。");
    } finally {
      setIsInvitePending(false);
    }
  };

  const handleUpdateMemberRole = async (member: OrganizationMember) => {
    setTeamActionError(null);
    setTeamActionMessage(null);
    const nextRole = roleDraftByMemberId[member.id] ?? member.role;
    if (nextRole === member.role) {
      return;
    }
    setPendingMemberActionId(`role:${member.id}`);
    try {
      await api.updateCurrentOrganizationMember(member.id, { role: nextRole });
      setRoleDraftByMemberId((prev) => cleanupDraft(prev, member.id));
      setTeamActionMessage(`メンバー ${member.userId} のロールを更新しました。`);
      await refreshTeamData();
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : "ロール更新に失敗しました。");
    } finally {
      setPendingMemberActionId(null);
    }
  };

  const handleUpdateMemberStatus = async (member: OrganizationMember) => {
    setTeamActionError(null);
    setTeamActionMessage(null);
    const nextStatus = statusDraftByMemberId[member.id] ?? member.status;
    if (nextStatus === member.status) {
      return;
    }
    setPendingMemberActionId(`status:${member.id}`);
    try {
      await api.updateCurrentOrganizationMember(member.id, { status: nextStatus });
      setStatusDraftByMemberId((prev) => cleanupDraft(prev, member.id));
      setTeamActionMessage(`メンバー ${member.userId} の状態を更新しました。`);
      await refreshTeamData();
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : "状態更新に失敗しました。");
    } finally {
      setPendingMemberActionId(null);
    }
  };

  const handleDeleteMember = async (member: OrganizationMember) => {
    setTeamActionError(null);
    setTeamActionMessage(null);
    setPendingMemberActionId(`delete:${member.id}`);
    try {
      await api.deleteCurrentOrganizationMember(member.id);
      setTeamActionMessage(`メンバー ${member.userId} を削除しました。`);
      await refreshTeamData();
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : "メンバー削除に失敗しました。");
    } finally {
      setPendingMemberActionId(null);
    }
  };

  if (isEntitlementsLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        プラン情報を読み込み中...
      </section>
    );
  }

  if (isEntitlementsError) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {entitlementsError instanceof Error ? entitlementsError.message : "プラン情報の取得に失敗しました。"}
      </section>
    );
  }

  if (!isTeamPlan) {
    return <Navigate to="/settings/billing" replace />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team管理</p>
        <h1 className="font-display text-2xl text-slate-900">Team Management</h1>
        <p className="text-sm text-slate-600">メンバー管理とメンバー利用状況を確認できます。</p>
      </header>

      {teamSummaryMessage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {teamSummaryMessage}
        </p>
      ) : null}
      {!isCurrentOrganizationLoading && !currentOrganization ? (
        <div>
          <Link to="/team/onboarding" className="btn-secondary">
            組織を作成 / 招待に参加
          </Link>
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
      {progressError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {progressError instanceof Error ? progressError.message : "進捗情報の取得に失敗しました。"}
        </p>
      ) : null}

      {teamActionMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {teamActionMessage}
        </p>
      ) : null}
      {teamActionError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {teamActionError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">メンバー一覧</h2>
          <p className="text-xs text-slate-600">メンバー利用: {seatUsageText}</p>

          {isMembersLoading ? (
            <p className="text-sm text-slate-600">メンバー情報を読み込み中...</p>
          ) : organizationMembers?.members?.length ? (
            <div className="space-y-3">
              {organizationMembers.members.map((member) => {
                const roleDraft = roleDraftByMemberId[member.id] ?? member.role;
                const statusDraft = statusDraftByMemberId[member.id] ?? member.status;
                const rolePending = pendingMemberActionId === `role:${member.id}`;
                const statusPending = pendingMemberActionId === `status:${member.id}`;
                const deletePending = pendingMemberActionId === `delete:${member.id}`;

                return (
                  <article
                    key={member.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold text-slate-900">{member.userId}</p>
                      <p className="text-xs text-slate-600">
                        role: {roleLabel(member.role)} / status: {statusLabel(member.status)}
                      </p>
                    </div>

                    {canManageTeam ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="flex gap-2">
                          <select
                            aria-label={`role-${member.id}`}
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                            value={roleDraft}
                            onChange={(event) =>
                              setRoleDraftByMemberId((prev) => ({
                                ...prev,
                                [member.id]: event.target.value as OrganizationMember["role"],
                              }))
                            }
                            disabled={rolePending}
                          >
                            {memberRoleOptions.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-secondary shrink-0"
                            onClick={() => void handleUpdateMemberRole(member)}
                            disabled={rolePending || roleDraft === member.role}
                          >
                            {rolePending ? "更新中..." : "ロール更新"}
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <select
                            aria-label={`status-${member.id}`}
                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                            value={statusDraft}
                            onChange={(event) =>
                              setStatusDraftByMemberId((prev) => ({
                                ...prev,
                                [member.id]: event.target.value as OrganizationMember["status"],
                              }))
                            }
                            disabled={statusPending}
                          >
                            {memberStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn-secondary shrink-0"
                            onClick={() => void handleUpdateMemberStatus(member)}
                            disabled={statusPending || statusDraft === member.status}
                          >
                            {statusPending ? "更新中..." : "状態更新"}
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-secondary sm:col-span-2"
                          onClick={() => void handleDeleteMember(member)}
                          disabled={deletePending || member.role === "owner"}
                        >
                          {deletePending ? "削除中..." : "メンバー削除"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-600">表示できるメンバー情報はありません。</p>
          )}
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-900">メンバー招待</h2>
          <p className="text-xs text-slate-600">active + pending がメンバー上限を超える招待は作成できません。</p>
          <label className="flex flex-col gap-1 text-xs text-slate-700">
            メールアドレス
            <input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="member@example.com"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
              disabled={!canManageTeam || isInvitePending}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-700">
            ロール
            <select
              value={inviteRole}
              onChange={(event) =>
                setInviteRole(event.target.value as CreateOrganizationInvitationRequest["role"])
              }
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
              disabled={!canManageTeam || isInvitePending}
            >
              {memberRoleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => void handleCreateInvitation()}
            disabled={!canManageTeam || isInvitePending}
          >
            {isInvitePending ? "招待を作成中..." : "招待を作成"}
          </button>
        </section>
      </div>

      {canManageTeam ? (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">メンバー進捗</h2>
            <p className="text-xs text-slate-500">
              最終更新: {organizationProgress?.generatedAt ?? "読み込み中..."}
            </p>
          </div>
          {isProgressLoading ? (
            <p className="text-sm text-slate-600">進捗情報を読み込み中...</p>
          ) : organizationProgress?.members?.length ? (
            <div className="space-y-2">
              {organizationProgress.members.map((progress) => (
                <article
                  key={progress.memberId}
                  className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 sm:grid-cols-5"
                >
                  <div className="sm:col-span-2">
                    <p className="font-semibold text-slate-900">{progress.name || progress.userId}</p>
                    <p className="text-xs text-slate-600">{progress.email || progress.userId}</p>
                    <p className="text-xs text-slate-600">
                      role: {progress.role} / status: {progress.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">完了率</p>
                    <p className="font-semibold">{progressCompletionLabel(progress)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">評価済み</p>
                    <p className="font-semibold">
                      {progress.evaluatedSessions} / {progress.totalSessions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">最終活動</p>
                    <p className="font-semibold">{progress.lastActivityAt ?? "なし"}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">進捗表示対象のメンバーはまだいません。</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
