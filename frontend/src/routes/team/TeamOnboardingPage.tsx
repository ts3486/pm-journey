import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { env } from "@/config/env";
import { canViewTeamManagement } from "@/lib/teamAccess";
import { queryKeys } from "@/queries/keys";
import { useCurrentOrganization } from "@/queries/organizations";
import { api } from "@/services/api";

type InviteFeedbackTone = "info" | "success" | "warning" | "error";

type InviteFeedback = {
  tone: InviteFeedbackTone;
  title: string;
  description: string;
  suggestion?: string;
};

const inviteFeedbackToneClass: Record<InviteFeedbackTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const mapCreateOrganizationErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "チーム作成に失敗しました。";
  if (/organization name is required/i.test(message)) {
    return "チーム名を入力してください。";
  }
  return message;
};

const inviteTokenDetectedFeedback = (): InviteFeedback => ({
  tone: "info",
  title: "招待トークンを検出しました",
  description: "招待トークンを確認して「招待に参加する」を実行してください。",
});

const mapInviteAcceptanceFeedback = (error: unknown): InviteFeedback => {
  const message = error instanceof Error ? error.message : "招待受諾に失敗しました。";
  if (/invitation not found/i.test(message)) {
    return {
      tone: "error",
      title: "招待が見つかりません",
      description: "招待トークンが見つかりません。最新の招待リンクを確認してください。",
    };
  }
  if (/invitation has expired/i.test(message)) {
    return {
      tone: "warning",
      title: "招待の有効期限が切れています",
      description: "この招待は期限切れです。管理者に再招待を依頼してください。",
      suggestion: "新しい招待リンクを受け取ったら、同じ画面で再度参加できます。",
    };
  }
  if (/invitation is no longer active/i.test(message)) {
    return {
      tone: "warning",
      title: "この招待は利用できません",
      description: "この招待はすでに受諾済み、または管理者によって無効化されています。",
      suggestion: "未参加の場合は管理者に新しい招待リンクを依頼してください。",
    };
  }
  if (/FORBIDDEN_ROLE: invitation email does not match current user/i.test(message)) {
    return {
      tone: "error",
      title: "招待先メールとログイン中アカウントが不一致です",
      description: "ログイン中のメールアドレスが招待先と一致しません。",
      suggestion: "正しいアカウントで再ログインしてから招待に参加してください。",
    };
  }
  if (/SEAT_LIMIT_EXCEEDED/i.test(message)) {
    return {
      tone: "warning",
      title: "メンバー上限に達しています",
      description: "現在のメンバー上限に達しているため参加できません。",
      suggestion: "管理者にメンバー上限の引き上げ、または空き枠の確保を依頼してください。",
    };
  }
  return {
    tone: "error",
    title: "招待受諾に失敗しました",
    description: message,
  };
};

export function TeamOnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const {
    data: currentOrganization,
    isLoading: isCurrentOrganizationLoading,
    error: currentOrganizationError,
  } = useCurrentOrganization();

  const inviteTokenFromQuery = searchParams.get("invite")?.trim() ?? "";
  const [teamName, setTeamName] = useState("");
  const [inviteToken, setInviteToken] = useState(inviteTokenFromQuery);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [isAcceptPending, setIsAcceptPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<InviteFeedback | null>(
    inviteTokenFromQuery ? inviteTokenDetectedFeedback() : null,
  );

  const currentOrganizationId = currentOrganization?.organization.id ?? null;
  const currentOrganizationName = currentOrganization?.organization.name ?? null;
  const currentRole = currentOrganization?.membership.role ?? null;
  const canAccessTeamManagement = canViewTeamManagement(currentRole);
  const hasCurrentOrganization = Boolean(currentOrganizationId);
  const postOnboardingPath = env.billingEnabled ? "/settings/billing" : "/settings/team";
  const existingOrganizationPath = env.billingEnabled
    ? "/settings/billing"
    : canAccessTeamManagement
      ? "/settings/team"
      : "/settings/account";
  const isActionDisabled = isCreatePending || isAcceptPending || hasCurrentOrganization;

  useEffect(() => {
    if (!inviteTokenFromQuery) return;
    setInviteToken(inviteTokenFromQuery);
    setInviteFeedback(inviteTokenDetectedFeedback());
    setActionError(null);
    setActionMessage(null);
  }, [inviteTokenFromQuery]);

  const refreshTeamContext = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.current() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.progress() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.detail() }),
    ]);
  };

  const handleCreateOrganization = async () => {
    setActionError(null);
    setActionMessage(null);

    if (hasCurrentOrganization) {
      setActionError("すでにチームに参加しています。現在のチーム設定からTeam管理を進めてください。");
      return;
    }

    const normalizedName = teamName.trim();
    if (!normalizedName) {
      setActionError("チーム名を入力してください。");
      return;
    }

    setIsCreatePending(true);
    try {
      const created = await api.createOrganization({ name: normalizedName });
      await refreshTeamContext();
      setActionMessage(
        env.billingEnabled
          ? `チーム ${created.name} を作成しました。請求設定へ移動します。`
          : `チーム ${created.name} を作成しました。Team管理へ移動します。`,
      );
      navigate(postOnboardingPath);
    } catch (error) {
      setActionError(mapCreateOrganizationErrorMessage(error));
    } finally {
      setIsCreatePending(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setActionError(null);
    setActionMessage(null);

    if (hasCurrentOrganization) {
      setInviteFeedback({
        tone: "warning",
        title: "すでにチーム参加済みです",
        description: "招待参加は未所属ユーザーのみ実行できます。",
      });
      return;
    }

    const normalizedToken = inviteToken.trim();
    if (!normalizedToken) {
      setInviteFeedback({
        tone: "warning",
        title: "招待トークンが未入力です",
        description: "招待トークンを入力してください。",
      });
      return;
    }

    setIsAcceptPending(true);
    setInviteFeedback({
      tone: "info",
      title: "招待を確認中です",
      description: "トークンを検証しています。しばらくお待ちください。",
    });
    try {
      await api.acceptOrganizationInvitation(normalizedToken);
      await refreshTeamContext();
      setInviteFeedback({
        tone: "success",
        title: "招待を受諾しました",
        description: env.billingEnabled
          ? "請求設定ページへ移動します。"
          : "Team管理ページへ移動します。",
      });
      setActionMessage(
        env.billingEnabled
          ? "招待を受諾しました。請求設定へ移動します。"
          : "招待を受諾しました。Team管理へ移動します。",
      );
      navigate(postOnboardingPath);
    } catch (error) {
      setInviteFeedback(mapInviteAcceptanceFeedback(error));
    } finally {
      setIsAcceptPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team Onboarding</p>
        <h1 className="font-display text-2xl text-slate-900">チーム利用の開始</h1>
        <p className="text-sm text-slate-600">
          チームを新規作成するか、招待トークンで既存チームに参加してください。
        </p>
      </header>

      {actionMessage ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </section>
      ) : null}
      {actionError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </section>
      ) : null}
      {inviteFeedback ? (
        <section className={`rounded-lg border px-4 py-3 text-sm ${inviteFeedbackToneClass[inviteFeedback.tone]}`}>
          <p className="font-semibold">{inviteFeedback.title}</p>
          <p className="mt-1">{inviteFeedback.description}</p>
          {inviteFeedback.suggestion ? <p className="mt-1 text-xs">{inviteFeedback.suggestion}</p> : null}
        </section>
      ) : null}
      {currentOrganizationError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {currentOrganizationError instanceof Error
            ? currentOrganizationError.message
            : "チーム状態の取得に失敗しました。"}
        </section>
      ) : null}

      <section className="card p-5">
        {isCurrentOrganizationLoading ? (
          <p className="text-sm text-slate-600">現在のチーム状態を確認中...</p>
        ) : hasCurrentOrganization ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">すでにチームに参加済みです</p>
            <p>
              チーム: <span className="font-semibold">{currentOrganizationName}</span> ({currentOrganizationId})
            </p>
            <p>
              あなたのロール: <span className="font-semibold">{currentRole}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to={existingOrganizationPath} className="btn-secondary">
                {env.billingEnabled
                  ? "請求設定を開く"
                  : canAccessTeamManagement
                    ? "Team管理を開く"
                    : "アカウント情報を開く"}
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            現在はチームに未所属です。以下のいずれかでチームに参加できます。
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="font-display text-lg text-slate-900">1. チームを新規作成</h2>
          <p className="mt-2 text-sm text-slate-600">
            新しいチーム運用を始める場合はこちら。作成者は自動で owner になります。
          </p>
          <label className="mt-4 flex flex-col gap-1 text-xs text-slate-700">
            チーム名
            <input
              type="text"
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="例: PM Journey Team"
              className="input-base"
              disabled={isActionDisabled}
            />
          </label>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={() => void handleCreateOrganization()}
            disabled={isActionDisabled}
          >
            {isCreatePending ? "チームを作成中..." : "チームを作成する"}
          </button>
        </article>

        <article className="card p-5">
          <h2 className="font-display text-lg text-slate-900">2. 招待で既存チームに参加</h2>
          <p className="mt-2 text-sm text-slate-600">
            管理者から共有された招待トークンを入力して参加します。
          </p>
          {inviteTokenFromQuery ? (
            <p className="mt-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700">
              URLの `invite` パラメータから招待トークンを読み込み済みです。必要に応じて編集できます。
            </p>
          ) : null}
          <label className="mt-4 flex flex-col gap-1 text-xs text-slate-700">
            招待トークン
            <input
              type="text"
              value={inviteToken}
              onChange={(event) => setInviteToken(event.target.value)}
              placeholder="org_invite_xxx"
              className="input-base font-mono text-xs"
              disabled={isActionDisabled}
            />
          </label>
          <button
            type="button"
            className="btn-primary mt-4 w-full"
            onClick={() => void handleAcceptInvitation()}
            disabled={isActionDisabled}
          >
            {isAcceptPending ? "招待を受諾中..." : "招待に参加する"}
          </button>
        </article>
      </section>
    </div>
  );
}
