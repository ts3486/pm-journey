import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

type RegistrationStep = "settings" | "confirm";

const TEAM_MEMBER_MIN = 1;
const TEAM_MEMBER_MAX = 10;

const inviteFeedbackToneClass: Record<InviteFeedbackTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const canManageTeamCheckoutRole = (role?: string | null): boolean => {
  return role === "owner" || role === "admin" || role === "manager";
};

const mapCreateOrganizationErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "組織作成に失敗しました。";
  if (/organization name is required/i.test(message)) {
    return "組織名を入力してください。";
  }
  return message;
};

const mapTeamCheckoutErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "チェックアウト開始に失敗しました。";
  if (/FORBIDDEN_ROLE/i.test(message)) {
    return "Teamチェックアウトは owner / admin / manager のみ実行できます。";
  }
  if (/SEAT_QUANTITY_INVALID/i.test(message)) {
    return `メンバー数は ${TEAM_MEMBER_MIN}〜${TEAM_MEMBER_MAX} の範囲で指定してください。`;
  }
  if (/TEAM_FEATURES_DISABLED/i.test(message)) {
    return "Team機能は現在無効です。";
  }
  return message;
};

const parseMemberCount = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
};

const validateMemberCount = (raw: string): string | null => {
  const parsed = parseMemberCount(raw);
  if (parsed == null) {
    return "メンバー数を入力してください。";
  }
  if (parsed < TEAM_MEMBER_MIN || parsed > TEAM_MEMBER_MAX) {
    return `メンバー数は ${TEAM_MEMBER_MIN}〜${TEAM_MEMBER_MAX} の範囲で指定してください。`;
  }
  return null;
};

const checkoutReturnUrl = (origin: string, status: "success" | "cancel") =>
  `${origin}/pricing?checkout=${status}&plan=team`;

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

export const teamCheckoutNavigator = {
  assign(url: string) {
    window.location.assign(url);
  },
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

  const flow = searchParams.get("flow")?.trim().toLowerCase() ?? "";
  const isTeamRegistrationFlow = flow === "register";
  const inviteTokenFromQuery = searchParams.get("invite")?.trim() ?? "";

  const [organizationName, setOrganizationName] = useState("");
  const [inviteToken, setInviteToken] = useState(inviteTokenFromQuery);
  const [isCreatePending, setIsCreatePending] = useState(false);
  const [isAcceptPending, setIsAcceptPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [inviteFeedback, setInviteFeedback] = useState<InviteFeedback | null>(
    inviteTokenFromQuery ? inviteTokenDetectedFeedback() : null,
  );

  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>("settings");
  const [teamNameInput, setTeamNameInput] = useState("");
  const [teamMemberInput, setTeamMemberInput] = useState("5");
  const [teamNameError, setTeamNameError] = useState<string | null>(null);
  const [teamMemberError, setTeamMemberError] = useState<string | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const [createdOrganizationId, setCreatedOrganizationId] = useState<string | null>(null);

  const currentOrganizationId = currentOrganization?.organization.id ?? null;
  const currentOrganizationName = currentOrganization?.organization.name ?? null;
  const currentRole = currentOrganization?.membership.role ?? null;
  const hasCurrentOrganization = Boolean(currentOrganizationId);
  const hasTeamCheckoutRole = canManageTeamCheckoutRole(currentRole);
  const effectiveOrganizationId = currentOrganizationId ?? createdOrganizationId;

  const registrationDisabledReason = useMemo(() => {
    if (isCurrentOrganizationLoading) {
      return "組織情報を確認中です。";
    }
    if (hasCurrentOrganization && !hasTeamCheckoutRole) {
      return "Teamチェックアウトは owner / admin / manager のみ実行できます。";
    }
    return null;
  }, [hasCurrentOrganization, hasTeamCheckoutRole, isCurrentOrganizationLoading]);

  useEffect(() => {
    if (!inviteTokenFromQuery) return;
    setInviteToken(inviteTokenFromQuery);
    setInviteFeedback(inviteTokenDetectedFeedback());
    setActionError(null);
    setActionMessage(null);
  }, [inviteTokenFromQuery]);

  useEffect(() => {
    if (!isTeamRegistrationFlow) return;
    if (!hasCurrentOrganization) return;
    if (!currentOrganizationName) return;
    if (teamNameInput.trim()) return;
    setTeamNameInput(currentOrganizationName);
  }, [currentOrganizationName, hasCurrentOrganization, isTeamRegistrationFlow, teamNameInput]);

  const refreshTeamContext = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.current() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.members() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.progress() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.entitlements.detail() }),
    ]);
  };

  const validateRegistrationInputs = (): { memberCount: number | null } => {
    setTeamNameError(null);
    setTeamMemberError(null);
    setRegistrationError(null);
    setRegistrationMessage(null);

    if (registrationDisabledReason) {
      setRegistrationError(registrationDisabledReason);
      return { memberCount: null };
    }

    if (!hasCurrentOrganization && !teamNameInput.trim()) {
      setTeamNameError("チーム名を入力してください。");
      return { memberCount: null };
    }

    const memberError = validateMemberCount(teamMemberInput);
    if (memberError) {
      setTeamMemberError(memberError);
      return { memberCount: null };
    }

    return {
      memberCount: parseMemberCount(teamMemberInput),
    };
  };

  const handleProceedToConfirmation = () => {
    const { memberCount } = validateRegistrationInputs();
    if (memberCount == null) {
      return;
    }
    setRegistrationStep("confirm");
  };

  const handleBackToSettings = () => {
    setRegistrationStep("settings");
    setRegistrationError(null);
    setRegistrationMessage(null);
  };

  const handleStartTeamCheckout = async () => {
    const { memberCount } = validateRegistrationInputs();
    if (memberCount == null) {
      return;
    }

    setIsCheckoutPending(true);
    try {
      let organizationId = effectiveOrganizationId;
      if (!organizationId) {
        const created = await api.createOrganization({ name: teamNameInput.trim() });
        organizationId = created.id;
        setCreatedOrganizationId(created.id);
        await refreshTeamContext();
      }

      if (!organizationId) {
        setRegistrationError("購入対象の組織が見つかりません。");
        return;
      }

      const origin = window.location.origin;
      const response = await api.createTeamCheckout({
        organizationId,
        seatQuantity: memberCount,
        successUrl: checkoutReturnUrl(origin, "success"),
        cancelUrl: checkoutReturnUrl(origin, "cancel"),
      });

      if (response.alreadyEntitled) {
        setRegistrationMessage("この組織ではすでにTeamプランが有効です。");
        return;
      }

      const checkoutUrl = response.checkoutUrl?.trim();
      if (!checkoutUrl) {
        setRegistrationError("チェックアウトURLを取得できませんでした。時間をおいて再試行してください。");
        return;
      }

      teamCheckoutNavigator.assign(checkoutUrl);
    } catch (error) {
      setRegistrationError(mapTeamCheckoutErrorMessage(error));
    } finally {
      setIsCheckoutPending(false);
    }
  };

  const handleCreateOrganization = async () => {
    setActionError(null);
    setActionMessage(null);

    if (hasCurrentOrganization) {
      setActionError("すでに組織に参加しています。現在の組織設定からTeam管理を進めてください。");
      return;
    }

    const normalizedName = organizationName.trim();
    if (!normalizedName) {
      setActionError("組織名を入力してください。");
      return;
    }

    setIsCreatePending(true);
    try {
      const created = await api.createOrganization({ name: normalizedName });
      await refreshTeamContext();
      setActionMessage(`組織 ${created.name} を作成しました。請求設定へ移動します。`);
      navigate("/settings/billing");
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
        title: "すでに組織参加済みです",
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
        description: "請求設定ページへ移動します。",
      });
      setActionMessage("招待を受諾しました。請求設定へ移動します。");
      navigate("/settings/billing");
    } catch (error) {
      setInviteFeedback(mapInviteAcceptanceFeedback(error));
    } finally {
      setIsAcceptPending(false);
    }
  };

  if (isTeamRegistrationFlow) {
    const previewTeamName = hasCurrentOrganization ? currentOrganizationName : teamNameInput.trim();

    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team Registration</p>
          <h1 className="font-display text-2xl text-slate-900">Team登録フロー</h1>
          <p className="text-sm text-slate-600">
            Team設定を入力し、確認後にStripe決済へ進みます。料金は月額3,000円の固定です。
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            ステップ:{" "}
            <span className="font-semibold">{registrationStep === "settings" ? "1/2 設定入力" : "2/2 確認"}</span>
          </p>
        </section>

        {registrationMessage ? (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {registrationMessage}
          </section>
        ) : null}
        {registrationError ? (
          <section className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {registrationError}
          </section>
        ) : null}
        {currentOrganizationError ? (
          <section className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {currentOrganizationError instanceof Error
              ? currentOrganizationError.message
              : "組織状態の取得に失敗しました。"}
          </section>
        ) : null}

        {registrationStep === "settings" ? (
          <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <article className="card p-5">
              <h2 className="font-display text-lg text-slate-900">1. Team設定を入力</h2>
              <p className="mt-2 text-sm text-slate-600">
                Team名とメンバー数を設定してください。メンバー数は{TEAM_MEMBER_MIN}〜{TEAM_MEMBER_MAX}名です。
              </p>

              {hasCurrentOrganization ? (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  <p>
                    組織: <span className="font-semibold">{currentOrganizationName}</span> ({currentOrganizationId})
                  </p>
                  <p>
                    あなたのロール: <span className="font-semibold">{currentRole}</span>
                  </p>
                </div>
              ) : (
                <label className="mt-4 flex flex-col gap-1 text-xs text-slate-700">
                  チーム名
                  <input
                    type="text"
                    value={teamNameInput}
                    onChange={(event) => {
                      setTeamNameInput(event.target.value);
                      if (teamNameError) setTeamNameError(null);
                    }}
                    placeholder="例: PM Journey Team"
                    className="input-base"
                    disabled={isCheckoutPending}
                  />
                </label>
              )}
              {teamNameError ? <p className="mt-2 text-xs text-rose-700">{teamNameError}</p> : null}

              <label className="mt-4 flex flex-col gap-1 text-xs text-slate-700">
                メンバー数
                <input
                  type="number"
                  inputMode="numeric"
                  min={TEAM_MEMBER_MIN}
                  max={TEAM_MEMBER_MAX}
                  step={1}
                  value={teamMemberInput}
                  onChange={(event) => {
                    setTeamMemberInput(event.target.value);
                    if (teamMemberError) {
                      setTeamMemberError(validateMemberCount(event.target.value));
                    }
                  }}
                  onBlur={() => setTeamMemberError(validateMemberCount(teamMemberInput))}
                  className="input-base"
                  disabled={isCheckoutPending}
                />
              </label>
              {teamMemberError ? <p className="mt-2 text-xs text-rose-700">{teamMemberError}</p> : null}

              {registrationDisabledReason ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {registrationDisabledReason}
                </p>
              ) : null}

              <button
                type="button"
                className="btn-primary mt-4 w-full"
                onClick={handleProceedToConfirmation}
                disabled={isCheckoutPending || Boolean(registrationDisabledReason)}
              >
                確認画面へ進む
              </button>
            </article>

            <article className="card p-5">
              <h2 className="font-display text-lg text-slate-900">別の操作</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link to="/team/onboarding" className="btn-secondary text-center">
                  招待で既存チームに参加
                </Link>
                <Link to="/pricing" className="btn-secondary text-center">
                  料金ページへ戻る
                </Link>
              </div>
            </article>
          </section>
        ) : (
          <section className="card p-5">
            <h2 className="font-display text-lg text-slate-900">2. 設定内容の確認</h2>
            <p className="mt-2 text-sm text-slate-600">内容を確認して、問題なければStripe決済へ進んでください。</p>

            <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
              <p>
                Team名: <span className="font-semibold">{previewTeamName || "-"}</span>
              </p>
              <p>
                メンバー数: <span className="font-semibold">{parseMemberCount(teamMemberInput) ?? "-"}</span>
              </p>
              <p>
                請求: <span className="font-semibold">¥3,000 / 月（固定）</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={handleBackToSettings} disabled={isCheckoutPending}>
                設定に戻る
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleStartTeamCheckout()}
                disabled={isCheckoutPending || Boolean(registrationDisabledReason)}
              >
                {isCheckoutPending ? "Stripeへ遷移中..." : "Stripeで決済へ進む"}
              </button>
            </div>
          </section>
        )}
      </div>
    );
  }

  const isActionDisabled = isCreatePending || isAcceptPending || hasCurrentOrganization;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team Onboarding</p>
        <h1 className="font-display text-2xl text-slate-900">チーム利用の開始</h1>
        <p className="text-sm text-slate-600">
          Teamプラン利用前に、組織を新規作成するか、招待トークンで既存組織に参加してください。
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
            : "組織状態の取得に失敗しました。"}
        </section>
      ) : null}

      <section className="card p-5">
        {isCurrentOrganizationLoading ? (
          <p className="text-sm text-slate-600">現在の組織状態を確認中...</p>
        ) : hasCurrentOrganization ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">すでに組織に参加済みです</p>
            <p>
              組織: <span className="font-semibold">{currentOrganizationName}</span> ({currentOrganizationId})
            </p>
            <p>
              あなたのロール: <span className="font-semibold">{currentRole}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/settings/billing" className="btn-secondary">
                請求設定を開く
              </Link>
              <Link to="/team/onboarding?flow=register" className="btn-secondary">
                Team登録フローへ
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            現在は組織に未所属です。以下のいずれかを完了すると Teamチェックアウトへ進めます。
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="font-display text-lg text-slate-900">1. 組織を新規作成</h2>
          <p className="mt-2 text-sm text-slate-600">
            新しいチーム運用を始める場合はこちら。作成者は自動で owner になります。
          </p>
          <label className="mt-4 flex flex-col gap-1 text-xs text-slate-700">
            組織名
            <input
              type="text"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
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
            {isCreatePending ? "組織を作成中..." : "組織を作成する"}
          </button>
        </article>

        <article className="card p-5">
          <h2 className="font-display text-lg text-slate-900">2. 招待で既存組織に参加</h2>
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
          <Link to="/team/onboarding?flow=register" className="btn-secondary mt-2 block w-full text-center">
            Team登録フローへ進む
          </Link>
        </article>
      </section>
    </div>
  );
}
