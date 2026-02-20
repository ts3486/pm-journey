import { Link, Navigate, useParams } from "react-router-dom";
import { useScenarios, findScenarioById } from "@/queries/scenarios";
import { canViewTeamManagement } from "@/lib/teamAccess";
import {
  useCurrentOrganization,
  useCurrentOrganizationMemberCompletedSessions,
  useCurrentOrganizationProgress,
} from "@/queries/organizations";

const normalizeOptionalText = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const formatStartedAt = (value?: string) => {
  if (!value) return "開始日不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "開始日不明";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function TeamMemberCompletedSessionsPage() {
  const { memberId = "" } = useParams();
  const { data: scenarios } = useScenarios();
  const { data: currentOrganization, isLoading: isCurrentOrganizationLoading } = useCurrentOrganization();
  const currentUserRole = currentOrganization?.membership.role ?? null;
  const canAccessTeamManagement = canViewTeamManagement(currentUserRole);

  const {
    data: organizationProgress,
    isLoading: isProgressLoading,
  } = useCurrentOrganizationProgress(Boolean(memberId) && canAccessTeamManagement);
  const {
    data: sessions = [],
    isLoading: isSessionsLoading,
    isError: isSessionsError,
    error: sessionsError,
  } = useCurrentOrganizationMemberCompletedSessions(memberId, Boolean(memberId) && canAccessTeamManagement);

  const member = organizationProgress?.members.find((item) => item.memberId === memberId);
  const memberName =
    normalizeOptionalText(member?.name) ??
    normalizeOptionalText(member?.email) ??
    "メンバー";

  if (!memberId) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        メンバーIDが指定されていません。
      </section>
    );
  }

  if (!isCurrentOrganizationLoading && currentOrganization && !canAccessTeamManagement) {
    return <Navigate to="/settings/account" replace />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Team Progress</p>
        <h1 className="font-display text-2xl text-slate-900">完了シナリオ詳細</h1>
        <p className="text-sm text-slate-600">
          対象メンバー: <span className="font-semibold text-slate-900">{memberName}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/settings/team" className="btn-secondary">
            Team管理へ戻る
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">完了済みシナリオ一覧</h2>
        <p className="mt-1 text-xs text-slate-500">
          セッション詳細ページでは上長コメントを投稿できます。
        </p>

        {isProgressLoading || isSessionsLoading ? (
          <p className="mt-4 text-sm text-slate-600">読み込み中...</p>
        ) : isSessionsError ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {sessionsError instanceof Error
              ? sessionsError.message
              : "完了済みシナリオの取得に失敗しました。"}
          </p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">完了済みシナリオはまだありません。</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sessions.map((session) => {
              const scenarioTitle =
                findScenarioById(scenarios, session.scenarioId ?? "")?.title ??
                session.scenarioId ??
                "Scenario";
              return (
                <article
                  key={session.sessionId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">
                        {formatStartedAt(session.metadata.startedAt)}
                      </p>
                      <p className="font-semibold text-slate-900">{scenarioTitle}</p>
                      <p className="text-xs text-slate-600">
                        score:{" "}
                        {session.evaluation?.overallScore != null
                          ? `${session.evaluation.overallScore} / 100`
                          : "未評価"}
                        {" · "}
                        comments: {session.comments?.length ?? 0}
                      </p>
                    </div>
                    <Link
                      to={`/history/${session.sessionId}`}
                      className="btn-secondary text-center"
                    >
                      セッション詳細を開く
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
